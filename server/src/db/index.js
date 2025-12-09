import initSqlJs from 'sql.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../data/symposium.db');

// 确保 data 目录存在
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db = null;

/**
 * 初始化数据库
 */
async function initDatabase() {
  const SQL = await initSqlJs();

  // 如果数据库文件存在，加载它
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // 启用外键约束
  db.run('PRAGMA foreign_keys = ON');

  // 创建表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar TEXT DEFAULT '/default-avatar.png',
      nickname TEXT,
      status TEXT DEFAULT 'offline',
      is_ai INTEGER DEFAULT 0,
      ai_prompt TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS friendships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      friend_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, friend_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      name TEXT,
      avatar TEXT,
      owner_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS conversation_members (
      conversation_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'member',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (conversation_id, user_id),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      type TEXT DEFAULT 'text',
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_read INTEGER DEFAULT 0,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 创建索引
  db.run(`CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id)`);

  // 创建预设 AI 用户
  await createPresetAIUsers();

  // 保存数据库
  saveDatabase();

  console.log('✓ Database initialized successfully');
}

/**
 * 创建预设 AI 用户
 */
async function createPresetAIUsers() {
  const aiUsers = [
    {
      username: 'academic_assistant',
      email: 'academic@ai.symposium',
      nickname: '学术助手',
      avatar: '/ai-academic.png',
      ai_prompt: '你是一位专业的学术助手，擅长论文写作、文献引用、学术讨论。请用专业但友好的语气回复，可以使用中英文。回复要简洁有深度。'
    },
    {
      username: 'chat_buddy',
      email: 'buddy@ai.symposium',
      nickname: '闲聊伙伴',
      avatar: '/ai-buddy.png',
      ai_prompt: '你是一位友善的聊天伙伴，性格开朗幽默。请用轻松愉快的语气聊天，可以开玩笑，分享有趣的话题。回复要自然亲切。'
    },
    {
      username: 'tech_advisor',
      email: 'tech@ai.symposium',
      nickname: '技术顾问',
      avatar: '/ai-tech.png',
      ai_prompt: '你是一位资深技术顾问，精通编程、软件开发、系统架构。请用专业的技术语言回答问题，提供代码示例时要清晰规范。'
    }
  ];

  for (const aiUser of aiUsers) {
    // 检查是否已存在
    const stmt = db.prepare('SELECT id FROM users WHERE username = ?');
    stmt.bind([aiUser.username]);
    const exists = stmt.step();
    stmt.free();

    if (!exists) {
      db.run(
        `INSERT INTO users (username, email, password_hash, nickname, avatar, status, is_ai, ai_prompt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [aiUser.username, aiUser.email, 'AI_NO_PASSWORD', aiUser.nickname, aiUser.avatar, 'online', 1, aiUser.ai_prompt]
      );
      console.log(`✓ Created AI user: ${aiUser.nickname}`);
    }
  }

  // 创建管理员账号
  await createAdminUser();
}

/**
 * 创建管理员账号
 */
async function createAdminUser() {
  const bcrypt = await import('bcryptjs');

  const stmt = db.prepare('SELECT id FROM users WHERE username = ?');
  stmt.bind(['admin']);
  const exists = stmt.step();
  stmt.free();

  if (!exists) {
    const passwordHash = bcrypt.default.hashSync('admin123', 10);
    db.run(
      `INSERT INTO users (username, email, password_hash, nickname, avatar, status, is_ai)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['admin', 'admin@symposium.local', passwordHash, 'Administrator', '/default-avatar.png', 'offline', 0]
    );
    console.log('✓ Created admin user: admin / admin123');
  }
}

/**
 * 保存数据库到文件
 */
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

/**
 * 封装查询方法 - 兼容 better-sqlite3 风格的 API
 */
const dbWrapper = {
  prepare(sql) {
    return {
      run(...params) {
        db.run(sql, params);
        saveDatabase();
        // 获取 lastInsertRowid
        const result = db.exec('SELECT last_insert_rowid() as id');
        return { lastInsertRowid: result[0]?.values[0]?.[0] || 0 };
      },
      get(...params) {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const row = stmt.getAsObject();
          stmt.free();
          return row;
        }
        stmt.free();
        return null;
      },
      all(...params) {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        const results = [];
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      }
    };
  },
  exec(sql) {
    db.run(sql);
    saveDatabase();
  }
};

export { dbWrapper as db, initDatabase };
