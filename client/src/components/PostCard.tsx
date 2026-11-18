// client/src/components/PostCard.tsx
import { useState } from 'react';
import { Link } from 'react-router';
import type { Post } from '../types';
import { Avatar } from './Avatar';
import { LikeButton } from './LikeButton';
import ImageViewer from './ImageViewer';
import { timeAgo, formatDate, formatCurrency } from '../utils/format';

export interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  // (A – mở rộng) Bấm ảnh mở trình xem ảnh có cột tác giả / Thích / bình luận; bình luận trong đó cập nhật số 💬
  const [viewing, setViewing] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const visibilityIcon = post.visibility === 'public' ? '🌍' : '🔒';
  
  const previewContent = post.content.length > 150 
    ? post.content.substring(0, 150) + '...' 
    : post.content;

  return (
    <div className="card post-card stack">
      {/* 1. Header */}
      <div className="post-header">
        <Link to={`/u/${post.author.username}`}>
          <Avatar user={post.author} size="md" />
        </Link>
        <div className="post-author-info">
          <div className="post-author-name">
            <Link to={`/u/${post.author.username}`} className="post-author">
              {post.author.displayName || post.author.username}
            </Link>
          </div>
          <div className="muted small post-meta">
            <span>{timeAgo(post.createdAt)}</span>
            <span>•</span>
            <span title={post.visibility === 'public' ? 'Công khai' : 'Người theo dõi'}>
              {visibilityIcon}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Tiêu đề và thông tin */}
      <div className="post-info stack">
        <Link to={`/posts/${post._id}`} className="post-title-link">
          <h2 className="post-title">{post.title}</h2>
        </Link>
        
        <div className="muted small post-details">
          {post.location && (
            <span className="detail-item">📍 {post.location.name}</span>
          )}
          {post.tripDate && (
            <span className="detail-item">📅 {formatDate(post.tripDate)}</span>
          )}
          {post.cost > 0 && (
            <span className="detail-item">💰 {formatCurrency(post.cost)}</span>
          )}
        </div>
      </div>

      {/* 3. Nội dung */}
      <p className="post-content-preview">{previewContent}</p>

      {/* 4. Ảnh */}
      {post.images && post.images.length > 0 && (
        <div className="post-image-preview">
          <button type="button" className="post-image-btn" onClick={() => setViewing(true)} aria-label={`Xem ảnh của bài ${post.title}`}>
            <img
              src={post.images[0].url}
              alt={post.title}
              className="post-cover-image"
            />
            {post.images.length > 1 && (
              <div className="image-overlay">
                +{post.images.length - 1} ảnh
              </div>
            )}
          </button>
          {viewing && (
            <ImageViewer
              images={post.images.map((img, i) => ({ url: img.url, alt: `${post.title} – ảnh ${i + 1}` }))}
              post={post}
              onCommentCountChange={(d) => setCommentCount((c) => Math.max(0, c + d))}
              onClose={() => setViewing(false)}
            />
          )}
        </div>
      )}

      {/* 5. Hashtags */}
      {post.hashtags && post.hashtags.length > 0 && (
        <div className="post-tags">
          {post.hashtags.map(tag => (
            <span key={tag} className="tag">#{tag}</span>
          ))}
        </div>
      )}

      {/* 6. Hành động */}
      <div className="post-actions">
        <LikeButton postId={post._id} initialLiked={post.likedByMe} initialCount={post.likeCount} />
        
        <Link to={`/posts/${post._id}`} className="btn btn-ghost">
          💬 {commentCount}
        </Link>
      </div>
    </div>
  );
}