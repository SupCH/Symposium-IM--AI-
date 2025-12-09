import express from 'express';
import { db } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/ai/users
 * 获取所有 AI 用户列表
 */
router.get('/users', authMiddleware, (req, res) => {
    try {
        const aiUsers = db.prepare(`
      SELECT id, username, nickname, avatar, status, ai_prompt
      FROM users 
      WHERE is_ai = 1
    `).all();

        res.json({ aiUsers });

    } catch (error) {
        console.error('Get AI users error:', error);
        res.status(500).json({ error: 'Failed to get AI users' });
    }
});

/**
 * POST /api/ai/start-chat/:aiUserId
 * 开始与 AI 用户对话
 */
router.post('/start-chat/:aiUserId', authMiddleware, async (req, res) => {
    try {
        const { aiUserId } = req.params;
        const userId = req.user.userId;

        // 验证 AI 用户存在
        const aiUser = db.prepare('SELECT id FROM users WHERE id = ? AND is_ai = 1').get(aiUserId);
        if (!aiUser) {
            return res.status(404).json({ error: 'AI user not found' });
        }

        // 检查是否已有私聊会话
        const existing = db.prepare(`
      SELECT c.id FROM conversations c
      JOIN conversation_members cm1 ON c.id = cm1.conversation_id AND cm1.user_id = ?
      JOIN conversation_members cm2 ON c.id = cm2.conversation_id AND cm2.user_id = ?
      WHERE c.type = 'private'
    `).get(userId, aiUserId);

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
    `).run(conversationId, aiUserId);

        res.status(201).json({ conversationId, existing: false });

    } catch (error) {
        console.error('Start AI chat error:', error);
        res.status(500).json({ error: 'Failed to start chat with AI' });
    }
});

export default router;
