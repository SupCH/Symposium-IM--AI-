import express from 'express';
import { db } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/friends
 * 获取好友列表
 */
router.get('/', authMiddleware, (req, res) => {
    try {
        const userId = req.user.userId;

        // 获取已接受的好友
        const friends = db.prepare(`
      SELECT u.id, u.username, u.nickname, u.avatar, u.status, f.created_at as friend_since
      FROM friendships f
      JOIN users u ON (
        (f.user_id = ? AND f.friend_id = u.id) OR
        (f.friend_id = ? AND f.user_id = u.id)
      )
      WHERE f.status = 'accepted'
    `).all(userId, userId);

        res.json({ friends });

    } catch (error) {
        console.error('Get friends error:', error);
        res.status(500).json({ error: 'Failed to get friends list' });
    }
});

/**
 * GET /api/friends/requests
 * 获取待处理的好友请求
 */
router.get('/requests', authMiddleware, (req, res) => {
    try {
        const userId = req.user.userId;

        // 收到的请求
        const received = db.prepare(`
      SELECT f.id, u.id as user_id, u.username, u.nickname, u.avatar, f.created_at
      FROM friendships f
      JOIN users u ON f.user_id = u.id
      WHERE f.friend_id = ? AND f.status = 'pending'
    `).all(userId);

        // 发出的请求
        const sent = db.prepare(`
      SELECT f.id, u.id as user_id, u.username, u.nickname, u.avatar, f.created_at
      FROM friendships f
      JOIN users u ON f.friend_id = u.id
      WHERE f.user_id = ? AND f.status = 'pending'
    `).all(userId);

        res.json({ received, sent });

    } catch (error) {
        console.error('Get friend requests error:', error);
        res.status(500).json({ error: 'Failed to get friend requests' });
    }
});

/**
 * POST /api/friends/request
 * 发送好友请求
 */
router.post('/request', authMiddleware, (req, res) => {
    try {
        const { friendId } = req.body;
        const userId = req.user.userId;

        if (!friendId) {
            return res.status(400).json({ error: 'Friend ID required' });
        }

        if (friendId === userId) {
            return res.status(400).json({ error: 'Cannot add yourself as friend' });
        }

        // 检查目标用户是否存在
        const targetUser = db.prepare('SELECT id FROM users WHERE id = ?').get(friendId);
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // 检查是否已有关系
        const existing = db.prepare(`
      SELECT * FROM friendships 
      WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
    `).get(userId, friendId, friendId, userId);

        if (existing) {
            if (existing.status === 'accepted') {
                return res.status(400).json({ error: 'Already friends' });
            }
            return res.status(400).json({ error: 'Friend request already exists' });
        }

        // 创建好友请求
        db.prepare(`
      INSERT INTO friendships (user_id, friend_id, status)
      VALUES (?, ?, 'pending')
    `).run(userId, friendId);

        res.status(201).json({ message: 'Friend request sent' });

    } catch (error) {
        console.error('Send friend request error:', error);
        res.status(500).json({ error: 'Failed to send friend request' });
    }
});

/**
 * POST /api/friends/accept/:id
 * 接受好友请求
 */
router.post('/accept/:id', authMiddleware, (req, res) => {
    try {
        const requestId = req.params.id;
        const userId = req.user.userId;

        // 验证请求存在且是发给当前用户的
        const request = db.prepare(`
      SELECT * FROM friendships WHERE id = ? AND friend_id = ? AND status = 'pending'
    `).get(requestId, userId);

        if (!request) {
            return res.status(404).json({ error: 'Friend request not found' });
        }

        db.prepare(`UPDATE friendships SET status = 'accepted' WHERE id = ?`).run(requestId);

        res.json({ message: 'Friend request accepted' });

    } catch (error) {
        console.error('Accept friend request error:', error);
        res.status(500).json({ error: 'Failed to accept friend request' });
    }
});

/**
 * POST /api/friends/reject/:id
 * 拒绝好友请求
 */
router.post('/reject/:id', authMiddleware, (req, res) => {
    try {
        const requestId = req.params.id;
        const userId = req.user.userId;

        const request = db.prepare(`
      SELECT * FROM friendships WHERE id = ? AND friend_id = ? AND status = 'pending'
    `).get(requestId, userId);

        if (!request) {
            return res.status(404).json({ error: 'Friend request not found' });
        }

        db.prepare(`DELETE FROM friendships WHERE id = ?`).run(requestId);

        res.json({ message: 'Friend request rejected' });

    } catch (error) {
        console.error('Reject friend request error:', error);
        res.status(500).json({ error: 'Failed to reject friend request' });
    }
});

/**
 * DELETE /api/friends/:id
 * 删除好友
 */
router.delete('/:id', authMiddleware, (req, res) => {
    try {
        const friendId = req.params.id;
        const userId = req.user.userId;

        db.prepare(`
      DELETE FROM friendships 
      WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
    `).run(userId, friendId, friendId, userId);

        res.json({ message: 'Friend removed' });

    } catch (error) {
        console.error('Remove friend error:', error);
        res.status(500).json({ error: 'Failed to remove friend' });
    }
});

export default router;
