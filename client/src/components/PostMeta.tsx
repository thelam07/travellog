// client/src/components/PostMeta.tsx
// Hiện địa điểm, ngày đi (dd/mm/yyyy), chi phí (Intl.NumberFormat 'vi-VN').

import type { PostLocation } from '../types';

export interface PostMetaProps {
  location?: PostLocation;
  tripDate: string;
  cost: number;
}

function formatTripDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
}

export function PostMeta({ location, tripDate, cost }: PostMetaProps) {
  return (
    <div className="post-meta-list">
      {location?.name && (
        <div className="post-meta-item">
          <span className="post-meta-icon" aria-hidden="true">📍</span>
          <span>{location.name}</span>
        </div>
      )}
      {tripDate && (
        <div className="post-meta-item">
          <span className="post-meta-icon" aria-hidden="true">📅</span>
          <span>{formatTripDate(tripDate)}</span>
        </div>
      )}
      {cost > 0 && (
        <div className="post-meta-item">
          <span className="post-meta-icon" aria-hidden="true">💰</span>
          <span>{formatVND(cost)}</span>
        </div>
      )}
    </div>
  );
}
