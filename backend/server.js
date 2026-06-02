const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェアの設定
app.use(cors());
app.use(express.json());

// PostgreSQLへの接続設定
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ──────────────────────────────────────────
// 1. 認証チェック用ミドルウェア（必ずAPIより上に配置します）
// ──────────────────────────────────────────
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'アクセストークンがありません。ログインしてください。' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'トークンが無効または期限切れです。' });
    }
    req.user = user;
    next();
  });
};

// ──────────────────────────────────────────
// 2. ユーザー登録API
// ──────────────────────────────────────────
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'すべての項目を入力してください。' });
  }

  try {
    // すでに同じメールアドレスやユーザー名が登録されていないかチェック
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'ユーザー名またはメールアドレスが既に登録されています。' });
    }

    // パスワードをハッシュ化する
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // データベースに保存
    const newUser = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, passwordHash]
    );

    res.status(201).json({
      message: 'ユーザー登録が完了しました。',
      user: newUser.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました。' });
  }
});

// ──────────────────────────────────────────
// 3. ログインAPI
// ──────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'メールアドレスとパスワードを入力してください。' });
  }

  try {
    // ユーザーチェック
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'メールアドレスまたはパスワードが正しくありません。' });
    }

    const user = result.rows[0];

    // パスワードの照合
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'メールアドレスまたはパスワードが正しくありません。' });
    }

    // JWTトークンの発行
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'ログインに成功しました。',
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました。' });
  }
});

// ──────────────────────────────────────────
// 4. スレッド作成API（ログイン必須）
// ──────────────────────────────────────────
app.post('/api/threads', authenticateToken, async (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'タイトルを入力してください。' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO threads (title, user_id) VALUES ($1, $2) RETURNING *',
      [title, req.user.userId]
    );

    res.status(201).json({
      message: 'スレッドを作成しました。',
      thread: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました。' });
  }
});

// ──────────────────────────────────────────
// 5. スレッド一覧取得API（ログイン必須）
// ──────────────────────────────────────────
app.get('/api/threads', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.id, t.title, t.created_at, u.username 
      FROM threads t
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました。' });
  }
});

// ──────────────────────────────────────────
// 6. 特定スレッドのコメント一覧取得API（ログイン必須）
// ──────────────────────────────────────────
app.get('/api/threads/:threadId/posts', authenticateToken, async (req, res) => {
  const { threadId } = req.params;

  try {
    // 誰が書き込んだか分かるように users テーブルと JOIN します
    const result = await pool.query(`
      SELECT p.id, p.content, p.created_at, u.username 
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.thread_id = $1
      ORDER BY p.created_at ASC
    `, [threadId]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました。' });
  }
});

// ──────────────────────────────────────────
// 7. コメント投稿API（ログイン必須）
// ──────────────────────────────────────────
app.post('/api/threads/:threadId/posts', authenticateToken, async (req, res) => {
  const { threadId } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'コメント内容を入力してください。' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO posts (thread_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
      [threadId, req.user.userId, content]
    );

    res.status(201).json({
      message: 'コメントを投稿しました。',
      post: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました。' });
  }
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});