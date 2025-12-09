import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * 认证状态管理
 */
export const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            login: (user, token) => {
                set({ user, token, isAuthenticated: true });
            },

            logout: () => {
                set({ user: null, token: null, isAuthenticated: false });
            },

            updateUser: (userData) => {
                set((state) => ({
                    user: { ...state.user, ...userData }
                }));
            }
        }),
        {
            name: 'symposium-auth'
        }
    )
);

/**
 * 聊天状态管理
 */
export const useChatStore = create((set, get) => ({
    conversations: [],
    activeConversationId: null,
    messages: {},
    typingUsers: {},

    setConversations: (conversations) => {
        set({ conversations });
    },

    setActiveConversation: (conversationId) => {
        set({ activeConversationId: conversationId });
    },

    addMessage: (conversationId, message) => {
        set((state) => {
            const existingMessages = state.messages[conversationId] || [];
            return {
                messages: {
                    ...state.messages,
                    [conversationId]: [...existingMessages, message]
                }
            };
        });
    },

    setMessages: (conversationId, messages) => {
        set((state) => ({
            messages: {
                ...state.messages,
                [conversationId]: messages
            }
        }));
    },

    setTyping: (conversationId, userId, isTyping) => {
        set((state) => ({
            typingUsers: {
                ...state.typingUsers,
                [`${conversationId}-${userId}`]: isTyping
            }
        }));
    },

    getActiveMessages: () => {
        const state = get();
        return state.messages[state.activeConversationId] || [];
    }
}));

/**
 * 好友状态管理
 */
export const useFriendsStore = create((set) => ({
    friends: [],
    requests: { received: [], sent: [] },
    onlineUsers: new Set(),

    setFriends: (friends) => {
        set({ friends });
    },

    setRequests: (requests) => {
        set({ requests });
    },

    setUserOnline: (userId) => {
        set((state) => {
            const online = new Set(state.onlineUsers);
            online.add(userId);
            return { onlineUsers: online };
        });
    },

    setUserOffline: (userId) => {
        set((state) => {
            const online = new Set(state.onlineUsers);
            online.delete(userId);
            return { onlineUsers: online };
        });
    }
}));
