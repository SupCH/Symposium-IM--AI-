import express from 'express';
import { db } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/conversations
 * 获取当前用户的所有会话
 */
router.get('/', authMiddleware, (req, res) => {
    try {
        const userId = req.user.userId;

        const conversations = db.prepare(`
      SELECT 
        c.id, c.type, c.name, c.avatar, c.created_at,
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND is_read = 0) as unread_count
      FROM conversations c
      JOIN conversation_members cm ON c.id = cm.conversation_id
      WHERE cm.user_id = ?
      ORDER BY last_message_time DESC
    `).all(userId, userId);

        // 对于私聊，获取对方用户信息
        for (const conv of conversations) {
            if (conv.type === 'private') {
                const otherMember = db.prepare(`
          SELECT u.id, u.username, u.nickname, u.avatar, u.status
          FROM conversation_members cm
          JOIN users u ON cm.user_id = u.id
          WHERE cm.conversation_id = ? AND cm.user_id != ?
        `).get(conv.id, userId);

                if (otherMember) {
                    conv.participant = otherMember;
                    conv.name = otherMember.nickname || otherMember.username;
                    conv.avatar = otherMember.avatar;
                }
            }
        }

        res.json({ conversations });

    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ error: 'Failed to get conversations' });
    }
});

/**
 * POST /api/conversations
 * 创建会话（私聊）
 */
router.post('/', authMiddleware, (req, res) => {
    try {
        const { type, participantId } = req.body;
        const userId = req.user.userId;

        if (type === 'private') {
            if (!participantId) {
                return res.status(400).json({ error: 'Participant ID required for private chat' });
            }

            // 检查是否已有私聊会话
            const existing = db.prepare(`
        SELECT c.id FROM conversations c
        JOIN conversation_members cm1 ON c.id = cm1.conversation_id AND cm1.user_id = ?
        JOIN conversation_members cm2 ON c.id = cm2.conversation_id AND cm2.user_id = ?
        WHERE c.type = 'private'
      `).get(userId, participantId);

            if (existing) {
                return res.json({ conversationId: existing.id, existing: true });
            }

            // 创建新私聊
            const result = db.prepare(`
        INSERT INTO conversations (type) VALUES ('private')
      `).run();

            const conversationId = result.lastInsertRowid;

            // 添加成员
            db.prepare(`
        INSERT INTO conversation_members (conversation_id, user_id, role) VALUES (?, ?, 'member')
      `).run(conversationId, userId);
            db.prepare(`
        INSERT INTO conversation_members (conversation_id, user_id, role) VALUES (?, ?, 'member')
      `).run(conversationId, participantId);

            res.status(201).json({ conversationId, existing: false });
        } else {
            return res.status(400).json({ error: 'Use /api/conversations/group for group chats' });
        }

    } catch (error) {
        console.error('Create conversation error:', error);
        res.status(500).json({ error: 'Failed to create conversation' });
    }
});

/**
 * POST /api/conversations/group
 * 创建群组
 */
router.post('/group', authMiddleware, (req, res) => {
    try {
        const { name, memberIds } = req.body;
        const userId = req.user.userId;

        if (!name) {
            return res.status(400).json({ error: 'Group name required' });
        }

        // 创建群组
        const result = db.prepare(`
      INSERT INTO conversations (type, name, owner_id) VALUES ('group', ?, ?)
    `).run(name, userId);

        const conversationId = result.lastInsertRowid;

        // 添加创建者为群主
        db.prepare(`
      INSERT INTO conversation_members (conversation_id, user_id, role) VALUES (?, ?, 'owner')
    `).run(conversationId, userId);

        // 添加其他成员
        if (memberIds && memberIds.length > 0) {
            const insertMember = db.prepare(`
        INSERT INTO conversation_members (conversation_id, user_id, role) VALUES (?, ?, 'member')
      `);
            for (const memberId of memberIds) {
                insertMember.run(conversationId, memberId);
            }
        }

        res.status(201).json({ conversationId, name });

    } catch (error) {
        console.error('Create group error:', error);
        res.status(500).json({ error: 'Failed to create group' });
    }
});

/**
 * GET /api/conversations/:id/messages
 * 获取会话消息历史
 */
router.get('/:id/messages', authMiddleware, (req, res) => {
    try {
        const conversationId = req.params.id;
        const userId = req.user.userId;
        const { limit = 50, before } = req.query;

        // 验证用户是会话成员
        const member = db.prepare(`
      SELECT * FROM conversation_members WHERE conversation_id = ? AND user_id = ?
    `).get(conversationId, userId);

        if (!member) {
            return res.status(403).json({ error: 'Not a member of this conversation' });
        }

        let query = `
      SELECT m.*, u.username, u.nickname, u.avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
    `;
        const params = [conversationId];

        if (before) {
            query += ` AND m.id < ?`;
            params.push(before);
        }

        query += ` ORDER BY m.created_at DESC LIMIT ?`;
        params.push(parseInt(limit));

        const messages = db.prepare(query).all(...params);

        // 标记消息为已读
        db.prepare(`
      UPDATE messages SET is_read = 1 
      WHERE conversation_id = ? AND sender_id != ? AND is_read = 0
    `).run(conversationId, userId);

        res.json({ messages: messages.reverse() });

    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Failed to get messages' });
    }
});

/**
 * GET /api/conversations/:id/members
 * 获取会话成员
 */
router.get('/:id/members', authMiddleware, (req, res) => {
    try {
        const conversationId = req.params.id;

        const members = db.prepare(`
      SELECT u.id, u.username, u.nickname, u.avatar, u.status, cm.role
      FROM conversation_members cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.conversation_id = ?
    `).all(conversationId);

        res.json({ members });

    } catch (error) {
        console.error('Get members error:', error);
        res.status(500).json({ error: 'Failed to get members' });
    }
});

export default router;
