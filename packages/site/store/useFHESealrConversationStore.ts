import { create } from "zustand";
import { Message, EncryptedMessage, Conversation } from "@/types";
import { useFHESealrStore } from "./useFHESealrStore";
import { useFHESealrLoginStore } from "./useFHESealrLoginStore";

type SealrConversationStore = {
  loading: boolean;
  setLoading: (value: boolean) => void;

  conversations: Conversation[];
  addConversation: (convo: Conversation) => void;
  fetchConversations: () => Promise<Conversation[] | void>;
  getOrCreateDirectConversation: (toAddress: string) => Promise<number>;
  
  // Cache to prevent excessive onchain calls
  lastFetchTime: number;
  fetchTimeout: NodeJS.Timeout | null;

  // Group chat functionality - simplified
  createGroup: (name: string, members: string[]) => Promise<boolean>;
  deleteConversation: (conversationId: number) => Promise<boolean>;

  activeConversation: Conversation | null;
  getActiveConversation: () => Conversation | null;
  setActiveConversation: (conversation: Conversation | null) => void;

  activeMessages: Message[];
  setActiveMessages: (messages: Message[]) => void;
  getActiveMessages: () => Message[];
  fetchActiveMessages: (id: number) => Promise<EncryptedMessage[]>;
  sendMessage: (messages: { ciphertexts: Uint8Array[]; proofs: Uint8Array[] }, reaction: { ciphertext: Uint8Array; proof: Uint8Array }) => Promise<void>;
  fetchMessage: (id: number) => Promise<EncryptedMessage | void>;

  reactionMessage: (messageId: number, reaction: { ciphertext: Uint8Array; proof: Uint8Array }) => Promise<boolean>;
  
  clearState: () => void;
};

