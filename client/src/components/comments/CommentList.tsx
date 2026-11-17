import { useEffect, useState } from 'react';
import { parseError } from '../../api/client';
import { postsApi } from '../../api/posts';
import { Button } from '../Button';
import { Spinner } from '../Spinner';
import type { Comment } from '../../types';
import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';

export interface CommentListProps {
  postId: string;
  postAuthorId: string;
  onCommentCountChange?: (delta: number) => void;
}

export function CommentList({ postId, postAuthorId, onCommentCountChange }: CommentListProps) {
  const [items, setItems] = useState<Comment[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    postsApi
      .getComments(postId)
      .then((page) => {
        if (!active) return;
        setItems(page.items);
        setNextCursor(page.nextCursor);
        setHasMore(page.hasMore);
      })
      .catch((err) => {
        if (!active) return;
        setError(parseError(err).message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [postId]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || !nextCursor) return;
    setLoadingMore(true);
    try {
      const page = await postsApi.getComments(postId, nextCursor);
      setItems((prev) => [...prev, ...page.items]);
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch (err) {
      setError(parseError(err).message);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleCommentSuccess = (newComment: Comment) => {
    if (!newComment.parent) {
      setItems((prev) => [newComment, ...prev]);
    } else {
      setItems((prev) =>
        prev.map((root) => {
          if (root._id === newComment.parent) {
            const replies = root.replies ? [...root.replies, newComment] : [newComment];
            return { ...root, replies };
          }
          return root;
        }),
      );
    }
    onCommentCountChange?.(1);
  };

  const handleDeleteSuccess = (deletedId: string, count: number) => {
    setItems((prev) =>
      prev
        .filter((root) => root._id !== deletedId)
        .map((root) => {
          if (!root.replies) return root;
          return {
            ...root,
            replies: root.replies.filter((r) => r._id !== deletedId),
          };
        }),
    );
    onCommentCountChange?.(-count);
  };

  return (
    <div className="comment-list-container stack">
      <div className="comment-form-section">
        <CommentForm
          postId={postId}
          onSuccess={handleCommentSuccess}
          placeholder="Chia sẻ cảm nghĩ của bạn về chuyến đi..."
        />
      </div>

      {loading && items.length === 0 ? (
        <div className="comment-loading">
          <Spinner size="md" />
        </div>
      ) : error && items.length === 0 ? (
        <div className="alert alert-error">{error}</div>
      ) : items.length === 0 ? (
        <p className="muted small comment-empty-text">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>
      ) : (
        <div className="comment-items-wrapper stack">
          {items.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              postId={postId}
              postAuthorId={postAuthorId}
              onReplySuccess={handleCommentSuccess}
              onDeleteSuccess={handleDeleteSuccess}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="comment-load-more">
          <Button variant="secondary" size="sm" onClick={handleLoadMore} isLoading={loadingMore}>
            Xem thêm bình luận
          </Button>
        </div>
      )}
    </div>
  );
}

export default CommentList;
