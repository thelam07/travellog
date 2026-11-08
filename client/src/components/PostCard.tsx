// client/src/components/PostCard.tsx
import { Link } from 'react-router';
import type { Post } from '../types';
import { Avatar } from './Avatar';
import { formatTimeAgo, formatCurrency } from '../utils/format';

export interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  // Biểu tượng chế độ xem
  const visibilityIcon = post.visibility === 'public' ? '🌍' : '🔒';
  
  // Rút gọn nội dung nếu quá dài (ví dụ: 150 ký tự)
  const previewContent = post.content.length > 150 
    ? post.content.substring(0, 150) + '...' 
    : post.content;

  return (
    <div className="card post-card stack">
      {/* 1. Header: Avatar, Tác giả, Thời gian, Visibility */}
      <div className="post-header" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <Link to={`/u/${post.author.username}`}>
          <Avatar user={post.author} size="md" />
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link to={`/u/${post.author.username}`} className="brand" style={{ fontSize: '1rem' }}>
              {post.author.displayName || post.author.username}
            </Link>
          </div>
          <div className="muted small" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span>{formatTimeAgo(post.createdAt)}</span>
            <span>•</span>
            <span title={post.visibility === 'public' ? 'Công khai' : 'Người theo dõi'}>
              {visibilityIcon}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Tiêu đề và thông tin chuyến đi (Địa điểm, Ngày đi, Chi phí) */}
      <div className="post-info stack" style={{ gap: '4px' }}>
        <Link to={`/posts/${post._id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>{post.title}</h2>
        </Link>
        
        <div className="muted small" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {post.location && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              📍 {post.location.name}
            </span>
          )}
          {post.tripDate && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              📅 {new Date(post.tripDate).toLocaleDateString('vi-VN')}
            </span>
          )}
          {post.cost > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              💰 {formatCurrency(post.cost)}
            </span>
          )}
        </div>
      </div>

      {/* 3. Nội dung rút gọn */}
      <p style={{ whiteSpace: 'pre-line', margin: 0 }}>{previewContent}</p>

      {/* 4. Ảnh đính kèm (Hiển thị ảnh đầu tiên và số lượng còn lại) */}
      {post.images && post.images.length > 0 && (
        <div className="post-image-preview">
          <Link to={`/posts/${post._id}`}>
            <img 
              src={post.images[0].url} 
              alt={post.title} 
              style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
            />
            {post.images.length > 1 && (
              <div className="image-overlay">
                +{post.images.length - 1} ảnh
              </div>
            )}
          </Link>
        </div>
      )}

      {/* 5. Hashtags */}
      {post.hashtags && post.hashtags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {post.hashtags.map(tag => (
            <span key={tag} style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* 6. Thanh tương tác (Like, Comment) */}
      <div className="post-actions" style={{ display: 'flex', gap: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
        {/* TODO: Thay bằng LikeButton (Làm ở C6) */}
        <button className="btn btn-ghost" style={{ padding: '4px 12px', color: post.likedByMe ? 'var(--like)' : 'inherit' }}>
          {post.likedByMe ? '❤️' : '🤍'} {post.likeCount}
        </button>
        
        <Link to={`/posts/${post._id}`} className="btn btn-ghost" style={{ padding: '4px 12px' }}>
          💬 {post.commentCount}
        </Link>
      </div>
    </div>
  );
}