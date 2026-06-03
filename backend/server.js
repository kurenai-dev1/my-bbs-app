const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

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
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'ユーザー名またはメールアドレスが既に登録されています。' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // ─── 【追加】ランダムな確認トークンを生成 ───
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // INSERTに verification_token を追加 (is_verifiedはデフォルトでfalseになります)
    const newUser = await pool.query(
      'INSERT INTO users (username, email, password_hash, display_name, verification_token) VALUES ($1, $2, $3, $1, $4) RETURNING id, username, email',
      [username, email, passwordHash, verificationToken]
    );

    // ─── 【模擬メール送信】コンソールに確認URLを出力 ───
    const verificationUrl = `http://localhost:3000/api/verify?token=${verificationToken}`;
    console.log('\n==================================================');
    console.log(`【メール模擬送信】 ${username} さん宛て`);
    console.log(`以下のURLをクリックしてアカウントを有効化してください：`);
    console.log(verificationUrl);
    console.log('==================================================\n');

    res.status(201).json({
      message: '仮登録が完了しました。メール（バックエンドのターミナル）に届いた確認URLをクリックして本登録を完了させてください。'
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

    // ─── 【追加】未認証ユーザーを弾く ───
    if (!user.is_verified) {
      return res.status(400).json({ error: 'メールアドレスの確認が完了していません。メール内のリンクをクリックしてください。' });
    }

    // パスワードの照合
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'メールアドレスまたはパスワードが正しくありません。' });
    }

    // JWTトークンの発行
    const token = jwt.sign(
      { userId: user.id, username: user.username, isAdmin: user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // ログイン成功：レスポンスにも isAdmin を含める
    res.json({
      message: 'ログインに成功しました。',
      token,
      // user: { id: user.id, username: user.username, email: user.email, isAdmin: user.is_admin } 
      user: { id: user.id, username: user.display_name, isAdmin: user.is_admin } // user.username から user.display_name に変更
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
  const page = parseInt(req.query.page) || 1;
  const sort = req.query.sort || 'thread_new'; // デフォルトはスレッド新着順
  const limit = 5; 
  const offset = (page - 1) * limit;

  try {
    // 1. 総件数の取得
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM threads WHERE is_deleted = false'
    );
    const totalThreads = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalThreads / limit);

    // 2. 並び替え条件（ORDER BY）の動的組み立て
    // COALESCE(MAX(p.created_at), t.created_at) は「最新コメント日時、なければスレ作成日時」を意味します
    let orderByClause = 'ORDER BY t.created_at DESC'; // thread_new（スレ新着順）
    
    if (sort === 'comment_new') {
      orderByClause = 'ORDER BY COALESCE(MAX(p.created_at), t.created_at) DESC'; // コメント新着順
    }

    // SQLをグループ化（GROUP BY）に対応させて、最新コメント時間を計算できるようにします
    const result = await pool.query(`
      SELECT 
        t.id, 
        t.title, 
        t.created_at, 
        t.user_id, 
        u.display_name AS username,
        COALESCE(MAX(p.created_at), t.created_at) AS last_activity
      FROM threads t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN posts p ON t.id = p.thread_id AND p.is_deleted = false
      WHERE t.is_deleted = false
      GROUP BY t.id, u.display_name
      ${orderByClause}
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    res.json({
      threads: result.rows,
      currentPage: page,
      totalPages: totalPages
    });
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
    const result = await pool.query(`
      SELECT p.id, p.content, p.created_at, p.user_id, u.display_name AS username 
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.thread_id = $1 AND p.is_deleted = false
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

// ──────────────────────────────────────────
// 8. スレッド削除API（論理削除 ＆ 本人または管理者）
// ──────────────────────────────────────────
app.delete('/api/threads/:threadId', authenticateToken, async (req, res) => {
  const { threadId } = req.params;
  const { userId, isAdmin } = req.user; // トークンから操作ユーザーの情報を取得

  try {
    // 該当スレッドの所有者（user_id）を確認する
    const threadCheck = await pool.query('SELECT user_id FROM threads WHERE id = $1', [threadId]);
    if (threadCheck.rows.length === 0) {
      return res.status(404).json({ error: 'スレッドが見つかりません。' });
    }

    const threadOwnerId = threadCheck.rows[0].user_id;

    // 「管理者」でも「スレを建てた本人」でもない場合は拒否
    if (!isAdmin && userId !== threadOwnerId) {
      return res.status(403).json({ error: '削除権限がありません。本人のみ削除可能です。' });
    }

    // 論理削除（DELETE ではなく UPDATE でフラグを true に）
    await pool.query('UPDATE threads SET is_deleted = true WHERE id = $1', [threadId]);
    
    // スレッドが消えたら、その中身のコメントもまとめて論理削除する
    await pool.query('UPDATE posts SET is_deleted = true WHERE thread_id = $1', [threadId]);

    res.json({ message: 'スレッドを削除しました。' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました。' });
  }
});

// ──────────────────────────────────────────
// 9. コメント削除API（論理削除 ＆ 本人または管理者）
// ──────────────────────────────────────────
app.delete('/api/posts/:postId', authenticateToken, async (req, res) => {
  const { postId } = req.params;
  const { userId, isAdmin } = req.user;

  try {
    // 該当コメントの所有者を確認
    const postCheck = await pool.query('SELECT user_id FROM posts WHERE id = $1', [postId]);
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'コメントが見つかりません。' });
    }

    const postOwnerId = postCheck.rows[0].user_id;

    // 「管理者」でも「書き込んだ本人」でもない場合は拒否
    if (!isAdmin && userId !== postOwnerId) {
      return res.status(403).json({ error: '削除権限がありません。本人のみ削除可能です。' });
    }

    // 論理削除
    await pool.query('UPDATE posts SET is_deleted = true WHERE id = $1', [postId]);

    res.json({ message: 'コメントを削除しました。' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました。' });
  }
});

// ──────────────────────────────────────────
// 10. ハンドル名変更API（ログイン必須）
// ──────────────────────────────────────────
app.put('/api/user/profile', authenticateToken, async (req, res) => {
  const { newDisplayName } = req.body;
  const { userId } = req.user; // JWTから自分のユーザーIDを取得

  if (!newDisplayName || newDisplayName.trim() === '') {
    return res.status(400).json({ error: '新しいハンドル名を入力してください。' });
  }

  try {
    // 自分の display_name を更新
    await pool.query(
      'UPDATE users SET display_name = $1 WHERE id = $2',
      [newDisplayName, userId]
    );

    res.json({ message: 'ハンドル名を更新しました。', displayName: newDisplayName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました。' });
  }
});

// ──────────────────────────────────────────
// 11. メールアドレス確認（アカウント有効化）API
// ──────────────────────────────────────────
app.get('/api/verify', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send('<h1>エラー</h1><p>無効なトークンです。</p>');
  }

  try {
    // トークンが一致するユーザーを検索
    const result = await pool.query('SELECT * FROM users WHERE verification_token = $1', [token]);
    
    if (result.rows.length === 0) {
      return res.status(400).send('<h1>エラー</h1><p>URLの期限切れ、または無効なトークンです。</p>');
    }

    const user = result.rows[0];

    // 有効化フラグを true にし、トークンを使い回せないよう消去する
    await pool.query(
      'UPDATE users SET is_verified = true, verification_token = NULL WHERE id = $1',
      [user.id]
    );

    // 確認完了画面をブラウザに直接表示（リダイレクトやリッチなHTMLでも可）
    res.send(`
      <div style="text-align: center; margin-top: 50px; font-family: sans-serif;">
        <h1 style="color: green;">🎉 メール認証が完了しました！</h1>
        <p>アカウントが有効化されました。掲示板のログイン画面からサインインしてください。</p>
        <p><a href="http://localhost:5173" style="color: blue; text-decoration: underline;">掲示板に戻る</a></p>
      </div>
    `);

  } catch (err) {
    console.error(err);
    res.status(500).send('<h1>サーバーエラーが発生しました。</h1>');
  }
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});