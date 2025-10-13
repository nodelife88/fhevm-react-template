// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * Confidential Messenger (FHEVM)
 *
 * - Mã hoá nội dung tin nhắn phía client/relayer (ciphertext blob lưu on-chain).
 * - Metadata nhạy cảm (đã đọc, quotedId) dùng FHE euintX.
 * - Không dùng FHE trong view/pure.
 * - Dùng FHE.allow / FHE.allowTransient / FHE.makePubliclyDecryptable đúng chuẩn.
 *
 * Lưu ý:
 *  - Nội dung ciphertext blob là opaque (bytes). Quy trình mã hoá/giải mã dùng Relayer SDK ở frontend.
 *  - Nếu bạn muốn cả content là handle FHE (vd ebytes256), có thể mở rộng các hàm nhận externalEbytes256 và FHE.fromExternal.
 */

import { FHE, euint8, euint64, externalEuint8, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";

contract ConfidentialMessenger {
    // ====== Events ======
    event MessageSent(
        uint256 indexed msgId,
        address indexed sender,
        address indexed receiver,
        bytes32 channel,
        uint256 timestamp
    );
    event MessageRead(uint256 indexed msgId);
    event MessageDeleted(uint256 indexed msgId);
    event MessagePublicized(uint256 indexed msgId);

    event ChannelCreated(bytes32 indexed channel, address[] members);
    event ChannelMembersAdded(bytes32 indexed channel, address[] members);
    event ChannelMembersRemoved(bytes32 indexed channel, address[] members);

    // ====== Access roles ======
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }

    // ====== Data Structures ======
    struct Message {
        address sender;
        address receiver;          // zero address khi là channel message
        bytes32 channel;           // keccak256(channelName) hoặc ID do app sinh ra; 0x0 nếu 1:1
        bytes contentCiphertext;   // ciphertext blob (opaque)
        euint8 isRead;             // 0/1 (encrypted)
        euint64 quotedMsgId;       // encrypted quoted msg id (0 nếu không trích dẫn)
        bool isDeleted;            // soft delete (public)
        bool isPublic;             // cho biết đã được publicize (public)
        uint256 timestamp;         // có thể để public để index/paginate nhanh
    }

    // Tập thành viên mỗi channel (phục vụ channel nhỏ/trung bình).
    mapping(bytes32 => mapping(address => bool)) public isChannelMember;
    mapping(bytes32 => address[]) public channelMembers;

    // Hộp thư/inbox, outbox (index phục vụ UI & phân trang)
    mapping(address => uint256[]) public inbox;
    mapping(address => uint256[]) public outbox;

    // Danh sách tin theo channel
    mapping(bytes32 => uint256[]) public channelMsgs;

    // Lưu tin nhắn
    mapping(uint256 => Message) public messages;
    uint256 public nextMsgId = 1;

    constructor() {
        owner = msg.sender;
    }

    // ====== Channel Admin (đơn giản, có thể thay bằng Governor) ======
    function createChannel(bytes32 channel, address[] calldata members) external onlyOwner {
        require(channel != bytes32(0), "channel zero");
        require(channelMembers[channel].length == 0, "channel exists");
        for (uint256 i = 0; i < members.length; i++) {
            address m = members[i];
            if (!isChannelMember[channel][m]) {
                isChannelMember[channel][m] = true;
                channelMembers[channel].push(m);
            }
        }
        emit ChannelCreated(channel, members);
    }

    function addChannelMembers(bytes32 channel, address[] calldata members) external onlyOwner {
        require(channelMembers[channel].length > 0, "channel not found");
        for (uint256 i = 0; i < members.length; i++) {
            address m = members[i];
            if (!isChannelMember[channel][m]) {
                isChannelMember[channel][m] = true;
                channelMembers[channel].push(m);
            }
        }
        emit ChannelMembersAdded(channel, members);
    }

    function removeChannelMembers(bytes32 channel, address[] calldata members) external onlyOwner {
        require(channelMembers[channel].length > 0, "channel not found");
        for (uint256 i = 0; i < members.length; i++) {
            address m = members[i];
            isChannelMember[channel][m] = false;
        }
        emit ChannelMembersRemoved(channel, members);
    }

    // ====== Core: gửi tin nhắn 1:1 ======
    /**
     * @param to người nhận
     * @param contentCiphertext ciphertext blob (được mã hoá ở frontend/relayer)
     * @param quotedIdExt optional encrypted quoted msg id (0 nếu không trích dẫn)
     * @param attestation attestation cho external inputs (FHE.fromExternal)
     */
    function sendMessage(
        address to,
        bytes calldata contentCiphertext,
        externalEuint64 quotedIdExt,
        bytes calldata attestation
    ) external {
        require(to != address(0), "invalid receiver");

        // Lấy encrypted quoted id (0 nếu không có)
        euint64 quotedId = FHE.fromExternal(quotedIdExt, attestation);

        // Tạo cờ isRead = 0 (encrypted)
        euint8 isRead = FHE.asEuint8(0);

        // Lưu message
        uint256 id = nextMsgId++;
        messages[id] = Message({
            sender: msg.sender,
            receiver: to,
            channel: bytes32(0),
            contentCiphertext: contentCiphertext,
            isRead: isRead,
            quotedMsgId: quotedId,
            isDeleted: false,
            isPublic: false,
            timestamp: block.timestamp
        });

        // Cấp quyền truy cập cho metadata FHE (cờ/isRead & quotedId)
        // Cho người gửi, người nhận và contract (để dùng tiếp trong các phép FHE sau này)
        FHE.allow(messages[id].isRead, msg.sender);
        FHE.allow(messages[id].isRead, to);
        FHE.allow(messages[id].isRead, address(this));

        FHE.allow(messages[id].quotedMsgId, msg.sender);
        FHE.allow(messages[id].quotedMsgId, to);
        FHE.allow(messages[id].quotedMsgId, address(this));

        // Indexing
        outbox[msg.sender].push(id);
        inbox[to].push(id);

        emit MessageSent(id, msg.sender, to, bytes32(0), block.timestamp);
    }

    // ====== Core: gửi tin nhắn vào channel (nhóm/DAO nhỏ-trung bình) ======
    /**
     * @param channel ID channel (bytes32). Yêu cầu người gửi là member.
     * @param contentCiphertext ciphertext blob
     * @param quotedIdExt encrypted quoted msg id
     * @param attestation FHE attestation
     */
    function sendToChannel(
        bytes32 channel,
        bytes calldata contentCiphertext,
        externalEuint64 quotedIdExt,
        bytes calldata attestation
    ) external {
        require(channel != bytes32(0), "invalid channel");
        require(isChannelMember[channel][msg.sender], "not channel member");

        euint64 quotedId = FHE.fromExternal(quotedIdExt, attestation);
        euint8 isRead = FHE.asEuint8(0);

        uint256 id = nextMsgId++;
        messages[id] = Message({
            sender: msg.sender,
            receiver: address(0), // channel message
            channel: channel,
            contentCiphertext: contentCiphertext,
            isRead: isRead,
            quotedMsgId: quotedId,
            isDeleted: false,
            isPublic: false,
            timestamp: block.timestamp
        });

        // Cấp quyền metadata FHE cho tất cả thành viên hiện tại (cẩn trọng gas với channel lớn!)
        address[] memory members = channelMembers[channel];
        for (uint256 i = 0; i < members.length; i++) {
            address m = members[i];
            if (isChannelMember[channel][m]) {
                FHE.allow(messages[id].isRead, m);
                FHE.allow(messages[id].quotedMsgId, m);
                inbox[m].push(id);
            }
        }
        // Người gửi (outbox)
        FHE.allow(messages[id].isRead, msg.sender);
        FHE.allow(messages[id].quotedMsgId, msg.sender);
        outbox[msg.sender].push(id);

        // Contract tự cấp quyền
        FHE.allow(messages[id].isRead, address(this));
        FHE.allow(messages[id].quotedMsgId, address(this));

        channelMsgs[channel].push(id);

        emit MessageSent(id, msg.sender, address(0), channel, block.timestamp);
    }

    // ====== Đánh dấu đã đọc (1:1) ======
    function markAsRead(uint256 msgId) external {
        Message storage m = messages[msgId];
        require(!m.isDeleted, "deleted");
        require(m.receiver != address(0), "channel msg");
        require(msg.sender == m.receiver, "only receiver");

        // isRead = isRead OR 1
        euint8 one = FHE.asEuint8(1);
        m.isRead = FHE.or(m.isRead, one);

        // Duy trì quyền truy cập cho cả sender/receiver/this vào handle mới
        FHE.allow(m.isRead, m.sender);
        FHE.allow(m.isRead, m.receiver);
        FHE.allow(m.isRead, address(this));

        emit MessageRead(msgId);
    }

    // ====== Đánh dấu đã đọc (channel) ======
    // Với channel, trạng thái "đã đọc" thường là theo user. Ở đây minh hoạ: cờ chung toàn kênh (đơn giản).
    // Có thể mở rộng thành map msgId=>user=>isReadEncrypted nếu cần per-user read-state (phức tạp & tốn gas).
    function markChannelMessageRead(uint256 msgId) external {
        Message storage m = messages[msgId];
        require(!m.isDeleted, "deleted");
        require(m.channel != bytes32(0), "not channel msg");
        require(isChannelMember[m.channel][msg.sender], "not member");

        euint8 one = FHE.asEuint8(1);
        m.isRead = FHE.or(m.isRead, one);

        // Cấp quyền cho toàn bộ thành viên để đọc cờ mới
        address[] memory members = channelMembers[m.channel];
        for (uint256 i = 0; i < members.length; i++) {
            address mem = members[i];
            if (isChannelMember[m.channel][mem]) {
                FHE.allow(m.isRead, mem);
            }
        }
        FHE.allow(m.isRead, address(this));

        emit MessageRead(msgId);
    }

    // ====== Publicize nội dung (DAO/unseal). Ở đây set flag công khai; phần nội dung blob do client xử lý hiển thị. ======
    function makeMessagePublic(uint256 msgId) external onlyOwner {
        Message storage m = messages[msgId];
        require(!m.isDeleted, "deleted");
        require(!m.isPublic, "already public");

        // Publicize metadata FHE nếu muốn cho phép mọi người đọc (tuỳ chọn)
        // Ví dụ: chỉ publicize quotedMsgId (hoặc cả isRead nếu cần)
        FHE.makePubliclyDecryptable(m.quotedMsgId);
        FHE.makePubliclyDecryptable(m.isRead);

        m.isPublic = true;
        emit MessagePublicized(msgId);
    }

    // ====== Xoá mềm ======
    function softDelete(uint256 msgId) external {
        Message storage m = messages[msgId];
        require(!m.isDeleted, "already deleted");
        // Cho phép sender hoặc receiver (1:1), hoặc sender/member (channel)
        if (m.channel == bytes32(0)) {
            require(msg.sender == m.sender || msg.sender == m.receiver, "not allowed");
        } else {
            require(msg.sender == m.sender || isChannelMember[m.channel][msg.sender], "not allowed");
        }
        m.isDeleted = true;
        emit MessageDeleted(msgId);
    }

    // ====== Truy vấn (view) — không gọi FHE op nào trong view/pure ======
    function getMessageHeader(uint256 msgId)
        external
        view
        returns (
            address sender,
            address receiver,
            bytes32 channel,
            bool isDeleted,
            bool isPublic,
            uint256 timestamp
        )
    {
        Message storage m = messages[msgId];
        return (m.sender, m.receiver, m.channel, m.isDeleted, m.isPublic, m.timestamp);
    }

    function getMessageCiphertext(uint256 msgId) external view returns (bytes memory) {
        return messages[msgId].contentCiphertext;
    }

    // Trả về handle của metadata FHE để client/relayer có thể decrypt (tuỳ quyền)
    // Lưu ý: KHÔNG gọi FHE ops ở đây, chỉ đọc lưu trữ.
    function getMessageEncryptedFlags(uint256 msgId)
        external
        view
        returns (euint8 isRead, euint64 quotedMsgId)
    {
        Message storage m = messages[msgId];
        return (m.isRead, m.quotedMsgId);
    }

    // ====== Helpers: Indexing ======
    function inboxOf(address user) external view returns (uint256[] memory) {
        return inbox[user];
    }

    function outboxOf(address user) external view returns (uint256[] memory) {
        return outbox[user];
    }

    function channelMessages(bytes32 channel) external view returns (uint256[] memory) {
        return channelMsgs[channel];
    }
}
