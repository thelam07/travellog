// client/src/pages/PostDetailPage.tsx
// Trang chi tiết bài viết /posts/:id (B9).
// Hiện tác giả, thời gian, tiêu đề, nội dung, hashtag, ảnh (PostGallery), thông tin (PostMeta).
// Chủ bài thấy nút Sửa / Xoá. Bài 'hidden' hiện dải thông báo cho tác giả.

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { parseError } from '../api/client';
import { postsApi } from '../api/posts';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { LikeButton } from '../components/LikeButton';
import { PageSpinner } from '../components/Spinner';
import { PostGallery } from '../components/PostGallery';
import { PostMeta } from '../components/PostMeta';
import { CommentList } from '../components/comments/CommentList';
import { ReportDialog } from '../components/ReportDialog';
import { useAuth } from '../contexts/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { timeAgo } from '../utils/format';
import type { Post } from '../types';

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const url = id ? `/posts/${id}` : null;
  const { data: post, loading, error } = useFetch<Post>(url);
  const [commentCount, setCommentCount] = useState<number>(0);
  // Bình luận trong trình xem ảnh thay đổi thì tải lại danh sách bình luận bên dưới (A, mở rộng)
  const [commentsKey, setCommentsKey] = useState(0);

  useEffect(() => {
    if (post) {
      setCommentCount(post.commentCount);
    }
  }, [post?._id, post?.commentCount]);

  if (loading) return <PageSpinner />;

  if (error || !post) {
    return (
      <div className="container">
        <EmptyState
          icon="🔍"
          title="Bài viết không tồn tại hoặc bạn không có quyền xem"
          description={error ?? undefined}
          action={
            <Link to="/" className="btn btn-primary">
              Về trang chủ
            </Link>
          }
        />
      </div>
    );
  }

  const isOwner = user && post.author._id === user._id;
  const canReport = Boolean(user && user.role === 'member' && user._id !== post.author._id);
  const isHidden = post.status === 'hidden';

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await postsApi.deletePost(post._id);
      setConfirmOpen(false);
      navigate('/', { replace: true });
    } catch (err) {
      setDeleteError(parseError(err).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="post-detail-page">
      <article className="card stack">
        {/* Header: tác giả + thời gian */}
        <header className="post-detail-header">
          <Link to={`/u/${post.author.username}`} className="post-detail-author">
            <Avatar user={post.author} size="md" />
            <div className="post-detail-author-info">
              <div className="post-detail-author-name">
                {post.author.displayName || post.author.username}
              </div>
              <div className="muted small">{timeAgo(post.createdAt)}</div>
            </div>
          </Link>
          {isOwner && (
            <div className="post-detail-actions">
              <Link to={`/posts/${post._id}/edit`} className="btn btn-secondary btn-sm">
                Sửa
              </Link>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setConfirmOpen(true)}
                disabled={deleting}
              >
                Xoá
              </Button>
            </div>
          )}
        </header>

        {/* Dải thông báo bài ẩn (chỉ tác giả thấy) */}
        {isHidden && isOwner && (
          <div className="alert alert-warning">
            Bài viết này đang bị ẩn. Chỉ bạn và quản trị viên thấy được.
          </div>
        )}

        {/* Tiêu đề */}
        <h1 className="post-detail-title">{post.title}</h1>

        {/* Thông tin: địa điểm, ngày, chi phí */}
        <PostMeta location={post.location} tripDate={post.tripDate} cost={post.cost} />

        {/* Ảnh */}
        {post.images.length > 0 && <PostGallery
            images={post.images}
            post={post}
            onCommentCountChange={(delta) => {
              setCommentCount((c) => Math.max(0, c + delta));
              setCommentsKey((k) => k + 1);
            }}
          />}

        {/* Nội dung */}
        <div className="post-detail-content">
          {post.content.split('\n').map((line, i) => (
            <p key={i}>{line || '\u00a0'}</p>
          ))}
        </div>

        {/* Hashtag */}
        {post.hashtags.length > 0 && (
          <div className="post-tags">
            {post.hashtags.map((tag) => (
              <span key={tag} className="tag">#{tag}</span>
            ))}
          </div>
        )}

        <div className="post-detail-actions-row">
          <LikeButton
            postId={post._id}
            initialLiked={post.likedByMe}
            initialCount={post.likeCount}
          />
          <span className="post-detail-comments-count">💬 {commentCount}</span>
          {canReport && (
            <button
              type="button"
              className="btn btn-ghost btn-sm report-post-btn"
              onClick={() => setReportOpen(true)}
            >
              🚩 Báo cáo
            </button>
          )}
        </div>

        <section className="post-comments-section">
          <h2 className="post-comments-heading">Bình luận ({commentCount})</h2>
          <CommentList
            key={commentsKey}
            postId={post._id}
            postAuthorId={post.author._id}
            onCommentCountChange={(delta) => setCommentCount((c) => Math.max(0, c + delta))}
          />
        </section>

        {deleteError && <div className="alert alert-error">{deleteError}</div>}
      </article>

      <ConfirmDialog
        open={confirmOpen}
        title="Xoá bài viết?"
        message={
          <>
            Bạn có chắc muốn xoá bài <strong>{post.title}</strong>? Hành động này không thể hoàn tác.
          </>
        }
        confirmLabel="Xoá"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setConfirmOpen(false)}
      />

      <ReportDialog
        open={reportOpen}
        postId={post._id}
        onClose={() => setReportOpen(false)}
      />
    </div>
  );
}
