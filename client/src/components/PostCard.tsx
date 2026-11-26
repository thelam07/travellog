// client/src/components/PostCard.tsx
import { useState } from 'react';
import { Link } from 'react-router';
import type { Post } from '../types';
import { Avatar } from './Avatar';
import { LikeButton } from './LikeButton';
import { PostGallery } from './PostGallery';
import { timeAgo, formatDate, formatCurrency } from '../utils/format';
import { CalendarDays, Globe, MapPin, MessageCircle, Users, Wallet } from 'lucide-react';

export interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  // (A – mở rộng) Ảnh dạng lưới; bấm ảnh mở trình xem có cột bình luận, bình luận trong đó cập nhật số bình luận
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const visibilityText = post.visibility === 'public' ? 'Công khai' : 'Người theo dõi';
  const VisibilityIcon = post.visibility === 'public' ? Globe : Users;
  
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
            <span>·</span>
            <span className="detail-item"><VisibilityIcon size={14} aria-hidden />{visibilityText}</span>
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
            <span className="detail-item"><MapPin size={15} aria-hidden />{post.location.name}</span>
          )}
          {post.tripDate && (
            <span className="detail-item"><CalendarDays size={15} aria-hidden />{formatDate(post.tripDate)}</span>
          )}
          {post.cost > 0 && (
            <span className="detail-item"><Wallet size={15} aria-hidden />{formatCurrency(post.cost)}</span>
          )}
        </div>
      </div>

      {/* 3. Nội dung */}
      <p className="post-content-preview">{previewContent}</p>

      {/* 4. Ảnh */}
      {post.images && post.images.length > 0 && (
        <PostGallery
          images={post.images}
          post={post}
          compact
          onCommentCountChange={(d) => setCommentCount((c) => Math.max(0, c + d))}
        />
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
          <MessageCircle size={18} aria-hidden />
          {commentCount}
        </Link>
      </div>
    </div>
  );
}