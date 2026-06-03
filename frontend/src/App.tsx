import { useState } from 'react';

function App() {
  // 画面の切り替え管理 ('register':新規登録 | 'login':ログイン | 'dashboard':掲示板)
  const [view, setView] = useState<'register' | 'login' | 'dashboard'>('login');
  
  // フォーム用ステート
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // スレッド用ステート
  const [threads, setThreads] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState('');
  
  // コメント用ステート
  const [activeThread, setActiveThread] = useState<{ id: number; title: string } | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [newContent, setNewContent] = useState('');

  // 状態・エラーメッセージ表示用
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // ログインユーザー情報保持用
  // const [user, setUser] = useState<{ username: string; isAdmin: boolean } | null>(null);
  const [user, setUser] = useState<{ id: number; username: string; isAdmin: boolean } | null>(null);

  const [editDisplayName, setEditDisplayName] = useState('');

  // ──────────────────────────────────────────
  // 1. 会員登録処理
  // ──────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '登録に失敗しました。');
      
      setMessage('登録完了！ログインしてください。');
      setView('login'); // ログイン画面へ切り替え
      setPassword('');
    } catch (err: any) { setError(err.message); }
  };

  // ──────────────────────────────────────────
  // 2. ログイン処理
  // ──────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'ログインに失敗しました。');

      // トークンをブラウザの localStorage に保存
      localStorage.setItem('token', data.token);
      
      // setUser({ username: data.user.username, isAdmin: data.user.isAdmin });
      setUser({ id: data.user.id, username: data.user.username, isAdmin: data.user.isAdmin });
      setView('dashboard'); // メイン画面へ移行
      
      // ログイン直後にスレッド一覧を自動で取得する
      fetchThreadsList(data.token);
    } catch (err: any) { setError(err.message); }
  };

  // ──────────────────────────────────────────
  // 3. ログアウト処理
  // ──────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setActiveThread(null);
    setThreads([]);
    setPosts([]);
    setView('login');
  };

  // ──────────────────────────────────────────
  // 4. スレッド一覧を取得する関数
  // ──────────────────────────────────────────
  const fetchThreadsList = async (passedToken?: string) => {
    const token = passedToken || localStorage.getItem('token');
    try {
      const response = await fetch('/api/threads', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setThreads(data);
    } catch (err: any) {
      alert('スレッドの取得に失敗: ' + err.message);
    }
  };

  // 手動で更新ボタンを押したとき用
  const handleRefreshThreads = () => {
    fetchThreadsList();
  };

  // ──────────────────────────────────────────
  // 5. スレッドを新規作成する関数
  // ──────────────────────────────────────────
  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: newTitle })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setNewTitle('');
      fetchThreadsList(); // 一覧を再リロード
    } catch (err: any) {
      alert('スレッド作成に失敗: ' + err.message);
    }
  };

  // ──────────────────────────────────────────
  // 6. 特定スレッドのコメント一覧を取得する関数
  // ──────────────────────────────────────────
  const fetchPosts = async (threadId: number) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/threads/${threadId}/posts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setPosts(data);
    } catch (err: any) {
      alert('コメントの取得に失敗: ' + err.message);
    }
  };

  // スレッドの一覧から個別のスレッドがクリックされたとき
  const handleSelectThread = (thread: { id: number; title: string }) => {
    setActiveThread(thread);
    fetchPosts(thread.id);
  };

  // ──────────────────────────────────────────
  // 7. コメントを新規投稿する関数
  // ──────────────────────────────────────────
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent || !activeThread) return;
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`/api/threads/${activeThread.id}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newContent })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setNewContent('');
      fetchPosts(activeThread.id); // コメント一覧を再リロード
    } catch (err: any) {
      alert('コメント投稿に失敗: ' + err.message);
    }
  };

// ─── 【管理者】スレッド削除関数 ───
  const handleDeleteThread = async (threadId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // 親要素のクリックイベント（スレッド詳細へ行く処理）を防ぐ
    if (!window.confirm('本当にこのスレッドを削除しますか？内のコメントもすべて消去されます。')) return;
    
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/threads/${threadId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }
      fetchThreadsList(); // 一覧を再読み込み
    } catch (err: any) { alert(err.message); }
  };

  // ─── 【管理者】コメント削除関数 ───
  const handleDeletePost = async (postId: number) => {
    if (!window.confirm('このコメントを削除しますか？')) return;
    
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }
      if (activeThread) fetchPosts(activeThread.id); // コメント一覧を再読み込み
    } catch (err: any) { alert(err.message); }
  };

  // ─── ハンドル名変更関数 ───
  const handleUpdateDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDisplayName.trim()) return;
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newDisplayName: editDisplayName })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // フロント側のユーザー表示ステートも更新する
      if (user) {
        setUser({ ...user, username: data.displayName });
      }
      alert('ハンドル名を設定しました！');
      setEditDisplayName('');
      
      // 画面表示をリフレッシュするために一覧を再取得
      fetchThreadsList();
      if (activeThread) fetchPosts(activeThread.id);

    } catch (err: any) {
      alert('ハンドル名の変更に失敗: ' + err.message);
    }
  };

  // ──────────────────────────────────────────
  // 画面レンダリング（条件分岐）
  // ──────────────────────────────────────────

  // 【パターンA】ログイン後のメインダッシュボード画面
  if (view === 'dashboard' && user) {
    return (
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>🌐 会員制掲示板システム</h2>
          <button onClick={handleLogout} style={{ padding: '6px 12px', cursor: 'pointer' }}>ログアウト</button>
        </div>
        <p>ログインユーザー: <strong>{user.username}</strong> さん</p>

        {/* ─── ここからハンドル名変更フォームを追加 ─── */}
        <form onSubmit={handleUpdateDisplayName} style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          <span style={{ fontSize: '14px' }}>ハンドル名変更:</span>
          <input 
            type="text" 
            placeholder="新しいハンドル名" 
            value={editDisplayName} 
            onChange={(e) => setEditDisplayName(e.target.value)}
            style={{ padding: '4px 8px', width: '150px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <button type="submit" style={{ padding: '4px 10px', cursor: 'pointer', fontSize: '13px' }}>変更</button>
        </form>
        {/* ────────────────────────────────────────── */}
  
        <hr style={{ border: '1px solid #eee', margin: '20px 0' }} />

        {/* サブ条件分岐①：特定のスレッド詳細（コメント画面）を開いている場合 */}
        {activeThread ? (
          <div>
            <button onClick={() => setActiveThread(null)} style={{ marginBottom: '15px', padding: '5px 10px', cursor: 'pointer' }}>
              ⬅ スレッド一覧に戻る
            </button>
            <h3 style={{ backgroundColor: '#eef', padding: '12px', borderRadius: '4px', margin: '0 0 15px 0' }}>
              📌 {activeThread.title}
            </h3>

            {/* コメント表示エリア */}
            <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '4px', minHeight: '180px', marginBottom: '20px', backgroundColor: '#fff' }}>
              {posts.length === 0 ? (
                <p style={{ color: 'gray' }}>まだコメントがありません。最初のコメントをどうぞ！</p>
              ) : (
                posts.map((p, index) => (
                  <div key={p.id} style={{ borderBottom: '1px dashed #eee', paddingBottom: '8px', marginBottom: '10px' }}>
                    <small style={{ color: '#666' }}>
                      {index + 1}: <strong>{p.username || '退会済ユーザー'}</strong> ({new Date(p.created_at).toLocaleString()})

                    {user && (user.isAdmin || user.id === p.user_id) && (
                    <button 
                      onClick={() => handleDeletePost(p.id)} 
                      style={{ marginLeft: '12px', color: 'red', cursor: 'pointer', padding: '1px 5px', fontSize: '11px', border: '1px solid red', borderRadius: '3px', backgroundColor: '#fff' }}
                    >
                    🗑 削除
                    </button>
                    )}
                    </small>
                    <p style={{ margin: '5px 0 0 0', whiteSpace: 'pre-wrap', color: '#222', fontSize: '15px' }}>{p.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* コメント投稿フォーム */}
            <form onSubmit={handleCreatePost}>
              <textarea
                placeholder="書き込み内容を入力してください..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                style={{ width: '100%', height: '80px', padding: '8px', marginBottom: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #bbb' }}
                required
              />
              <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                コメントを書き込む
              </button>
            </form>
          </div>
        ) : (
          /* サブ条件分岐②：通常のスレッド一覧画面を表示している場合 */
          <div>
            <h3 style={{ margin: '0 0 10px 0' }}>🆕 新規スレッド作成</h3>
            <form onSubmit={handleCreateThread} style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
              <input
                type="text"
                placeholder="新しく立てるスレッドのタイトル"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                required
              />
              <button type="submit" style={{ padding: '8px 15px', cursor: 'pointer', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '4px' }}>
                スレを立てる
              </button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ margin: 0 }}>💬 スレッド一覧</h3>
              <button onClick={handleRefreshThreads} style={{ cursor: 'pointer', padding: '4px 8px' }}>🔄 一覧を更新</button>
            </div>

            {threads.length === 0 ? (
              <p style={{ color: 'gray' }}>現在スレッドはありません。新しく作成してください。</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {threads.map((t) => (
                  <li 
                    key={t.id} 
                    onClick={() => handleSelectThread(t)}
                    style={{ padding: '12px', border: '1px solid #ddd', marginBottom: '8px', borderRadius: '4px', backgroundColor: '#f9f9f9', cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f9f9f9')}
                  >
                    <h4 style={{ margin: '0 0 5px 0', color: '#0066cc', textDecoration: 'underline' }}>{t.title}</h4>
                    <small style={{ color: 'gray' }}>作成者: {t.username || '不明'} | {new Date(t.created_at).toLocaleString()}</small>
                    {user && (user.isAdmin || user.id === t.user_id) && (
                    <button 
                      onClick={(e) => handleDeleteThread(t.id, e)} 
                      style={{ marginLeft: '15px', color: 'red', cursor: 'pointer', padding: '2px 6px', border: '1px solid red', borderRadius: '3px', backgroundColor: '#fff' }}
                    >
                    🗑 削除
                    </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  }

  // 【パターンB】サインイン前の画面（ログイン or 会員登録）
  return (
    <div style={{ padding: '40px 20px', maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      {view === 'login' ? (
        <div style={{ border: '1px solid #ddd', padding: '25px', borderRadius: '8px', backgroundColor: '#fff' }}>
          <h2 style={{ marginTop: 0, textCenter: 'center' }}>🔑 ログイン</h2>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>メールアドレス：</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} required />
            </div>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>パスワード：</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} required />
            </div>
            <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              サインイン
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '14px' }}>
            アカウントがない方は{' '}
            <button onClick={() => { setView('register'); setError(''); setMessage(''); }} style={{ background: 'none', border: 'none', color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}>
              新規登録へ
            </button>
          </p>
        </div>
      ) : (
        <div style={{ border: '1px solid #ddd', padding: '25px', borderRadius: '8px', backgroundColor: '#fff' }}>
          <h2 style={{ marginTop: 0 }}>📝 会員新規登録</h2>
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>ユーザー名：</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} required />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>メールアドレス：</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} required />
            </div>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>パスワード：</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} required />
            </div>
            <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              アカウントを作成する
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '14px' }}>
            既に登録済みの方は{' '}
            <button onClick={() => { setView('login'); setError(''); setMessage(''); }} style={{ background: 'none', border: 'none', color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}>
              ログインへ
            </button>
          </p>
        </div>
      )}

      {/* 通知・エラーメッセージのグローバル表示 */}
      {message && <p style={{ color: 'green', marginTop: '15px', textAlign: 'center', fontWeight: 'bold' }}>{message}</p>}
      {error && <p style={{ color: 'red', marginTop: '15px', textAlign: 'center', fontWeight: 'bold' }}>{error}</p>}
    </div>
  );
}

export default App;