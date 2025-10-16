// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * Confidential Messenger (FHEVM)
 *
 * - Message content encrypted on client/relayer side (ciphertext blob stored on-chain).
 * - Sensitive metadata (read status, quotedId) uses FHE euintX.
 * - No FHE operations in view/pure functions.
 * - Uses FHE.allow / FHE.allowTransient / FHE.makePubliclyDecryptable correctly.
 *
 * Notes:
 *  - Content ciphertext blob is opaque (bytes). Encryption/decryption process uses Relayer SDK on frontend.
 *  - If you want content as FHE handle (e.g., ebytes256), extend functions to accept externalEbytes256 and FHE.fromExternal.
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
        address receiver;          // zero address when it's a channel message
        bytes32 channel;           // keccak256(channelName) or app-generated ID; 0x0 if 1:1
        bytes contentCiphertext;   // ciphertext blob (opaque)
        euint8 isRead;             // 0/1 (encrypted)
        euint64 quotedMsgId;       // encrypted quoted msg id (0 if no quote)
        bool isDeleted;            // soft delete (public)
        bool isPublic;             // indicates if publicized (public)
        uint256 timestamp;         // can be public for fast indexing/pagination
    }

    // Channel membership set (for small/medium channels).
    mapping(bytes32 => mapping(address => bool)) public isChannelMember;
    mapping(bytes32 => address[]) public channelMembers;

    // Inbox/outbox (index for UI & pagination)
    mapping(address => uint256[]) public inbox;
    mapping(address => uint256[]) public outbox;

    // Message list by channel
    mapping(bytes32 => uint256[]) public channelMsgs;

    // Store messages
    mapping(uint256 => Message) public messages;
    uint256 public nextMsgId = 1;

    constructor() {
        owner = msg.sender;
    }

    // ====== Channel Admin (simple, can be replaced with Governor) ======
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

    // ====== Core: send 1:1 message ======
    /**
     * @param to recipient
     * @param contentCiphertext ciphertext blob (encrypted on frontend/relayer)
     * @param quotedIdExt optional encrypted quoted msg id (0 if no quote)
     * @param attestation attestation for external inputs (FHE.fromExternal)
     */
    function sendMessage(
        address to,
        bytes calldata contentCiphertext,
        externalEuint64 quotedIdExt,
        bytes calldata attestation
    ) external {
        require(to != address(0), "invalid receiver");

        // Get encrypted quoted id (0 if none)
        euint64 quotedId = FHE.fromExternal(quotedIdExt, attestation);

        // Create isRead flag = 0 (encrypted)
        euint8 isRead = FHE.asEuint8(0);

        // Store message
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

        // Grant access to FHE metadata (isRead flag & quotedId)
        // For sender, receiver and contract (for future FHE operations)
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

    // ====== Core: send message to channel (small-medium groups/DAOs) ======
    /**
     * @param channel channel ID (bytes32). Requires sender to be a member.
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

        // Grant FHE metadata access to all current members (be careful with gas for large channels!)
        address[] memory members = channelMembers[channel];
        for (uint256 i = 0; i < members.length; i++) {
            address m = members[i];
            if (isChannelMember[channel][m]) {
                FHE.allow(messages[id].isRead, m);
                FHE.allow(messages[id].quotedMsgId, m);
                inbox[m].push(id);
            }
        }
        // Sender (outbox)
        FHE.allow(messages[id].isRead, msg.sender);
        FHE.allow(messages[id].quotedMsgId, msg.sender);
        outbox[msg.sender].push(id);

        // Contract grants itself access
        FHE.allow(messages[id].isRead, address(this));
        FHE.allow(messages[id].quotedMsgId, address(this));

        channelMsgs[channel].push(id);

        emit MessageSent(id, msg.sender, address(0), channel, block.timestamp);
    }

    // ====== Mark as read (1:1) ======
    function markAsRead(uint256 msgId) external {
        Message storage m = messages[msgId];
        require(!m.isDeleted, "deleted");
        require(m.receiver != address(0), "channel msg");
        require(msg.sender == m.receiver, "only receiver");

        // isRead = isRead OR 1
        euint8 one = FHE.asEuint8(1);
        m.isRead = FHE.or(m.isRead, one);

        // Maintain access for sender/receiver/this to new handle
        FHE.allow(m.isRead, m.sender);
        FHE.allow(m.isRead, m.receiver);
        FHE.allow(m.isRead, address(this));

        emit MessageRead(msgId);
    }

    // ====== Mark as read (channel) ======
    // For channels, "read" status is usually per-user. Here illustrates: global channel flag (simple).
    // Can be extended to map msgId=>user=>isReadEncrypted if per-user read-state needed (complex & gas expensive).
    function markChannelMessageRead(uint256 msgId) external {
        Message storage m = messages[msgId];
        require(!m.isDeleted, "deleted");
        require(m.channel != bytes32(0), "not channel msg");
        require(isChannelMember[m.channel][msg.sender], "not member");

        euint8 one = FHE.asEuint8(1);
        m.isRead = FHE.or(m.isRead, one);

        // Grant access to all members to read new flag
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

    // ====== Publicize content (DAO/unseal). Here sets public flag; content blob display handled by client. ======
    function makeMessagePublic(uint256 msgId) external onlyOwner {
        Message storage m = messages[msgId];
        require(!m.isDeleted, "deleted");
        require(!m.isPublic, "already public");

        // Publicize FHE metadata if you want to allow everyone to read (optional)
        // Example: only publicize quotedMsgId (or isRead too if needed)
        FHE.makePubliclyDecryptable(m.quotedMsgId);
        FHE.makePubliclyDecryptable(m.isRead);

        m.isPublic = true;
        emit MessagePublicized(msgId);
    }

    // ====== Soft delete ======
    function softDelete(uint256 msgId) external {
        Message storage m = messages[msgId];
        require(!m.isDeleted, "already deleted");
        // Allow sender or receiver (1:1), or sender/member (channel)
        if (m.channel == bytes32(0)) {
            require(msg.sender == m.sender || msg.sender == m.receiver, "not allowed");
        } else {
            require(msg.sender == m.sender || isChannelMember[m.channel][msg.sender], "not allowed");
        }
        m.isDeleted = true;
        emit MessageDeleted(msgId);
    }

    // ====== Queries (view) — no FHE ops in view/pure functions ======
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

    // Returns FHE metadata handle for client/relayer to decrypt (subject to permissions)
    // Note: NO FHE ops here, only read storage.
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
