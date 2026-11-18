import { useState } from 'react';
import { Link } from 'react-router';
import { parseError } from '../../api/client';
import { postsApi } from '../../api/posts';
import { Avatar } from '../Avatar';
import { Button } from '../Button';
import { useAuth } from '../../contexts/AuthContext';
import type { Comment } from '../../types';

export interface CommentFormProps {
  postId: string;
  parentId?: string;
  placeholder?: string;
  onSuccess: (comment: Comment) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export function CommentForm({
  postId,
  parentId,
  placeholder = 'Viết bình luận...',
  onSuccess,
  onCancel,
  autoFocus = false,
}: CommentFormProps) {
  const { user, isAdmin } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isAdmin) {
    return null;
  }

  if (!user) {
    return (
      <div className="comment-guest-prompt">
        <Link to="/login" className="btn btn-secondary btn-sm">
          Đăng nhập để bình luận
        </Link>
      </div>
    );
  }

  const charCount = content.length;
  const isOverLimit = charCount > 1000;
  const isSubmitDisabled = !content.trim() || isOverLimit || loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitDisabled) return;

    setLoading(true);
    setError(null);

    try {
      const comment = await postsApi.createComment(postId, content.trim(), parentId);
      setContent('');
      onSuccess(comment);
    } catch (err) {
      setError(parseError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      {/* (A) Giống bản mẫu: avatar người viết đứng cạnh ô bình luận */}
      <Avatar user={user} size="sm" />
      <div className="comment-input-wrapper">
        <textarea
          className="comment-textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          maxLength={1000}
          rows={parentId ? 2 : 3}
          autoFocus={autoFocus}
          disabled={loading}
        />
        <div className="comment-form-footer">
          <span className={`comment-char-count ${isOverLimit ? 'over-limit' : ''}`}>
            {charCount}/1000
          </span>
          <div className="comment-form-actions">
            {onCancel && (
              <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={loading}>
                Huỷ
              </Button>
            )}
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitDisabled} isLoading={loading}>
              {parentId ? 'Trả lời' : 'Gửi'}
            </Button>
          </div>
        </div>
        {error && <p className="field-error comment-error">{error}</p>}
      </div>
    </form>
  );
}

export default CommentForm;
