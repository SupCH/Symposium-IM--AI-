import express from 'express';
import { db } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/users/search
 * 搜索用户
 */
router.get('/search', authMiddleware, (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.length < 2) {
            return res.status(400).json({
                error: 'Query too short',
                message: 'Search query must be at least 2 characters'
            });
        }

        const users = db.prepare(`
      SELECT id, username, nickname, avatar, status 
      FROM users 
      WHERE (username LIKE ? OR nickname LIKE ?) AND id != ?
      LIMIT 20
    `).all(`%${q}%`, `%${q}%`, req.user.userId);

        res.json({ users });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Failed to search users' });
    }
});

/**
 * GET /api/users/:id
 * 获取用户详情
 */
router.get('/:id', authMiddleware, (req, res) => {
    try {
        const { id } = req.params;

        const user = db.prepare(`
      SELECT id, username, nickname, avatar, status, created_at 
      FROM users WHERE id = ?
    `).get(id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

/**
 * PUT /api/users/profile
 * 更新个人资料
 */
router.put('/profile', authMiddleware, (req, res) => {
    try {
        const { nickname, avatar } = req.body;
        const userId = req.user.userId;

        const updates = [];
        const values = [];

        if (nickname !== undefined) {
            updates.push('nickname = ?');
            values.push(nickname);
        }
        if (avatar !== undefined) {
            updates.push('avatar = ?');
            values.push(avatar);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(userId);
        db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

        const user = db.prepare(
            'SELECT id, username, nickname, avatar, status FROM users WHERE id = ?'
        ).get(userId);

        res.json({ message: 'Profile updated', user });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

export default router;
