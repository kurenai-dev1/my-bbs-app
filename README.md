# 🌐 会員制掲示板システム (my-bbs-app)

React と Node.js (Express) を組み合わせた、会員制掲示板アプリケーションです。  
ユーザー登録、ログイン認証、スレッドの作成、そして各スレッド内でのコメント（レス）投稿機能を備えています。

## 🚀 主な機能 (Features)

* **安全な会員システム:** `bcrypt` によるパスワードのハッシュ化保存 ＆ `JWT (JSON Web Token)` を用いた認証状態の保持。
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

3つのテーブル（`users`, `threads`, `posts`）を作成しておきます。  
作成スクリプトは /backend/db に置いています。　

※ テストは PostgreSQLでのみ行っています。　

### 2. 開発環境で動かす

#### リポジトリのクローン
```bash
git clone https://github.com/kurenai-dev1/my-bbs-app
cd my-bbs-app
```
#### フロントエンドの準備
```bash
cd frontend  
npm install              # 💡 依存ライブラリのインストール  
```
#### バックエンドの準備
```bash
cd ../backend  
npm install              # 💡 依存ライブラリのインストール  
```
下記の内容を書いた .env ファイルを新規に作成　
/backend/.env
```ini
# パスワード等の隠匿情報を記載しておきます。
PORT=3000
DATABASE_URL=postgresql://<user_name>:<password>@localhost:5432/<database_name>
JWT_SECRET=your_secret_string
```
### 開発環境の起動方法

バックエンドとフロントエンドの両方を起動します（別々のターミナルで実行してください）。  

・バックエンド(backend)  
```bash
cd backend  
npx supervisor server.js  
```
・フロントエンド(frontend)  
```bash
cd frontend  
npm run dev  
```
起動後、Webブラウザで以下にアクセスします。  
👉 http://localhost:5173/

💡 初回ログイン時の注意点
初回はユーザー登録から開始しますが、確認用の模擬メールは送信されません。  
代わりにバックエンドのターミナルログに確認用のURLが表示されるため、そのURLをブラウザにコピー＆ペーストしてアクセスし、アカウントを有効化してください。  

また、管理者権限（スレッド削除等）を付与する場合は、直接データベースのテーブルを更新する必要があります。
```sql
UPDATE users SET is_admin = true WHERE username = 'あなたのユーザー名';
```

## 🚀 本番環境への配備パターン (Deployment Architecture)

本システムは、フロントエンド（静的ファイル）とバックエンド（Node.js API）で構成されています。  
インフラの要件に合わせて、以下のいずれかのパターンで配備してください。　

### 💡 推奨される3つの配備パターン

| パターン | フロントエンド | バックエンド | 特徴 |
| :--- | :--- | :--- | :--- |
| **① サブパス構成**<br>(同一ドメイン) | Apache / Nginx の<br>ドキュメントルート (`/`) | 同一サーバーの別ポート<br>(リバースプロキシで `/bbs_api` へ転送) | 一番手軽。SSL証明書が1つで済み、CORSの設定も不要。 |
| **② マルチドメイン構成**<br>(別ドメイン) | CDN (Cloudflare等) や<br>静的ホスティング | 別サーバー、または別ドメイン<br>(`api.your-domain.com`) | フロントとバックを完全に物理分離できる。※バックエンド側でCORSの許可設定が必要。 |
| **③ クラウド構成**<br>(マネージド) | AWS S3 + CloudFront<br>Vercel / Netlify など | AWS ECS / App Runner<br>GCP Cloud Run / Render など | スケーラビリティや運用保守性を重視する場合に最適。モダンな開発スタイル。 |

---
### 🛠️ 配備手順の一例（パターン①：Apache サブパス構成の場合）

ここでは、最も標準的な「1台の Linux サーバー + Apache」環境へデプロイする手順を解説します。

### フロントエンドのビルドと配置
1. `frontend/vite.config.ts` に `base: './'` が設定されていることを確認します（サブパス対応のため）。　
2. フロントエンドのディレクトリでビルドを実行します。　
```bash
   cd frontend
   npm run build
```
生成された dist/ フォルダの中身を、Apache の公開ドメインに配置します。　

### バックエンドの配置と起動
サーバー内に backend/ ディレクトリを配置し(/var/www/my-bbs-app/等)、パッケージをインストールします。  
```bash
cd backend  
npm install --production  
```
本番環境用の .env を作成します。  
PM2 等のプロセスマネージャーをインストールしてバックエンドを起動します。  
```bash
pm2 start server.js --name "bbs-backend"  
```
### Webサーバー（プロキシ）の設定
ブラウザが叩いた本来のドメイン情報をバックエンドへ引き継ぐため、  
Apache の設定に ProxyPreserveHost On を必ず含めてルーティングします。　
```ini
    # 元のドメイン名（Hostヘッダー）をExpressに引き継ぐ
    ProxyPreserveHost On

    # リバースプロキシ設定
    ProxyPass /api/ http://localhost:3000/api/
    ProxyPassReverse /api/ http://localhost:3000/api/
```

📌 補足：APIに専用のサブパス（/bbs_api など）を適用する場合  

もし環境の都合で /api/ が使えず、ベースパスを変更したい場合は、以下の設定を行ってください。

フロントエンド: .env.production を作成し、VITE_API_BASE_PATH=/bbs_api を指定して再ビルド。

バックエンド: .env に API_BASE_PATH=/bbs_api を指定して再起動。

Apacheの設定: プロキシのパスを以下のように変更。
```ini
ProxyPass /bbs_api/ http://localhost:3000/
ProxyPassReverse /bbs_api/ http://localhost:3000/
```
