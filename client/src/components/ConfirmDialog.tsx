// client/src/components/ConfirmDialog.tsx
import { useEffect, useId, type ReactNode } from 'react';
import { Button } from './Button';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Xác nhận',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();

  // Xử lý đóng khi bấm Esc
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    if (open) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="dialog-backdrop" onClick={onCancel}>
      {/* role="dialog" + aria-labelledby để trình đọc màn hình nhận ra đây là hộp thoại và đọc tiêu đề */}
      <div
        className="dialog card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-head">
          <h2 id={titleId}>{title}</h2>
        </div>
        <div style={{ margin: '12px 0' }}>
          {message}
        </div>
        <div className="form-actions end">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Huỷ
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={loading} // Gắn loading vào Button đã làm ở C2
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}