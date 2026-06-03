# 🌐 会員制掲示板システム (my-bbs-app)

React と Node.js (Express) を組み合わせた、フルスタックの会員制掲示板アプリケーションです。  
ユーザー登録、セキュアなログイン認証、スレッドの作成、そして各スレッド内でのリアルタイムなコメント（レス）投稿機能を備えています。

## 🚀 主な機能 (Features)

* **安全な会員システム:** `bcrypt` によるパスワードのハッシュ化保存 ＆ `JWT (JSON Web Token)` を用いた認証状態のキープ。
* **スレッド作成・一覧機能:** ログインユーザーなら誰でも新しいトークテーマ（スレッド）を作成可能。
* **コメント（レス）機能:** スレッドごとに個別の詳細画面が展開し、コメントの読み書きが可能。
* **レスポンシブな画面切り替え:** Reactの状態管理を活用した、軽快でサクサク動くUI。

## 🛠 技術スタック (Tech Stack)

* **フロントエンド:** React (TypeScript) / Vite
* **バックエンド:** Node.js / Express
* **データベース:** PostgreSQL
* **認証・暗号化:** JWT (jsonwebtoken) / bcrypt

---

## 📦 導入・起動方法 (Setup & Running)

### 1. データベースの準備
PostgreSQLで以下の3つのテーブル（`users`, `threads`, `posts`）を作成しておきます。

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE threads (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    thread_id INTEGER REFERENCES threads(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
