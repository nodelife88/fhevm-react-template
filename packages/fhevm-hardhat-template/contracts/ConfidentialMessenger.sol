// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint256, externalEuint256} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract ConfidentialMessenger is SepoliaConfig {
    enum Status { SENT, DELIVERED, READ }
    enum ConversationType { DIRECT, GROUP }

    struct UserProfile {
        string name;
        address wallet;
        string avatarUrl;
        uint64 createdAt;
        bool active;
    }

    struct Message {
        uint256 id;
        uint256 conversationId;
        address sender;
        uint64 createdAt;
        Status status;
        euint256[] content;
        euint256 reaction;
    }

    struct Conversation {
        uint256 id;
        ConversationType ctype;
        address creator;
        string name;
        address[] members;
        uint64 createdAt;
        Status status;
        bool deleted;
    }

    uint256 private _nextMessageId = 1;
    uint256 private _nextConversationId = 1;

    mapping(address => UserProfile) public profiles;
    mapping(string => address) private _nameToAddress;
    address[] private _allUsers;

    mapping(uint256 => Conversation) public conversations;
    mapping(bytes32 => uint256) private _directKeyToId;
    mapping(address => uint256[]) private _userConversations;

    mapping(uint256 => Message) public messages;
    mapping(uint256 => uint256[]) private _conversationIndex;

    event MessageSent(uint256 indexed msgId, uint256 indexed convId, address indexed from);
    event ConversationCreated(uint256 indexed convId, ConversationType ctype);
    event ConversationDeleted(uint256 indexed convId, address indexed by);
    event ReactionChanged(uint256 indexed msgId, address indexed by);

    modifier onlyProfile() {
        require(bytes(profiles[msg.sender].name).length > 0, "Profile required");
        _;
    }

    function createProfile(string memory name, string memory avatarUrl) external {
        require(bytes(name).length > 0, "Empty name");
        require(bytes(profiles[msg.sender].name).length == 0, "Profile exists");
        require(_nameToAddress[name] == address(0), "Name taken");

        profiles[msg.sender] = UserProfile(name, msg.sender, avatarUrl, uint64(block.timestamp), true);
        _nameToAddress[name] = msg.sender;
        _allUsers.push(msg.sender);
    }

    function getProfile() external view returns (UserProfile memory) {
        require(bytes(profiles[msg.sender].name).length > 0, "Profile not found");
        return profiles[msg.sender];
    }

    function getProfiles() external view returns (UserProfile[] memory) {
        UserProfile[] memory allProfiles = new UserProfile[](_allUsers.length);
        for (uint i = 0; i < _allUsers.length; i++) {
            allProfiles[i] = profiles[_allUsers[i]];
        }
        return allProfiles;
    }

    function getProfileByAddress(address userAddress) external view returns (UserProfile memory) {
        require(bytes(profiles[userAddress].name).length > 0, "Profile not found");
        return profiles[userAddress];
    }

    function getOrCreateDirectConversation(address other) external onlyProfile returns (uint256) {
        require(msg.sender != other, "Cannot chat with self");
        require(bytes(profiles[other].name).length > 0, "User not found");

        bytes32 key = _convKey(msg.sender, other);
        uint256 id = _directKeyToId[key];
        if (id != 0) return id;

        id = _nextConversationId++;
        address[] memory participants = new address[](2);
        participants[0] = msg.sender;
        participants[1] = other;

        conversations[id] = Conversation({
            id: id,
            ctype: ConversationType.DIRECT,
            creator: msg.sender,
            name: profiles[other].name,
            members: participants,
            createdAt: uint64(block.timestamp),
            status: Status.SENT,
            deleted: false
        });

        _directKeyToId[key] = id;
        _userConversations[msg.sender].push(id);
        _userConversations[other].push(id);

        emit ConversationCreated(id, ConversationType.DIRECT);
        return id;
    }

    function createGroupConversation(string memory name, address[] calldata members) external onlyProfile returns (uint256) {
        require(members.length > 1, "Minimum 2 members");

        uint256 id = _nextConversationId++;
        address[] memory all = new address[](members.length + 1);
        all[0] = msg.sender;
        for (uint i = 0; i < members.length; i++) {
            all[i + 1] = members[i];
        }

        conversations[id] = Conversation({
            id: id,
            ctype: ConversationType.GROUP,
            creator: msg.sender,
            name: name,
            members: all,
            createdAt: uint64(block.timestamp),
            status: Status.SENT,
            deleted: false
        });

        for (uint i = 0; i < all.length; i++) {
            _userConversations[all[i]].push(id);
        }

        emit ConversationCreated(id, ConversationType.GROUP);
        return id;
    }

    function sendMessage(
        uint256 conversationId,
        externalEuint256[] calldata contentExt,
        bytes[] calldata proofs,
        externalEuint256 reactionExt,
        bytes calldata reactionProof
    ) external onlyProfile {
        Conversation storage conv = conversations[conversationId];
        require(conv.id != 0, "Conversation not found");

        bool isMember = false;
        for (uint i = 0; i < conv.members.length; i++) {
            if (conv.members[i] == msg.sender) {
                isMember = true;
                break;
            }
        }
        require(isMember, "Not a conversation member");
        require(contentExt.length == proofs.length, "Mismatched proofs");

        euint256[] memory contentCT = new euint256[](contentExt.length);
        for (uint i = 0; i < contentExt.length; i++) {
            contentCT[i] = FHE.fromExternal(contentExt[i], proofs[i]);
            FHE.allowThis(contentCT[i]);
            for (uint j = 0; j < conv.members.length; j++) {
                FHE.allow(contentCT[i], conv.members[j]);
            }
        }

        euint256 reactionCT = FHE.fromExternal(reactionExt, reactionProof);
        FHE.allowThis(reactionCT);
        for (uint j = 0; j < conv.members.length; j++) {
            FHE.allow(reactionCT, conv.members[j]);
        }

        uint256 msgId = _nextMessageId++;
        messages[msgId] = Message(msgId, conversationId, msg.sender, uint64(block.timestamp), Status.SENT, contentCT, reactionCT);
        _conversationIndex[conversationId].push(msgId);

        emit MessageSent(msgId, conversationId, msg.sender);
    }

    function changeReaction(uint256 msgId, externalEuint256 reactionExt, bytes calldata proof) external onlyProfile {
        Message storage m = messages[msgId];
        require(m.id != 0, "Message does not exist");
        
        // Check if user is a member of the conversation
        Conversation storage conv = conversations[m.conversationId];
        bool isMember = false;
        for (uint i = 0; i < conv.members.length; i++) {
            if (conv.members[i] == msg.sender) {
                isMember = true;
                break;
            }
        }
        require(isMember, "Not authorized to change reaction");

        // Decode new reaction ciphertext
        euint256 newReaction = FHE.fromExternal(reactionExt, proof);
        FHE.allowThis(newReaction);
        
        // Allow all conversation members to decrypt
        for (uint j = 0; j < conv.members.length; j++) {
            FHE.allow(newReaction, conv.members[j]);
        }

        // Update reaction
        m.reaction = newReaction;

        emit ReactionChanged(msgId, msg.sender);
    }

    function getMessages(uint256 conversationId) external view returns (Message[] memory out) {
        uint256[] memory ids = _conversationIndex[conversationId];
        out = new Message[](ids.length);
        for (uint i = 0; i < ids.length; i++) {
            out[i] = messages[ids[i]];
        }
    }

    function getMessage(uint256 msgId) external view returns (Message memory) {
        require(messages[msgId].id != 0, "Message does not exist");
        return messages[msgId];
    }

    function myConversations(address user) external view returns (Conversation[] memory out) {
        uint256[] memory ids = _userConversations[user];
        
        // First pass: count non-deleted conversations
        uint256 count = 0;
        for (uint i = 0; i < ids.length; i++) {
            if (!conversations[ids[i]].deleted) {
                count++;
            }
        }
        
        // Second pass: populate array with non-deleted conversations
        out = new Conversation[](count);
        uint256 j = 0;
        for (uint i = 0; i < ids.length; i++) {
            if (!conversations[ids[i]].deleted) {
                out[j++] = conversations[ids[i]];
            }
        }
    }

    function deleteConversation(uint256 conversationId) external onlyProfile {
        Conversation storage conv = conversations[conversationId];
        require(conv.id != 0, "Conversation does not exist");
        require(!conv.deleted, "Conversation already deleted");
        
        // Check if user is a member of the conversation
        bool isMember = false;
        for (uint i = 0; i < conv.members.length; i++) {
            if (conv.members[i] == msg.sender) {
                isMember = true;
                break;
            }
        }
        require(isMember, "Not authorized to delete conversation");

        // Soft delete - mark as deleted
        conv.deleted = true;

        emit ConversationDeleted(conversationId, msg.sender);
    }

    function _convKey(address a, address b) internal pure returns (bytes32) {
        return (a < b) ? keccak256(abi.encodePacked(a, b)) : keccak256(abi.encodePacked(b, a));
    }
}