export const FHESealrABI = {
"abi": [
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "convId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "enum ConfidentialMessenger.ConversationType",
          "name": "ctype",
          "type": "uint8"
        }
      ],
      "name": "ConversationCreated",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        }
      ],
      "name": "nameExists",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "convId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "by",
          "type": "address"
        }
      ],
      "name": "ConversationDeleted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "msgId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "convId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        }
      ],
      "name": "MessageSent",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "msgId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "by",
          "type": "address"
        }
      ],
      "name": "ReactionChanged",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "msgId",
          "type": "uint256"
        },
        {
          "internalType": "externalEuint256",
          "name": "reactionExt",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "proof",
          "type": "bytes"
        }
      ],
      "name": "changeReaction",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "conversations",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "internalType": "enum ConfidentialMessenger.ConversationType",
          "name": "ctype",
          "type": "uint8"
        },
        {
          "internalType": "address",
          "name": "creator",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "uint64",
          "name": "createdAt",
          "type": "uint64"
        },
        {
          "internalType": "enum ConfidentialMessenger.Status",
          "name": "status",
          "type": "uint8"
        },
        {
          "internalType": "bool",
          "name": "deleted",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "address[]",
          "name": "members",
          "type": "address[]"
        }
      ],
      "name": "createGroupConversation",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "avatarUrl",
          "type": "string"
        }
      ],
      "name": "createProfile",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "avatarUrl",
          "type": "string"
        }
      ],
      "name": "updateProfile",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "conversationId",
          "type": "uint256"
        }
      ],
      "name": "deleteConversation",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "msgId",
          "type": "uint256"
        }
      ],
      "name": "getMessage",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "conversationId",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "sender",
              "type": "address"
            },
            {
              "internalType": "uint64",
              "name": "createdAt",
              "type": "uint64"
            },
            {
              "internalType": "enum ConfidentialMessenger.Status",
              "name": "status",
              "type": "uint8"
            },
            {
              "internalType": "euint256[]",
              "name": "content",
              "type": "bytes32[]"
            },
            {
              "internalType": "euint256",
              "name": "reaction",
              "type": "bytes32"
            }
          ],
          "internalType": "struct ConfidentialMessenger.Message",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "conversationId",
          "type": "uint256"
        }
      ],
      "name": "getMessages",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "conversationId",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "sender",
              "type": "address"
            },
            {
              "internalType": "uint64",
              "name": "createdAt",
              "type": "uint64"
            },
            {
              "internalType": "enum ConfidentialMessenger.Status",
              "name": "status",
              "type": "uint8"
            },
            {
              "internalType": "euint256[]",
              "name": "content",
              "type": "bytes32[]"
            },
            {
              "internalType": "euint256",
              "name": "reaction",
              "type": "bytes32"
            }
          ],
          "internalType": "struct ConfidentialMessenger.Message[]",
          "name": "out",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "other",
          "type": "address"
        }
      ],
      "name": "getOrCreateDirectConversation",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getProfile",
      "outputs": [
        {
          "components": [
            {
              "internalType": "string",
              "name": "name",
              "type": "string"
            },
            {
              "internalType": "address",
              "name": "wallet",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "avatarUrl",
              "type": "string"
            },
            {
              "internalType": "uint64",
              "name": "createdAt",
              "type": "uint64"
            },
            {
              "internalType": "bool",
              "name": "active",
              "type": "bool"
            }
          ],
          "internalType": "struct ConfidentialMessenger.UserProfile",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "userAddress",
          "type": "address"
        }
      ],
      "name": "getProfileByAddress",
      "outputs": [
        {
          "components": [
            {
              "internalType": "string",
              "name": "name",
              "type": "string"
            },
            {
              "internalType": "address",
              "name": "wallet",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "avatarUrl",
              "type": "string"
            },
            {
              "internalType": "uint64",
              "name": "createdAt",
              "type": "uint64"
            },
            {
              "internalType": "bool",
              "name": "active",
              "type": "bool"
            }
          ],
          "internalType": "struct ConfidentialMessenger.UserProfile",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getProfiles",
      "outputs": [
        {
          "components": [
            {
              "internalType": "string",
              "name": "name",
              "type": "string"
            },
            {
              "internalType": "address",
              "name": "wallet",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "avatarUrl",
              "type": "string"
            },
            {
              "internalType": "uint64",
              "name": "createdAt",
              "type": "uint64"
            },
            {
              "internalType": "bool",
              "name": "active",
              "type": "bool"
            }
          ],
          "internalType": "struct ConfidentialMessenger.UserProfile[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "messages",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "conversationId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "sender",
          "type": "address"
        },
        {
          "internalType": "uint64",
          "name": "createdAt",
          "type": "uint64"
        },
        {
          "internalType": "enum ConfidentialMessenger.Status",
          "name": "status",
          "type": "uint8"
        },
        {
          "internalType": "euint256",
          "name": "reaction",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "myConversations",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            },
            {
              "internalType": "enum ConfidentialMessenger.ConversationType",
              "name": "ctype",
              "type": "uint8"
            },
            {
              "internalType": "address",
              "name": "creator",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "name",
              "type": "string"
            },
            {
              "internalType": "address[]",
              "name": "members",
              "type": "address[]"
            },
            {
              "internalType": "uint64",
              "name": "createdAt",
              "type": "uint64"
            },
            {
              "internalType": "enum ConfidentialMessenger.Status",
              "name": "status",
              "type": "uint8"
            },
            {
              "internalType": "bool",
              "name": "deleted",
              "type": "bool"
            }
          ],
          "internalType": "struct ConfidentialMessenger.Conversation[]",
          "name": "out",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "profiles",
      "outputs": [
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "address",
          "name": "wallet",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "avatarUrl",
          "type": "string"
        },
        {
          "internalType": "uint64",
          "name": "createdAt",
          "type": "uint64"
        },
        {
          "internalType": "bool",
          "name": "active",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "protocolId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "conversationId",
          "type": "uint256"
        },
        {
          "internalType": "externalEuint256[]",
          "name": "contentExt",
          "type": "bytes32[]"
        },
        {
          "internalType": "bytes[]",
          "name": "proofs",
          "type": "bytes[]"
        },
        {
          "internalType": "externalEuint256",
          "name": "reactionExt",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "reactionProof",
          "type": "bytes"
        }
      ],
      "name": "sendMessage",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],
} as const;
