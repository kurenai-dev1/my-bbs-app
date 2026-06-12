import React, { useState, useRef } from 'react';

// 💡 親から受け取るすべてのPropsの型定義を正しく記述しました
interface ThreadDetailPageProps {
  activeThread: { id: number; title: string };
  onBackToConversations: () => void;
  posts: any[];
  handleCreatePost: (content: string, imageFile: File | null) => Promise<void>;
  handleDeletePost: (postId: number) => void;
  user: { id: number; isAdmin: boolean };
}

export function ThreadDetailPage({
  activeThread,
  onBackToConversations,
  posts,
  handleCreatePost,
  handleDeletePost,
  user
}: ThreadDetailPageProps) {
  const [newContent, setNewContent] = useState('');
  
  // 画像選択用のステート
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 画像が選択された時の処理（プレビュー用）
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file)); 
    }
  };

  // 送信ボタンが押された時の処理
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleCreatePost(newContent, selectedImage);
    
    // 送信成功したらフォームをリセット
    setNewContent('');
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div style={{ padding: '30px 20px', maxWidth: '600px', margin: '0 auto' }}>
      
      {/* 💡 復活：共通タイトル */}
      <h2 style={{ margin: '0 0 25px 0', fontSize: '24px' }}>🌐 会員制掲示板</h2>
      <hr style={{ border: '1px solid #eee', margin: '0 0 25px 0' }} />

      {/* 💡 復活：「一覧に戻る」ボタン ＆ スレッドタイトル */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={onBackToConversations} 
          style={{ marginBottom: '15px', padding: '5px 10px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff' }}
        >
          ⬅ スレッド一覧に戻る
        </button>
        <h3 style={{ backgroundColor: '#eef', padding: '12px', borderRadius: '4px', margin: '0' }}>
          📌 {activeThread.title}
        </h3>
      </div>

      {/* コメント表示エリア */}
      <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '4px', minHeight: '180px', marginBottom: '20px', backgroundColor: '#fff' }}>
        {posts.length === 0 ? (
          <p style={{ color: 'gray' }}>まだコメントがありません。最初のコメントをどうぞ！</p>
        ) : (
          posts.map((p, index) => (
            <div key={p.id} style={{ borderBottom: '1px dashed #eee', paddingBottom: '12px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <small style={{ color: '#666' }}>
                  {index + 1}: <strong>{p.username || '退会済ユーザー'}</strong> ({new Date(p.created_at).toLocaleString()})
                </small>
                
                {/* 💡 復活：管理者、または書き込んだ本人だけが削除できるボタン */}
                {(user.isAdmin || user.id === p.user_id) && (
                  <button 
                    onClick={() => handleDeletePost(p.id)} 
                    style={{ color: 'red', cursor: 'pointer', padding: '1px 5px', fontSize: '11px', border: '1px solid red', borderRadius: '3px', backgroundColor: '#fff' }}
                  >
                    🗑 削除
                  </button>
                )}
              </div>

              {/* コメントの上部に画像を表示（データに image_url があれば表示） */}
              {p.image_url && (
                <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                  <img 
                    src={`http://localhost:3000${p.image_url}`} 
                    alt="添付画像" 
                    style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '4px', objectFit: 'contain' }} 
                  />
                </div>
              )}

              <p style={{ margin: '5px 0 0 0', whiteSpace: 'pre-wrap', color: '#222', fontSize: '15px' }}>{p.content}</p>
            </div>
          ))
        )}
      </div>

      {/* 画像ファイル選択用インプット */}
      <div style={{ marginBottom: '10px' }}>
        <label style={{ cursor: 'pointer', padding: '6px 12px', backgroundColor: '#eee', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px', display: 'inline-block' }}>
          📷 画像を添付する
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef}
            onChange={handleImageChange} 
            style={{ display: 'none' }} 
          />
        </label>
        {selectedImage && <span style={{ marginLeft: '10px', fontSize: '13px', color: '#666' }}>{selectedImage.name}</span>}
      </div>

      {/* コメント投稿フォーム */}
      <form onSubmit={onSubmit}>
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="書き込み内容を入力してください..."
          style={{ width: '100%', height: '80px', padding: '8px', marginBottom: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #bbb' }}
          required
        />

        {/* 選択中画像のプレビュー表示 */}
        {previewUrl && (
          <div style={{ marginBottom: '10px', position: 'relative' }}>
            <img src={previewUrl} alt="プレビュー" style={{ maxHeight: '100px', borderRadius: '4px' }} />
            <button 
              type="button" 
              onClick={() => { setSelectedImage(null); setPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              style={{ position: 'absolute', top: 0, left: '110px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', cursor: 'pointer', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ×
            </button>
          </div>
        )}

        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          コメントを書き込む
        </button>
      </form>
    </div>
  );
}