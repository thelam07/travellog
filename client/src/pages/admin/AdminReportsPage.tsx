import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { adminApi } from '../../api/admin';
import { parseError } from '../../api/client';
import { Spinner } from '../../components/Spinner';
import type { PagedList, Report, ReportStatus } from '../../types';
import { formatDate } from '../../utils/format';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  offensive: 'Nội dung phản cảm',
  false_info: 'Sai sự thật',
  other: 'Khác',
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: 'Chờ xử lý', className: 'badge badge-warning' },
  resolved: { label: 'Đã xử lý', className: 'badge badge-success' },
  rejected: { label: 'Đã bỏ qua', className: 'badge badge-secondary' },
};

export default function AdminReportsPage() {
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | 'all'>('pending');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PagedList<Report>>({ items: [], page: 1, limit: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.reports({
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        page,
      });
      setData(res);
    } catch (err) {
      setError(parseError(err).message);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleHidePost = async (report: Report) => {
    if (!report.post) return;
    setActionId(report._id);
    try {
      await adminApi.handleReport(report._id, { status: 'resolved', hidePost: true });
      setNotice({ type: 'success', text: `Đã ẩn bài viết và chuyển các báo cáo liên quan sang "Đã xử lý".` });
      void load();
    } catch (err) {
      setNotice({ type: 'error', text: parseError(err).message });
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (report: Report) => {
    setActionId(report._id);
    try {
      await adminApi.handleReport(report._id, { status: 'rejected' });
      setNotice({ type: 'success', text: `Đã bỏ qua báo cáo.` });
      void load();
    } catch (err) {
      setNotice({ type: 'error', text: parseError(err).message });
    } finally {
      setActionId(null);
    }
  };

  const handleUnhidePost = async (report: Report) => {
    if (!report.post) return;
    setActionId(report._id);
    try {
      await adminApi.updatePostStatus(report.post._id, { status: 'active' });
      setNotice({ type: 'success', text: `Đã bỏ ẩn bài viết "${report.post.title}".` });
      void load();
    } catch (err) {
      setNotice({ type: 'error', text: parseError(err).message });
    } finally {
      setActionId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(data.total / data.limit));

  return (
    <div className="admin-page stack">
      <header className="admin-page-header">
        <div>
          <h1>Báo cáo vi phạm</h1>
          <p className="muted small">Xem và kiểm duyệt các báo cáo bài viết từ thành viên.</p>
        </div>
      </header>

      {notice && (
        <div className={`alert alert-${notice.type}`}>
          {notice.text}
        </div>
      )}

      <div className="admin-filter-bar">
        <div className="admin-tabs">
          <button
            type="button"
            className={`admin-tab-btn ${selectedStatus === 'pending' ? 'active' : ''}`}
            onClick={() => {
              setSelectedStatus('pending');
              setPage(1);
            }}
          >
            Chờ xử lý
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${selectedStatus === 'resolved' ? 'active' : ''}`}
            onClick={() => {
              setSelectedStatus('resolved');
              setPage(1);
            }}
          >
            Đã xử lý
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${selectedStatus === 'rejected' ? 'active' : ''}`}
            onClick={() => {
              setSelectedStatus('rejected');
              setPage(1);
            }}
          >
            Đã bỏ qua
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${selectedStatus === 'all' ? 'active' : ''}`}
            onClick={() => {
              setSelectedStatus('all');
              setPage(1);
            }}
          >
            Tất cả
          </button>
        </div>
      </div>

      {loading && data.items.length === 0 ? (
        <div className="admin-loading-wrapper">
          <Spinner size="md" />
        </div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : data.items.length === 0 ? (
        <div className="card admin-empty-card">
          <p className="muted">Không có báo cáo nào ở trạng thái này.</p>
        </div>
      ) : (
        <div className={`card table-wrap ${loading ? 'is-loading' : ''}`}>
          <table className="table">
            <thead>
              <tr>
                <th>Bài viết</th>
                <th>Tác giả</th>
                <th>Người báo cáo</th>
                <th>Lý do & Ghi chú</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((r) => {
                const isProcessing = actionId === r._id;
                const statusMeta = STATUS_CONFIG[r.status] ?? {
                  label: r.status,
                  className: 'badge',
                };
                const isHidden = r.post?.status === 'hidden';

                return (
                  <tr key={r._id}>
                    <td data-label="Bài viết">
                      {r.post ? (
                        <div className="admin-report-post-cell">
                          <Link to={`/posts/${r.post._id}`} className="admin-post-link">
                            {r.post.title}
                          </Link>
                          {isHidden && (
                            <span className="badge badge-danger">Đã ẩn</span>
                          )}
                        </div>
                      ) : (
                        <span className="muted small">Bài viết đã bị xoá</span>
                      )}
                    </td>
                    <td data-label="Tác giả">
                      {r.post?.author ? (
                        <Link to={`/u/${r.post.author.username}`}>
                          @{r.post.author.username}
                        </Link>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td data-label="Người báo cáo">
                      <Link to={`/u/${r.reporter.username}`}>
                        @{r.reporter.username}
                      </Link>
                    </td>
                    <td data-label="Lý do & Ghi chú">
                      <div className="admin-report-reason-cell">
                        <strong>{REASON_LABELS[r.reason] || r.reason}</strong>
                        {r.note && <span className="muted small">{r.note}</span>}
                      </div>
                    </td>
                    <td data-label="Thời gian">
                      <span className="muted small">{formatDate(r.createdAt)}</span>
                    </td>
                    <td data-label="Trạng thái">
                      <span className={statusMeta.className}>{statusMeta.label}</span>
                    </td>
                    <td data-label="Thao tác">
                      <div className="form-actions">
                        {isHidden ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleUnhidePost(r)}
                            disabled={isProcessing}
                          >
                            Bỏ ẩn
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => handleHidePost(r)}
                            disabled={isProcessing || !r.post}
                          >
                            Ẩn bài
                          </button>
                        )}
                        {r.status === 'pending' && (
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            onClick={() => handleReject(r)}
                            disabled={isProcessing}
                          >
                            Bỏ qua
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {data.total > 0 && totalPages > 1 && (
        <nav className="pager" aria-label="Phân trang">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={16} aria-hidden />
            Trước
          </button>
          <span className="muted small">
            Trang {data.page}/{totalPages} · {data.total} báo cáo
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Sau
            <ChevronRight size={16} aria-hidden />
          </button>
        </nav>
      )}
    </div>
  );
}
