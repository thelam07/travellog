import { BadRequestException } from '@nestjs/common';
import { isValidObjectId, Types } from 'mongoose';

// Phân trang bằng con trỏ (BR12): con trỏ = base64 của "createdAt_id" của phần tử cuối trang.
export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export const CURSOR_SORT = { createdAt: -1, _id: -1 } as const;

export function encodeCursor(doc: { createdAt: Date; _id: Types.ObjectId | string }): string {
  return Buffer.from(`${doc.createdAt.toISOString()}_${doc._id}`).toString('base64url');
}

export function cursorFilter(cursor?: string): Record<string, unknown> {
  if (!cursor) return {};
  const [iso, id] = Buffer.from(cursor, 'base64url').toString().split('_');
  const t = new Date(iso);
  if (Number.isNaN(t.getTime()) || !isValidObjectId(id)) {
    throw new BadRequestException({ code: 'INVALID_CURSOR', message: 'Con trỏ phân trang không hợp lệ' });
  }
  const oid = new Types.ObjectId(id);
  return { $or: [{ createdAt: { $lt: t } }, { createdAt: t, _id: { $lt: oid } }] };
}

// Truy vấn lấy limit + 1 phần tử; hàm này cắt về limit và tính nextCursor.
export function toCursorPage<T extends { createdAt: Date; _id: Types.ObjectId | string }>(
  docs: T[],
  limit: number,
): CursorPage<T> {
  const hasMore = docs.length > limit;
  const items = hasMore ? docs.slice(0, limit) : docs;
  return { items, hasMore, nextCursor: hasMore ? encodeCursor(items[items.length - 1]) : null };
}

export function clampLimit(raw: unknown, fallback = 10, max = 50): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) return fallback;
  return Math.min(n, max);
}