export const useFHESealrConversationStore =
  create<SealrConversationStore>((set, get) => ({
    loading: false,
    setLoading: (value: boolean) => set({ loading: value }),

    conversations: [],
    getActiveConversation: () => get().activeConversation,
    addConversation: (convo) => set((s) => ({ conversations: [convo, ...s.conversations] })),
    
    // Cache to prevent excessive onchain calls
    lastFetchTime: 0,
    fetchTimeout: null,

    // Group chat functionality - simplified
    createGroup: async (name: string, members: string[]) => {
      try {
        const { contractTx } = useFHESealrStore.getState();
        if (!contractTx) {
          console.error('Contract not ready');
          return false;
        }

        const tx = await contractTx.createGroupConversation(name, members);
        await tx.wait();
        console.log('Group created successfully');
        return true;
      } catch (err) {
        console.error("Create group failed", err);
        return false;
      }
    },
    deleteConversation: async (conversationId: number) => {
      try {
        const { contractTx } = useFHESealrStore.getState();
        if (!contractTx) {
          console.error('Contract not ready');
          return false;
        }

        const tx = await contractTx.deleteConversation(conversationId);
        await tx.wait();
        console.log('Conversation deleted successfully');
        
        // Remove from local state
        const { conversations } = get();
        const updatedConversations = conversations.filter(conv => conv.id !== conversationId);
        set({ conversations: updatedConversations });
        
        // Clear active conversation if it was deleted
        const { activeConversation } = get();
        if (activeConversation?.id === conversationId) {
          set({ activeConversation: null, activeMessages: [] });
        }
        
        return true;
      } catch (err) {
        console.error("Delete conversation failed", err);
        return false;
      }
    },
    fetchConversations: async () => {
      const now = Date.now()
      const { lastFetchTime, fetchTimeout } = get()
      
      // Prevent excessive calls - only fetch if more than 5 seconds have passed
      if (now - lastFetchTime < 5000) {
        console.log('Skipping fetchConversations - too recent')
        return get().conversations
      }
      
      // Clear any pending timeout
      if (fetchTimeout) {
        clearTimeout(fetchTimeout)
      }
      
      try {
        const { contractView } = useFHESealrStore.getState();
        const { profile } = useFHESealrLoginStore.getState();

        console.log('fetchConversations - checking dependencies:', {
          hasContractView: !!contractView,
          hasProfile: !!profile,
          profileWallet: profile?.wallet,
          lastFetchTime: new Date(lastFetchTime).toISOString()
        });

        if (!contractView || !profile?.wallet) {
          console.warn('Missing dependencies for fetchConversations');
          return [];
        }

        console.log('Calling myConversations with wallet:', profile.wallet);
        const rawConversations = await contractView?.myConversations(profile?.wallet);
        console.log('Raw conversations from contract:', rawConversations);
        
        // Handle case where conversations is null/undefined or not an array
        if (!rawConversations || !Array.isArray(rawConversations)) {
          console.warn('Invalid conversations data:', rawConversations);
          set({ conversations: [], lastFetchTime: now });
          return [];
        }

        // Map contract data to frontend format
        const mappedConversations: Conversation[] = await Promise.all(rawConversations.map(async (rawConv: any) => {
          const isDirect = Number(rawConv.ctype) === 0; // Convert BigInt to number first
          
          // Debug log for each conversation
          console.log('Mapping conversation from contract:', {
            id: rawConv.id,
            ctype: rawConv.ctype,
            name: rawConv.name,
            creator: rawConv.creator,
            members: rawConv.members,
            membersLength: rawConv.members?.length,
            isDirect
          });
          
          if (isDirect) {
            // For direct conversations, find the other participant
            const otherMember = rawConv.members.find((member: string) => 
              member.toLowerCase() !== profile.wallet.toLowerCase()
            );
            
            // Fetch the other person's profile to get their name
            let otherPersonName = "Unknown User";
            try {
              if (otherMember && contractView) {
                const otherProfile = await contractView.getProfileByAddress(otherMember);
                otherPersonName = otherProfile.name;
              }
            } catch (err) {
              console.warn("Failed to fetch other person's profile:", err);
            }
            
            console.log('Direct conversation mapping:', {
              currentUser: profile.wallet,
              currentUserName: profile.name,
              otherMember,
              contractName: rawConv.name,
              otherPersonName,
              members: rawConv.members
            });
            
            return {
              id: Number(rawConv.id),
              ctype: rawConv.ctype,
              type: "direct" as const,
              sender: profile.wallet,
              receiver: otherMember,
              senderName: profile.name,
              receiverName: otherPersonName,
              createdAt: Number(rawConv.createdAt),
              status: rawConv.status,
              members: rawConv.members
            };
          } else {
            // For group conversations
            return {
              id: Number(rawConv.id),
              ctype: rawConv.ctype,
              type: "group" as const,
              sender: rawConv.creator,
              senderName: rawConv.name,
              receiverName: rawConv.name,
              createdAt: Number(rawConv.createdAt),
              status: rawConv.status,
              members: rawConv.members,
              info: `${rawConv.members.length} members`
            };
          }
        }));

        const sortedConversations = [...mappedConversations].sort((a: Conversation, b: Conversation) => (Number(b.createdAt ?? 0)) - (Number(a.createdAt ?? 0)));
        console.log('Mapped and sorted conversations:', sortedConversations);
        set({ conversations: sortedConversations, lastFetchTime: now });

        return sortedConversations;
      } catch (err) {
        console.error("Fetch conversations failed", err);
        set({ conversations: [], lastFetchTime: now });
        return [];
      }
    },

    getOrCreateDirectConversation: async (toAddress: string) => {
      try {
        const { contractTx } = useFHESealrStore.getState();
        
        if (!contractTx) {
          throw new Error("Contract not initialized");
        }

        console.log("Getting or creating direct conversation with:", toAddress);
        const conversationId = await contractTx.getOrCreateDirectConversation(toAddress);
        console.log("Direct conversation ID:", conversationId.toString());
        
        return Number(conversationId);
      } catch (err) {
        console.error("Get or create direct conversation failed", err);
        throw err;
      }
    },

    activeConversation: null,
    setActiveConversation: (conversation) => set({ activeConversation: conversation }),

    activeMessages: [],
    setActiveMessages: (messages) => set({ activeMessages: messages }),
    getActiveMessages: () => get().activeMessages,
    
    fetchActiveMessages: async (conversationId: number) => {
      try {
        const { contractView } = useFHESealrStore.getState();
        const messages = await contractView?.getMessages(conversationId);
        return messages || [];
      } catch (err) {
        console.error("Get active messages failed", err);
        return [];
      }
    },
    sendMessage: async (messageEnc, reactionEnc) => {
      try {
        const { activeConversation } = get()
        const { contractTx } = useFHESealrStore.getState();
        
        if (!activeConversation?.id) {
          throw new Error("No active conversation");
        }

        const tx = await contractTx?.sendMessage(
          activeConversation.id, 
          messageEnc.ciphertexts,
          messageEnc.proofs,
          reactionEnc.ciphertext,
          reactionEnc.proof
        )
        await tx.wait();
      } catch (err) {
        console.error("Send message failed", err);
        throw err; // Re-throw to handle in UI
      }
    },
    fetchMessage: async (messageId) => {
      try {
        const { contractView } = useFHESealrStore.getState();
        if (!contractView) {
          console.error("Contract view not available");
          return undefined;
        }
        
        const message = await contractView.getMessage(messageId);
        return message;
      } catch (err) {
        console.error("Fetch message failed", err);
        return undefined;
      }
    },
    reactionMessage: async (messageId, reactionEnc): Promise<boolean> => {
      try {
        const { contractTx } = useFHESealrStore.getState();
        if (!contractTx) {
          console.error("Contract transaction not available");
          return false;
        }
        
        const tx = await contractTx.changeReaction(messageId, reactionEnc.ciphertext, reactionEnc.proof);
        await tx.wait();
        console.log("Reaction changed successfully");
        return true;
      } catch (err) {
        console.error("Reaction message failed", err);
        return false;
      }
    },

    clearState: () => {
      const { fetchTimeout } = get()
      if (fetchTimeout) {
        clearTimeout(fetchTimeout)
      }
      
      set({
        loading: false,
        conversations: [],
        activeConversation: null,
        activeMessages: [],
        lastFetchTime: 0,
        fetchTimeout: null,
      });
    }
  }));
