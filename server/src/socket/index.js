import { db } from '../db/index.js';
import { verifyToken } from '../middleware/auth.js';

// 在线用户映射: userId -> socketId
const onlineUsers = new Map();

/**
 * 设置 Socket.IO 事件处理
 */
export function setupSocket(io) {
    io.use((socket, next) => {
        // 验证 token
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication required'));
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return next(new Error('Invalid token'));
        }

        socket.userId = decoded.userId;
        socket.username = decoded.username;
        next();
    });

    io.on('connection', (socket) => {
        console.log(`✦ User connected: ${socket.username} (${socket.userId})`);

        // 记录在线状态
        onlineUsers.set(socket.userId, socket.id);

        // 更新数据库状态
        db.prepare('UPDATE users SET status = ? WHERE id = ?').run('online', socket.userId);

        // 通知好友上线
        notifyFriendsStatusChange(io, socket.userId, 'online');

        // 加入用户自己的房间（用于接收私人消息）
        socket.join(`user:${socket.userId}`);

        // 加入所有会话的房间
        const conversations = db.prepare(`
      SELECT conversation_id FROM conversation_members WHERE user_id = ?
    `).all(socket.userId);

        for (const conv of conversations) {
            socket.join(`conversation:${conv.conversation_id}`);
        }

        /**
         * 发送消息
         */
        socket.on('send_message', (data) => {
            const { conversationId, content, type = 'text' } = data;

            try {
                // 保存消息到数据库
                const result = db.prepare(`
          INSERT INTO messages (conversation_id, sender_id, type, content)
          VALUES (?, ?, ?, ?)
        `).run(conversationId, socket.userId, type, content);

                const messageId = result.lastInsertRowid;

                // 获取完整消息信息
                const message = db.prepare(`
          SELECT m.*, u.username, u.nickname, u.avatar
          FROM messages m
          JOIN users u ON m.sender_id = u.id
          WHERE m.id = ?
        `).get(messageId);

                // 广播给会话中的所有成员
                io.to(`conversation:${conversationId}`).emit('new_message', message);

            } catch (error) {
                console.error('Send message error:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        /**
         * 正在输入提示
         */
        socket.on('typing', (data) => {
            const { conversationId } = data;
            socket.to(`conversation:${conversationId}`).emit('typing', {
                userId: socket.userId,
                username: socket.username,
                conversationId
            });
        });

        /**
         * 停止输入
         */
        socket.on('stop_typing', (data) => {
            const { conversationId } = data;
            socket.to(`conversation:${conversationId}`).emit('stop_typing', {
                userId: socket.userId,
                conversationId
            });
        });

        /**
         * 标记消息已读
         */
        socket.on('read_message', (data) => {
            const { conversationId, messageId } = data;

            try {
                if (messageId) {
                    db.prepare('UPDATE messages SET is_read = 1 WHERE id = ?').run(messageId);
                } else {
                    db.prepare(`
            UPDATE messages SET is_read = 1 
            WHERE conversation_id = ? AND sender_id != ?
          `).run(conversationId, socket.userId);
                }
            } catch (error) {
                console.error('Read message error:', error);
            }
        });

        /**
         * 加入新会话
         */
        socket.on('join_conversation', (data) => {
            const { conversationId } = data;
            socket.join(`conversation:${conversationId}`);
        });

        /**
         * 断开连接
         */
        socket.on('disconnect', () => {
            console.log(`✧ User disconnected: ${socket.username}`);

            onlineUsers.delete(socket.userId);
            db.prepare('UPDATE users SET status = ? WHERE id = ?').run('offline', socket.userId);

            notifyFriendsStatusChange(io, socket.userId, 'offline');
        });
    });
}

/**
 * 通知好友状态变化
 */
function notifyFriendsStatusChange(io, userId, status) {
    const friends = db.prepare(`
    SELECT CASE 
      WHEN f.user_id = ? THEN f.friend_id 
      ELSE f.user_id 
    END as friend_id
    FROM friendships f
    WHERE (f.user_id = ? OR f.friend_id = ?) AND f.status = 'accepted'
  `).all(userId, userId, userId);

    for (const friend of friends) {
        io.to(`user:${friend.friend_id}`).emit(
            status === 'online' ? 'user_online' : 'user_offline',
            { userId }
        );
    }
}

/**
 * 获取在线用户列表
 */
export function getOnlineUsers() {
    return Array.from(onlineUsers.keys());
}

/**
 * 检查用户是否在线
 */
export function isUserOnline(userId) {
    return onlineUsers.has(userId);
}
