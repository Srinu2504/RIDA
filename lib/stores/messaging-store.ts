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
  totalUnread: number;
  setTotalUnread: (n: number) => void;
  widgetOpen: boolean;
  setWidgetOpen: (open: boolean) => void;
  toggleWidget: () => void;
  openConversation: (conversationId: string) => void;
}

export const useMessagingStore = create<MessagingState>((set, get) => ({
  activeConversationId: null,
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  conversations: [],
  setConversations: (items) => {
    const totalUnread = items.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
    set({ conversations: items, totalUnread });
  },
  totalUnread: 0,
  setTotalUnread: (n) => set({ totalUnread: n }),
  widgetOpen: false,
  setWidgetOpen: (open) => set({ widgetOpen: open }),
  toggleWidget: () => set({ widgetOpen: !get().widgetOpen }),
  openConversation: (conversationId) =>
    set({ activeConversationId: conversationId, widgetOpen: true }),
}));

