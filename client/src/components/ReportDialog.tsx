import { useEffect, useState } from 'react';
import { parseError } from '../api/client';
import { reportsApi } from '../api/reports';
import type { ReportReason } from '../types';
import { Button } from './Button';
import { FormField } from './FormField';

export interface ReportDialogProps {
  open: boolean;
  postId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const REASON_OPTIONS: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam' },
  { value: 'offensive', label: 'Nội dung phản cảm' },
  { value: 'false_info', label: 'Sai sự thật' },
  { value: 'other', label: 'Khác' },
];

export function ReportDialog({ open, postId, onClose, onSuccess }: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason>('spam');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setReason('spam');
      setNote('');
      setError(null);
      setSuccess(false);
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    if (open) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, loading, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || success) return;

    setLoading(true);
    setError(null);

    try {
      await reportsApi.create({
        postId,
        reason,
        note: note.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      const parsed = parseError(err);
      if (parsed.status === 409 || parsed.code === 'ALREADY_REPORTED') {
        setError('Bạn đã báo cáo bài này');
      } else {
        setError(parsed.message || 'Gửi báo cáo thất bại');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dialog-backdrop" onClick={loading ? undefined : onClose}>
      <div
        className="dialog card report-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Báo cáo bài viết"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-head">
          <h2>Báo cáo bài viết</h2>
        </div>

        {success ? (
          <div className="report-success-wrapper">
            <div className="alert alert-success">Đã gửi báo cáo</div>
          </div>
        ) : (
          <form className="stack report-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label className="report-field-label">Lý do báo cáo</label>
              <div className="report-reasons-group">
                {REASON_OPTIONS.map((opt) => (
                  <label key={opt.value} className="report-reason-label">
                    <input
                      type="radio"
                      name="reportReason"
                      value={opt.value}
                      checked={reason === opt.value}
                      onChange={() => setReason(opt.value)}
                      disabled={loading}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <FormField label="Mô tả thêm" hint={`${note.length}/500`}>
              <textarea
                className="report-textarea"
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 500))}
                placeholder="Cung cấp thêm chi tiết..."
                rows={3}
                maxLength={500}
                disabled={loading}
              />
            </FormField>

            {error && <p className="field-error report-error">{error}</p>}

            <div className="form-actions end report-dialog-actions">
              <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                Huỷ
              </Button>
              <Button type="submit" variant="danger" isLoading={loading}>
                Gửi báo cáo
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ReportDialog;
