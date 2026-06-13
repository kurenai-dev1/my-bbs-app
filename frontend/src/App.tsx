import { useState, useEffect } from 'react'; 
import { Header } from './components/Header'; 
import { ThreadListPage } from './views/ThreadListPage';
import { ThreadDetailPage } from './views/ThreadDetailPage';
import { MyPage } from './views/MyPage';
import { LoginPage } from './views/LoginPage'; 
import { customFetch } from './utils/client';

function App() {
  // 画面の切り替え管理 ('register' | 'login' | 'threadlist' | 'mypage')
  const [view, setView] = useState<'register' | 'login' | 'threadlist' | 'mypage'>('login');
  
  // スレッド用ステート
  const [threads, setThreads] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState('');
  
  // ページネーション用のステート
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // コメント用ステート
  const [activeThread, setActiveThread] = useState<{ id: number; title: string } | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  // const [newContent, setNewContent] = useState('');

  // ハンドル名変更用ステート
  const [editDisplayName, setEditDisplayName] = useState('');

  // ログインユーザー情報保持用 (id, username=表示名, email, isAdmin)
  const [user, setUser] = useState<{ id: number; username: string; email: string; isAdmin: boolean } | null>(null);

  const [sortBy, setSortBy] = useState('thread_new'); // 'thread_new' または 'comment_new'

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // 💡 ユーザー情報をバックエンドから取得する関数を定義
      const fetchCurrentUser = async () => {
        try {
          // ※バックエンドに「ログイン中の自分の情報を返すAPI」がある想定です
          // もしパスが違っていたら、適宜（/api/user/profile などに）書き換えてください
          const response = await customFetch('/api/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
        
          if (!response.ok) throw new Error('セッションが切れています');
          const data = await response.json();
        
          // 成功したら、本物のユーザー情報をステートにセット！
          setUser({ 
            id: data.user.id, 
            username: data.user.username, // 💡 ここで本物の名前が入る！
            email: data.user.email, 
            isAdmin: data.user.isAdmin 
          });
        
          setView('threadlist');
          fetchThreadsList(1, token);
        
        } catch (err) {
          // トークンが古かったり、エラーが起きたら安全のためログアウトさせる
          console.error(err);
          handleLogout();
        }
      };
      fetchCurrentUser();
    }
  }, []);

  // 1. 会員登録処理(views/LoginPage.tsx)

  // 2. ログイン処理(views/LoginPage.tsx)

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

  // ログイン成功時の処理
  const handleLoginSuccess = (userData: any, token: string) => {
    setUser(userData);
    setView('threadlist');
    fetchThreadsList(1, token); // ログイン直後のスレッド取得
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
  const handleCreatePost = async (content: string, imageFile: File | null) => {
    if (!activeThread) return;

    try {
      const formData = new FormData();
      formData.append('content', content);
    
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const token = localStorage.getItem('token'); 

      // 💡 既存の customFetch をそのまま使う！
      // API_BASE（環境変数）の結合は customFetch が裏で自動でやってくれます
      const response = await customFetch(`/api/threads/${activeThread.id}/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // ❌ 'Content-Type' は書かない（FormDataなのでブラウザに自動生成させる）
        },
        body: formData, // FormDataをそのまま渡す
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'コメントの投稿に失敗しました。');

      fetchPosts(activeThread.id);

    } catch (err: any) {
      alert(err.message);
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
        onBackToThreadList={() => {
          setView('threadlist');
          fetchThreadsList(currentPage); // 💡 戻った瞬間に最新のユーザー名を含んだ一覧に更新する
        }}
      />
    );
  }
  // 【パターンB】ログイン後のメインダッシュボード画面
  if (view === 'threadlist' && user) {
    return (
      <div style={{ fontFamily: 'sans-serif', backgroundColor: '#fff', minHeight: '100vh' }}>
        
        {/* 共通のヘッダーメニュー */}
        <Header user={user} onViewChange={setView} onLogout={handleLogout} />

        {/* ─── 条件分岐：詳細か一覧か ─── */}
        {activeThread ? (
          
          /* 1. ⭕ スレッド詳細画面 */
          <ThreadDetailPage
            activeThread={activeThread}
            // 💡 ここが超重要！ThreadDetailPage側が期待している「戻る関数」のProps名に合わせます
            onBackToConversations={() => setActiveThread(null)}
            posts={posts}
            handleCreatePost={handleCreatePost}
            handleDeletePost={handleDeletePost}
            user={user}
          />

        ) : (

          /* 2. 通常のスレッド一覧画面 */
          <ThreadListPage
            threads={threads}
            newTitle={newTitle}
            setNewTitle={setNewTitle}
            handleCreateThread={handleCreateThread}
            sortBy={sortBy}
            handleSortChange={handleSortChange}
            handleRefreshThreads={handleRefreshThreads}
            handleSelectThread={handleSelectThread}
            handleDeleteThread={handleDeleteThread}
            currentPage={currentPage}
            totalPages={totalPages}
            fetchThreadsList={fetchThreadsList}
            user={user}
          />

        )}
      </div>
    );
  }

  // 【パターンC】サインイン前の画面（ログイン or 会員登録）(/views/LoginPage.tsx)

  return <LoginPage onLoginSuccess={handleLoginSuccess} />;

}

export default App;