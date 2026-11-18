import { useState } from 'react';
import { Link } from 'react-router';
import { parseError } from '../../api/client';
import { postsApi } from '../../api/posts';
import { Avatar } from '../Avatar';
import { ConfirmDialog } from '../ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';
import { timeAgo } from '../../utils/format';
import type { Comment } from '../../types';
import { CommentForm } from './CommentForm';

export interface CommentItemProps {
  comment: Comment;
  postId: string;
  postAuthorId: string;
  isReply?: boolean;
  onReplySuccess: (reply: Comment) => void;
  onDeleteSuccess: (commentId: string, deletedCount: number) => void;
}

export function CommentItem({
  comment,
  postId,
  postAuthorId,
  isReply = false,
  onReplySuccess,
  onDeleteSuccess,
}: CommentItemProps) {
  const { user, isAdmin } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isCommentAuthor = Boolean(user && user._id === comment.author._id);
  const isPostAuthor = Boolean(user && user._id === postAuthorId);
  const canDelete = isCommentAuthor || isPostAuthor || isAdmin;
  const canReply = Boolean(user && !isAdmin);

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await postsApi.deleteComment(comment._id);
      setConfirmOpen(false);
      onDeleteSuccess(comment._id, res.deleted);
    } catch (err) {
      setDeleteError(parseError(err).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={`comment-item ${isReply ? 'comment-reply-item' : 'comment-root-item'}`}>
      {/* (A) Giống bản mẫu: bong bóng chứa tên + nội dung; thời gian · Trả lời · Xoá nằm dưới bong bóng */}
      <div className="comment-main">
        <Link to={`/u/${comment.author.username}`} className="comment-avatar-link">
          <Avatar user={comment.author} size="sm" />
        </Link>
        <div className="comment-body">
          <div className="comment-bubble">
            <Link to={`/u/${comment.author.username}`} className="comment-author-name">
              {comment.author.displayName || comment.author.username}
            </Link>
            <div className="comment-content">{comment.content}</div>
          </div>
          <div className="comment-actions">
            <span className="comment-time">{timeAgo(comment.createdAt)}</span>
            {canReply && (
              <button
                type="button"
                className="btn-link comment-action-btn reply-btn"
                onClick={() => setIsReplying((prev) => !prev)}
              >
                Trả lời
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                className="btn-link comment-action-btn delete-btn"
                onClick={() => setConfirmOpen(true)}
                disabled={deleting}
              >
                Xoá
              </button>
            )}
          </div>
          {deleteError && <p className="field-error comment-error">{deleteError}</p>}

          {isReplying && (
            <div className="comment-reply-form-wrapper">
              <CommentForm
                postId={postId}
                parentId={comment.parent ?? comment._id}
                placeholder={`Trả lời ${comment.author.displayName || comment.author.username}...`}
                autoFocus
                onCancel={() => setIsReplying(false)}
                onSuccess={(reply) => {
                  setIsReplying(false);
                  onReplySuccess(reply);
                }}
              />
            </div>
          )}

          {!isReply && comment.replies && comment.replies.length > 0 && (
            <div className="comment-replies-list">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  postId={postId}
                  postAuthorId={postAuthorId}
                  isReply={true}
                  onReplySuccess={onReplySuccess}
                  onDeleteSuccess={onDeleteSuccess}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Xoá bình luận?"
        message="Bạn có chắc muốn xoá bình luận này? Nếu là bình luận gốc, các câu trả lời bên dưới cũng sẽ bị xoá."
        confirmLabel="Xoá"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setConfirmOpen(false)}
      />
    </div>
  );
}

export default CommentItem;
