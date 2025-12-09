import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * 用户注册
 */
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, nickname } = req.body;

        // 参数验证
        if (!username || !email || !password) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Username, email and password are required'
            });
        }

        // 检查用户是否已存在
        const existingUser = db.prepare(
            'SELECT id FROM users WHERE username = ? OR email = ?'
        ).get(username, email);

        if (existingUser) {
            return res.status(409).json({
                error: 'User exists',
                message: 'Username or email already registered'
            });
        }

        // 密码加密
        const passwordHash = await bcrypt.hash(password, 10);

        // 创建用户
        const result = db.prepare(`
      INSERT INTO users (username, email, password_hash, nickname)
      VALUES (?, ?, ?, ?)
    `).run(username, email, passwordHash, nickname || username);

        const userId = result.lastInsertRowid;
        const token = generateToken(userId, username);

        res.status(201).json({
            message: 'Registration successful',
            user: {
                id: userId,
                username,
                email,
                nickname: nickname || username
            },
            token
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to register user'
        });
    }
});

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                error: 'Missing credentials',
                message: 'Username and password are required'
            });
        }

        // 查找用户
        const user = db.prepare(
            'SELECT * FROM users WHERE username = ? OR email = ?'
        ).get(username, username);

        if (!user) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'User not found'
            });
        }

        // 验证密码
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Incorrect password'
            });
        }

        // 更新用户状态为在线
        db.prepare('UPDATE users SET status = ? WHERE id = ?').run('online', user.id);

        const token = generateToken(user.id, user.username);

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                nickname: user.nickname,
                avatar: user.avatar,
                status: 'online'
            },
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to login'
        });
    }
});

/**
 * POST /api/auth/logout
 * 用户登出
 */
router.post('/logout', async (req, res) => {
    // 如果需要可以在这里处理 token 失效等逻辑
    res.json({ message: 'Logout successful' });
});

/**
 * GET /api/auth/me
 * 获取当前用户信息
 */
router.get('/me', async (req, res) => {
    // 需要 authMiddleware
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET || 'symposium-im-secret');

        const user = db.prepare(
            'SELECT id, username, email, nickname, avatar, status, created_at FROM users WHERE id = ?'
        ).get(decoded.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch {
        return res.status(401).json({ error: 'Invalid token' });
    }
});

export default router;
