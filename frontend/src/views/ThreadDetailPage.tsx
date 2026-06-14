import React, { useState, useRef } from 'react';

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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 💡 【新設】現在拡大表示している画像のURL（null のときは閉じている状態）
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file)); 
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleCreatePost(newContent, selectedImage);
    setNewContent('');
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const apiServer = import.meta.env.VITE_API_SERVER || '';
  const proxyPath = import.meta.env.VITE_PROXY_PATH || '/api';

  return (
    <div style={{ padding: '30px 20px', maxWidth: '600px', margin: '0 auto' }}>
      
      <h2 style={{ margin: '0 0 25px 0', fontSize: '24px', textAlign: 'center' }}>🌐 会員制掲示板</h2>
      <hr style={{ border: '1px solid #eee', margin: '0 0 25px 0' }} />

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={onBackToConversations} 
          style={{ marginBottom: '15px', padding: '5px 10px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff' }}
        >
          ⬅ スレッド一覧に戻る
        </button>
        <h3 style={{ backgroundColor: '#eef', padding: '12px', borderRadius: '4px', margin: '0', textAlign: 'left' }}>
          📌 {activeThread.title}
        </h3>
      </div>

      {/* コメント表示エリア */}
      <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '4px', minHeight: '180px', marginBottom: '20px', backgroundColor: '#fff' }}>
        {posts.length === 0 ? (
          <p style={{ color: 'gray' }}>まだコメントがありません。最初のコメントをどうぞ！</p>
        ) : (
          posts.map((p, index) => {
            // 💡 ループ内で画像のフルURLを組み立てておきます
            const fullImageUrl = p.image_url ? `${apiServer}${proxyPath}${p.image_url}` : null;

            return (
              <div key={p.id} style={{ borderBottom: '1px dashed #eee', paddingBottom: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <small style={{ color: '#666', textAlign: 'left' }}>
                    {index + 1}: <strong>{p.username || '退会済ユーザー'}</strong> ({new Date(p.created_at).toLocaleString()})
                  </small>
                  
                  {(user.isAdmin || user.id === p.user_id) && (
                    <button 
                      onClick={() => handleDeletePost(p.id)} 
                      style={{ color: 'red', cursor: 'pointer', padding: '2px 6px', fontSize: '11px', border: '1px solid red', borderRadius: '3px', backgroundColor: '#fff', flexShrink: 0 }}
                    >
                      🗑 削除
                    </button>
                  )}
                </div>

                {/* コメントの上部に画像を表示 */}
                {fullImageUrl && (
                  <div style={{ marginTop: '8px', marginBottom: '8px', textAlign: 'center' }}>
                    <img 
                      src={fullImageUrl} 
                      alt="添付画像" 
                      /* 💡 修正：クリックしたらステートにURLをセット（ポップアップを開く） */
                      onClick={() => setModalImageUrl(fullImageUrl)}
                      /* 💡 修正：クリックできることが分かるよう cursor: 'pointer' を追加 */
                      style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '4px', objectFit: 'contain', display: 'block', margin: '0 auto', cursor: 'pointer' }} 
                    />
                  </div>
                )}

                <p style={{ margin: '5px 0 0 0', whiteSpace: 'pre-wrap', color: '#222', fontSize: '15px', textAlign: 'left' }}>{p.content}</p>

              </div>
            );
          })
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
        {previewUrl && (
          <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img 
                src={previewUrl} 
                alt="プレビュー" 
                style={{ maxHeight: '120px', borderRadius: '4px', display: 'block' }} 
              />
              <button 
                type="button" 
                onClick={() => { setSelectedImage(null); setPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', cursor: 'pointer', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', fontWeight: 'bold' }}
              >
                ×
              </button>
            </div>
          </div>
        )}

        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="書き込み内容を入力してください..."
          style={{ width: '100%', height: '80px', padding: '8px', marginBottom: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #bbb' }}
          required
        />

        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          コメントを書き込む
        </button>
      </form>

      {/* 💡 【新設】画像ポップアップモーダル本体 */}
      {modalImageUrl && (
        <div 
          /* 背景の黒いフィルター */
          onClick={() => setModalImageUrl(null)} // 背景クリックで閉じる
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999, // 一番手前に表示
            cursor: 'zoom-out' // 閉じられることを示すカーソル
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
            <img 
              src={modalImageUrl} 
              alt="拡大画像" 
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                objectFit: 'contain'
              }} 
            />
            {/* 右上の閉じる(×)ボタン */}
            <button
              onClick={() => setModalImageUrl(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '30px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

    </div>
  );
}