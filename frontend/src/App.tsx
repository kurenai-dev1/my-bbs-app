import { useState } from 'react';
import { MyPage } from './components/MyPage';
import { customFetch } from './utils/client';

function App() {
  // 画面の切り替え管理 ('register' | 'login' | 'dashboard' | 'mypage')
  const [view, setView] = useState<'register' | 'login' | 'dashboard' | 'mypage'>('login');
  
  // フォーム用ステート
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // スレッド用ステート
  const [threads, setThreads] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState('');
  
  // ページネーション用のステート
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // コメント用ステート
  const [activeThread, setActiveThread] = useState<{ id: number; title: string } | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [newContent, setNewContent] = useState('');

  // ハンドル名変更用ステート
  const [editDisplayName, setEditDisplayName] = useState('');

  // 状態・エラーメッセージ表示用
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // ログインユーザー情報保持用 (id, username=表示名, email, isAdmin)
  const [user, setUser] = useState<{ id: number; username: string; email: string; isAdmin: boolean } | null>(null);

  const [sortBy, setSortBy] = useState('thread_new'); // 'thread_new' または 'comment_new'

  // 1. 会員登録処理
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      const response = await customFetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '登録に失敗しました。');
      
      setMessage(data.message);
      setView('login');
      setPassword('');
    } catch (err: any) { setError(err.message); }
  };

  // 2. ログイン処理
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      const response = await customFetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'ログインに失敗しました。');

      localStorage.setItem('token', data.token);
      
      setUser({ id: data.user.id, username: data.user.username, email: data.user.email || email, isAdmin: data.user.isAdmin });
      setView('dashboard');
      fetchThreadsList(1, data.token);
    } catch (err: any) { setError(err.message); }
  };

  // 3. ログアウト処理
  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setActiveThread(null);
    setThreads([]);
    setPosts([]);
    setCurrentPage(1);
    setTotalPages(1);
    setView('login');
  };

  // 4. スレッド一覧を取得する関数
  const fetchThreadsList = async (page: number = 1, passedToken?: string, sortOption?: string) => {
    const token = passedToken || localStorage.getItem('token');
    // 指定がなければ現在のステート(sortBy)を使用
    const currentSort = sortOption || sortBy; 
    
    try {
      const response = await customFetch(`/api/threads?page=${page}&sort=${currentSort}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      setThreads(data.threads);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      alert('スレッドの取得に失敗: ' + err.message);
    }
  };

  const handleRefreshThreads = () => {
    fetchThreadsList(currentPage, undefined, sortBy);
  };

  // 並び替えが切り替わったとき
  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    fetchThreadsList(1, undefined, newSort); // 1ページ目に戻して新しい順で取得
  };

  // 5. スレッドを新規作成する関数
  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    const token = localStorage.getItem('token');

    try {
      const response = await customFetch('/api/threads', {
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
      setSortBy('thread_new'); // スレ新着順に戻す
      fetchThreadsList(1, undefined, 'thread_new');

    } catch (err: any) {
      alert('スレッド作成に失敗: ' + err.message);
    }
  };

  // 6. 特定スレッドのコメント一覧を取得する関数
  const fetchPosts = async (threadId: number) => {
    const token = localStorage.getItem('token');
    try {
      const response = await customFetch(`/api/threads/${threadId}/posts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setPosts(data);
    } catch (err: any) {
      alert('コメントの取得に失敗: ' + err.message);
    }
  };

  const handleSelectThread = (thread: { id: number; title: string }) => {
    setActiveThread(thread);
    fetchPosts(thread.id);
  };

  // 7. コメントを新規投稿する関数
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent || !activeThread) return;
    const token = localStorage.getItem('token');

    try {
      const response = await customFetch(`/api/threads/${activeThread.id}/posts`, {
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
      fetchPosts(activeThread.id);
    } catch (err: any) {
      alert('コメント投稿に失敗: ' + err.message);
    }
  };

  // 8. スレッド削除関数
  const handleDeleteThread = async (threadId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('本当にこのスレッドを削除しますか？内のコメントもすべて消去されます。')) return;
    
    const token = localStorage.getItem('token');
    try {
      const response = await customFetch(`/api/threads/${threadId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }
      fetchThreadsList(currentPage, undefined, sortBy);
    } catch (err: any) { alert(err.message); }
  };

  // 9. 個別コメント削除関数
  const handleDeletePost = async (postId: number) => {
    if (!window.confirm('このコメントを削除しますか？')) return;
    
    const token = localStorage.getItem('token');
    try {
      const response = await customFetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }
      if (activeThread) fetchPosts(activeThread.id);
    } catch (err: any) { alert(err.message); }
  };

  // 10. ハンドル名変更関数
  const handleUpdateDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDisplayName.trim()) return;
    const token = localStorage.getItem('token');

    try {
      const response = await customFetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newDisplayName: editDisplayName })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      if (user) {
        setUser({ ...user, username: data.displayName });
      }
      alert('ハンドル名を設定しました！');
      setEditDisplayName('');
      fetchThreadsList(currentPage);
    } catch (err: any) { alert('ハンドル名の変更に失敗: ' + err.message); }
  };

  // ──────────────────────────────────────────
  // 画面レンダリング
  // ──────────────────────────────────────────

  // 【パターンA】マイページ画面（コンポーネント化後）
  if (view === 'mypage' && user) {
    return (
      <MyPage 
        user={user}
        editDisplayName={editDisplayName}
        setEditDisplayName={setEditDisplayName}
        handleUpdateDisplayName={handleUpdateDisplayName}
        onBackToDashboard={() => setView('dashboard')}
      />
    );
  }

  // 【パターンB】ログイン後のメインダッシュボード画面
  if (view === 'dashboard' && user) {
    return (
      <div style={{ fontFamily: 'sans-serif', backgroundColor: '#fff', minHeight: '100vh' }}>
        
        {/* ─── ［新設］最上部のメニューバー ─── */}
        <div style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e9ecef', padding: '10px 20px' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#495057' }}>
              こんにちは、<strong>{user.username}</strong> さん 
              {user.isAdmin && <span style={{ color: 'gold', fontWeight: 'bold', backgroundColor: '#333', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', marginLeft: '6px' }}>管理者</span>}
            </span>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setView('mypage')} 
                style={{ padding: '5px 12px', cursor: 'pointer', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', color: '#333' }}
              >
                👤 マイページ
              </button>
              <button 
                onClick={handleLogout} 
                style={{ padding: '5px 12px', cursor: 'pointer', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', color: '#333' }}
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
        {/* ──────────────────────────────────── */}

        {/* メインコンテンツエリア（十分な幅と余白を確保） */}
        <div style={{ padding: '30px 20px', maxWidth: '600px', margin: '0 auto' }}>
          
          {/* タイトル部分はすっきりと単独配置 */}
          <h2 style={{ margin: '0 0 25px 0', fontSize: '24px' }}>🌐 会員制掲示板</h2>
          
          <hr style={{ border: '1px solid #eee', margin: '0 0 25px 0' }} />

          {/* サブ条件分岐①：特定のスレッド詳細を開いている場合 */}
          {activeThread ? (
            <div>
              <button onClick={() => setActiveThread(null)} style={{ marginBottom: '15px', padding: '5px 10px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff' }}>
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
                        
                        {(user.isAdmin || user.id === p.user_id) && (
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
              <form onSubmit={handleCreateThread} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
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

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>💬 スレッド一覧</h3>
              
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {/* 並び替えセレクトボックス */}
                  <select 
                    value={sortBy} 
                    onChange={(e) => handleSortChange(e.target.value)}
                    style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', fontSize: '13px', cursor: 'pointer' }}
                  >
                    <option value="thread_new">スレッド作成順</option>
                    <option value="comment_new">最新コメント順</option>
                  </select>

                  <button onClick={handleRefreshThreads} style={{ cursor: 'pointer', padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff', fontSize: '12px' }}>🔄 更新</button>
                </div>
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ margin: '0 0 5px 0', color: '#0066cc', textDecoration: 'underline' }}>{t.title}</h4>
                        
                        {(user.isAdmin || user.id === t.user_id) && (
                          <button 
                            onClick={(e) => handleDeleteThread(t.id, e)} 
                            style={{ color: 'red', cursor: 'pointer', padding: '2px 6px', fontSize: '12px', border: '1px solid red', borderRadius: '3px', backgroundColor: '#fff' }}
                          >
                            🗑 削除
                          </button>
                        )}
                      </div>
                      <small style={{ color: 'gray' }}>作成者: {t.username || '不明'} | {new Date(t.created_at).toLocaleString()}</small>
                    </li>
                  ))}
                </ul>
              )}

              {/* ページネーションコントロール */}
              {threads.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => fetchThreadsList(currentPage - 1)}
                    style={{ padding: '5px 10px', cursor: currentPage <= 1 ? 'not-allowed' : 'pointer' }}
                  >
                    ◀ 前へ
                  </button>
                  <span style={{ fontSize: '14px' }}>
                    {currentPage} / {totalPages} ページ
                  </span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => fetchThreadsList(currentPage + 1)}
                    style={{ padding: '5px 10px', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer' }}
                  >
                    次へ ▶
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 【パターンC】サインイン前の画面（ログイン or 会員登録）
  return (
    <div style={{ padding: '40px 20px', maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      {view === 'login' ? (
        <div style={{ border: '1px solid #ddd', padding: '25px', borderRadius: '8px', backgroundColor: '#fff' }}>
          <h2 style={{ marginTop: 0, textAlign: 'center' }}>🔑 ログイン</h2>
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