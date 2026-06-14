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
(`bbs_user`をオーナーに`bbs_db`をデータベースにした場合)

※ テストは PostgreSQLでのみ行っています。　

### 2. 開発環境で動かす
GitHub、Node.js のインストールは済んでいる前提です。

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
JWT_SECRET=<your_secret_string>
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
👉 `http://localhost:5173/`

💡 初回ログイン時の注意点  

ユーザー登録から開始しますが、確認用の模擬メールは送信されません。  
代わりにバックエンドのターミナルログに確認用のURLが表示されます。  
そのURLをブラウザにコピー＆ペーストしてアクセスし、アカウントを有効化してください。  

また、管理者権限（スレッド削除等）を付与する場合は、直接データベースのテーブルを更新する必要があります。
```sql
UPDATE users SET is_admin = true WHERE username = 'あなたのユーザー名';
```

## 🚀 本番環境への配備について (Deployment)

本システムは、フロントエンド（静的ファイル）とバックエンド（Node.js API）で構成されています。  
フロントエンドはビルド時に **相対パス（`./`）** に変換されるため、Webサーバーのルートディレクトリ、  
または任意のサブディレクトリ（サブパス）のどこに配置してもそのまま動作します。

バックエンド（API）のルーティング構成に合わせて、以下のいずれかの形で配備してください。

### パターンA：同一ドメインでの運用（推奨・今回の例）
フロントエンドと同じドメインの特定のパス（例: `/api/` や `/bbs_api/`）へのリクエストを、  
リバースプロキシでバックエンド（ポート3000）へ転送する構成です。
- **メリット**: SSL証明書が1つで済み、ブラウザのCORS（ドメイン間通信の制限）エラーを回避できます。

### パターンB：別ドメイン（クロスドメイン）での運用
フロントエンドとバックエンドを完全に異なるドメイン（またはサブドメイン `api.your-domain.com`）で運用する構成です。
- **注意点**: バックエンド側（`server.js`）で、フロントエンドのドメインからのアクセスを許可する「CORS設定」を明示的に追加する必要があります。

GitHub Pages での公開が一つの例です。  
👉 https://kurenai-dev1.github.io/my-bbs-app/dist/

---
## 🛠️ 配備手順の一例（パターンA：Apacheの場合）

ここでは、最も標準的な「1台の Linux サーバー + Apache」環境へデプロイする手順を解説します。

### フロントエンドのビルドと配置

開発環境でフロントエンドのディレクトリでビルドを実行します。　
```bash
   cd frontend
   npm run build
```
生成された dist/ フォルダの中身を、Apache の公開ドキュメントに配置します。　

### バックエンドの配置と起動
サーバー内に backend/ ディレクトリを配置(例：/var/www/my-bbs-app/)、パッケージをインストールします。  
```bash
cd backend  
npm install --production  
```
本番環境用の .env を作成します。　
データベースへの接続情報、シークレット文字列を設定します。　
PM2 等のプロセスマネージャーをインストールしてバックエンドを起動します。  
```bash
pm2 start server.js --name "bbs-backend"  
```
### Webサーバー（プロキシ）の設定
ブラウザが叩いた本来のドメイン情報をバックエンドへ引き継ぐため、    
Apache の設定に ProxyPreserveHost On を必ず含めてルーティングします。　
```ini
<VirtualHost *:443>
    ServerName your-domain.com

    # 元のドメイン名（Hostヘッダー）をExpressに引き継ぐ
    ProxyPreserveHost On

    # リバースプロキシ設定
    ProxyPass /api/ http://localhost:3000/
    ProxyPassReverse /api/ http://localhost:3000/
</VirtualHost>
```

📌 補足：サーバーを別ドメインで運用する場合  

フロントエンドに .env.production を作成ます。  
ここでは、プロキシのサブパスを /api から /bbs_api に変更したとします。  
```ini
VITE_PROXY_PATH=/bbs_api
VITE_API_SERVER=https://<your_server_name>
```
再ビルドしてフロント側に配備します。

バックエンド側の Apacheの設定でプロキシのパスを以下のように変更します。
```ini
ProxyPass /bbs_api/ http://localhost:3000/
ProxyPassReverse /bbs_api/ http://localhost:3000/
```
CORSの設定も必要になります。以下は一例です。
```ini
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "https://kurenai-dev1.github.io"
    Header set Access-Control-Allow-Methods "POST, GET, OPTIONS, PUT, DELETE"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>
```