import { create } from "zustand";
import { Message, EncryptedMessage, Conversation } from "@/types";
import { useFHESealrStore } from "./useFHESealrStore";
import { useFHESealrLoginStore } from "./useFHESealrLoginStore";

export type SendingStatus = 
  | "idle"
  | "encrypting"
  | "submitting";

type SealrConversationStore = {
  loading: boolean;
  setLoading: (value: boolean) => void;
  
  sendingStatus: SendingStatus;
  setSendingStatus: (status: SendingStatus) => void;
  
  isSendingMessage: boolean;
  setIsSendingMessage: (value: boolean) => void;

  conversations: Conversation[];
  addConversation: (convo: Conversation) => void;
  fetchConversations: () => Promise<Conversation[] | void>;
  getOrCreateDirectConversation: (toAddress: string) => Promise<number>;
  
  lastFetchTime: number;
  fetchTimeout: NodeJS.Timeout | null;

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
    
    sendingStatus: "idle",
    setSendingStatus: (status: SendingStatus) => set({ sendingStatus: status }),
    
    isSendingMessage: false,
    setIsSendingMessage: (value: boolean) => set({ isSendingMessage: value }),

    conversations: [],
    getActiveConversation: () => get().activeConversation,
    addConversation: (convo) => set((s) => ({ conversations: [convo, ...s.conversations] })),
    
    lastFetchTime: 0,
    fetchTimeout: null,
    createGroup: async (name: string, members: string[]) => {
      try {
        const { contractTx } = useFHESealrStore.getState();
        if (!contractTx) {
          return false;
        }

        const tx = await contractTx.createGroupConversation(name, members);
        await tx.wait();
        return true;
      } catch (err) {
        return false;
      }
    },
    deleteConversation: async (conversationId: number) => {
      try {
        const { contractTx } = useFHESealrStore.getState();
        if (!contractTx) {
          return false;
        }

        const tx = await contractTx.deleteConversation(conversationId);
        await tx.wait();
        
        const { conversations } = get();
        const updatedConversations = conversations.filter(conv => conv.id !== conversationId);
        set({ conversations: updatedConversations });
        
        const { activeConversation } = get();
        if (activeConversation?.id === conversationId) {
          set({ activeConversation: null, activeMessages: [] });
        }
        
        return true;
      } catch (err) {
        return false;
      }
    },
    fetchConversations: async () => {
      const now = Date.now()
      const { lastFetchTime, fetchTimeout } = get()
      
      if (now - lastFetchTime < 5000) {
        return get().conversations
      }
      
      if (fetchTimeout) {
        clearTimeout(fetchTimeout)
      }
      
      try {
        const { contractView } = useFHESealrStore.getState();
        const { profile } = useFHESealrLoginStore.getState();

        if (!contractView || !profile?.wallet) {
          return [];
        }

        const rawConversations = await contractView?.myConversations(profile?.wallet);
        
        if (!rawConversations || !Array.isArray(rawConversations)) {
          set({ conversations: [], lastFetchTime: now });
          return [];
        }

        const mappedConversations: Conversation[] = await Promise.all(rawConversations.map(async (rawConv: any) => {
          const isDirect = Number(rawConv.ctype) === 0;
          
          if (isDirect) {
            const otherMember = rawConv.members.find((member: string) => 
              member.toLowerCase() !== profile.wallet.toLowerCase()
            );
            
            let otherPersonName = "Unknown User";
            try {
              if (otherMember && contractView) {
                const otherProfile = await contractView.getProfileByAddress(otherMember);
                otherPersonName = otherProfile.name;
              }
            } catch (err) {
              // Silent failure
            }
            
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
        set({ conversations: sortedConversations, lastFetchTime: now });

        return sortedConversations;
      } catch (err) {
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

        const conversationId = await contractTx.getOrCreateDirectConversation(toAddress);
        
        return Number(conversationId);
      } catch (err) {
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
        throw err; 
      }
    },
    fetchMessage: async (messageId) => {
      try {
        const { contractView } = useFHESealrStore.getState();
        if (!contractView) {
          return undefined;
        }
        
        const message = await contractView.getMessage(messageId);
        return message;
      } catch (err) {
        return undefined;
      }
    },
    reactionMessage: async (messageId, reactionEnc): Promise<boolean> => {
      try {
        const { contractTx } = useFHESealrStore.getState();
        if (!contractTx) {
          return false;
        }
        
        const tx = await contractTx.changeReaction(messageId, reactionEnc.ciphertext, reactionEnc.proof);
        await tx.wait();
        return true;
      } catch (err) {
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
        sendingStatus: "idle",
        isSendingMessage: false,
        conversations: [],
        activeConversation: null,
        activeMessages: [],
        lastFetchTime: 0,
        fetchTimeout: null,
      });
    }
  }));
