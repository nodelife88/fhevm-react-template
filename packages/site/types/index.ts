export type Conversation = {
  id: number;
  info?: string;
  sender?: string;
  receiver?: string;
  senderName?: string;
  receiverName?: string;
  createdAt?: number;
  status?: number;
  type?: "direct" | "group";
  ctype?: number;
  members?: string[];
};

export type GroupConversation = {
  id: number;
  creator: string;
  name: string;
  members: string[];
  createdAt: number;
  status: number;
};

export type Message = {
  id: number;
  content: string;
  createdAt: number;
  sender: string;
  direction: "incoming" | "outgoing";
  position?: "single" | "first" | "middle" | "last";
  avatar?: string;
  reaction: ReactionType;
};

export type EncryptedMessage = {
  id: bigint;
  createdAt: bigint;
  sender: string;
  content: Uint8Array[];
  reaction: Uint8Array;
};

export type UserProfile = {
  id: string;
  wallet: string;
  name: string;
  avatarUrl: string;
  createdAt: number;
  active: boolean;
};

export enum ReactionType {
  NONE = "none",
  LIKE = "like",
  LOVE = "love",
  HAHA = "haha",
  WOW = "wow",
  SAD = "sad",
  ANGRY = "angry",
}

export const ReactionMap: Record<ReactionType, string> = {
  [ReactionType.NONE]: "",
  [ReactionType.LIKE]: "👍",
  [ReactionType.LOVE]: "❤️",
  [ReactionType.HAHA]: "😂",
  [ReactionType.WOW]: "😮",
  [ReactionType.SAD]: "😢",
  [ReactionType.ANGRY]: "😡",
};
