import React from 'react';

interface ThreadListProps {
  threads: any[];
  newTitle: string;
  setNewTitle: (title: string) => void;
  handleCreateThread: (e: React.FormEvent) => void;
  sortBy: string;
  handleSortChange: (newSort: string) => void;
  handleRefreshThreads: () => void;
  handleSelectThread: (thread: { id: number; title: string }) => void;
  handleDeleteThread: (threadId: number, e: React.MouseEvent) => void;
  currentPage: number;
  totalPages: number;
  fetchThreadsList: (page: number) => void;
  user: { id: number; isAdmin: boolean };
}

export function ThreadListPage({
  threads,
  newTitle,
  setNewTitle,
  handleCreateThread,
  sortBy,
  handleSortChange,
  handleRefreshThreads,
  handleSelectThread,
  handleDeleteThread,
  currentPage,
  totalPages,
  fetchThreadsList,
  user
}: ThreadListProps) {
  return (
    /* ⭕ margin: '0 auto' で画面の中央に配置します */
    <div style={{ padding: '30px 20px', maxWidth: '600px', margin: '0 auto' }}>
      
      <h2 style={{ margin: '0 0 25px 0', fontSize: '24px' }}>🌐 会員制掲示板</h2>
      <hr style={{ border: '1px solid #eee', margin: '0 0 25px 0' }} />

      {/* 新規スレッド作成 */}
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

      {/* スレッド一覧ヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0 }}>💬 スレッド一覧</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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

      {/* スレッドリスト */}
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
              {/* 💡 タイトルが長文の時の改行・削除ボタン潰れ対策はここに残してあります */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                <h4 style={{ margin: '0 0 5px 0', color: '#0066cc', textDecoration: 'underline', textAlign: 'left' }}>
                  {t.title}
                </h4>
                
                {(user.isAdmin || user.id === t.user_id) && (
                  <button 
                    onClick={(e) => handleDeleteThread(t.id, e)} 
                    style={{ color: 'red', cursor: 'pointer', padding: '2px 6px', fontSize: '12px', border: '1px solid red', borderRadius: '3px', backgroundColor: '#fff', flexShrink: 0 }}
                  >
                    🗑 削除
                  </button>
                )}
              </div>
              <small style={{ color: 'gray', textAlign: 'left', display: 'block', marginTop: '5px' }}>
                作成者: {t.username || '不明'} | {new Date(t.created_at).toLocaleString()} | 💭 {t.comment_count || 0}
              </small>
            </li>
          ))}
        </ul>
      )}

      {/* ページネーション */}
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
  );
}