import { create } from "zustand";

export interface ConversationListItem {
  id: string;
  otherDoctor: { id: string; name: string; avatar: string | null; specialty: string };
  lastMessagePreview: string;
  lastMessageCreatedAt: string | null;
  unreadCount: number;
  lastMessageAt: string | null;
}

interface MessagingState {
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  conversations: ConversationListItem[];
  setConversations: (items: ConversationListItem[]) => void;
}

export const useMessagingStore = create<MessagingState>((set) => ({
  activeConversationId: null,
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  conversations: [],
  setConversations: (items) => set({ conversations: items }),
}));

