import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { parseError } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useFeedStore } from '../stores/useFeedStore';

export interface LikeButtonProps {
  postId: string;
  initialLiked?: boolean;
  initialCount?: number;
  className?: string;
}

export function LikeButton({ postId, initialLiked = false, initialCount = 0, className = '' }: LikeButtonProps) {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const likeState = useFeedStore((s) => s.likesMap[postId]);
  const isPending = useFeedStore((s) => Boolean(s.pendingLikes[postId]));
  const toggleLike = useFeedStore((s) => s.toggleLike);

  const likedByMe = likeState ? likeState.likedByMe : initialLiked;
  const likeCount = likeState ? likeState.likeCount : initialCount;

  const [error, setError] = useState<string | null>(null);

  if (isAdmin) return null;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    if (isPending) return;

    setError(null);
    try {
      await toggleLike(postId, { likedByMe, likeCount });
    } catch (err) {
      const parsed = parseError(err);
      setError(parsed.message);
    }
  };

  return (
    <span className="like-btn-wrapper" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <button
        type="button"
        className={`btn btn-ghost like-btn ${className}`}
        style={{ color: likedByMe ? 'var(--like)' : 'inherit' }}
        disabled={isPending}
        onClick={handleClick}
        title={likedByMe ? 'Bỏ thích' : 'Thích'}
      >
        <span>{likedByMe ? '❤️' : '🤍'}</span>
        <span>{likeCount}</span>
      </button>
      {error && <span className="field-error" style={{ fontSize: '0.8rem' }}>{error}</span>}
    </span>
  );
}

export default LikeButton;
