import { io } from 'socket.io-client';
import { useAuthStore, useChatStore, useFriendsStore } from '../store';

let socket = null;

/**
 * 连接 WebSocket
 */
export function connectSocket() {
    const token = useAuthStore.getState().token;

    if (!token || socket?.connected) return;

    socket = io('http://localhost:50001', {
        auth: { token }
    });

    socket.on('connect', () => {
        console.log('✦ WebSocket connected');
    });

    socket.on('disconnect', () => {
        console.log('✧ WebSocket disconnected');
    });

    // 新消息
    socket.on('new_message', (message) => {
        useChatStore.getState().addMessage(message.conversation_id, message);
    });

    // 用户上线
    socket.on('user_online', ({ userId }) => {
        useFriendsStore.getState().setUserOnline(userId);
    });

    // 用户离线
    socket.on('user_offline', ({ userId }) => {
        useFriendsStore.getState().setUserOffline(userId);
    });

    // 正在输入
    socket.on('typing', ({ userId, conversationId }) => {
        useChatStore.getState().setTyping(conversationId, userId, true);
        // 3秒后自动清除
        setTimeout(() => {
            useChatStore.getState().setTyping(conversationId, userId, false);
        }, 3000);
    });

    // 停止输入
    socket.on('stop_typing', ({ userId, conversationId }) => {
        useChatStore.getState().setTyping(conversationId, userId, false);
    });

    // 好友请求
    socket.on('friend_request', (data) => {
        console.log('New friend request:', data);
        // 可以添加通知逻辑
    });

    return socket;
}

/**
 * 断开 WebSocket
 */
export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

/**
 * 发送消息
 */
export function sendMessage(conversationId, content, type = 'text') {
    if (!socket?.connected) return;
    socket.emit('send_message', { conversationId, content, type });
}

/**
 * 发送正在输入状态
 */
export function sendTyping(conversationId) {
    if (!socket?.connected) return;
    socket.emit('typing', { conversationId });
}

/**
 * 发送停止输入状态
 */
export function sendStopTyping(conversationId) {
    if (!socket?.connected) return;
    socket.emit('stop_typing', { conversationId });
}

/**
 * 加入会话房间
 */
export function joinConversation(conversationId) {
    if (!socket?.connected) return;
    socket.emit('join_conversation', { conversationId });
}

/**
 * 标记消息已读
 */
export function markAsRead(conversationId, messageId) {
    if (!socket?.connected) return;
    socket.emit('read_message', { conversationId, messageId });
}

export { socket };
