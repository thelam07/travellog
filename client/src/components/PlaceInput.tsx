// client/src/components/PlaceInput.tsx
// B12 (mục 10.1): ô nhập địa điểm có gợi ý Google Places.
// - Gõ từ 2 kí tự + dừng 400 ms → gọi autocomplete (sessionToken giữ nguyên trong 1 lượt).
// - Chọn gợi ý → gọi detail cùng sessionToken, điền placeId/address/lat/lng, rồi tạo token mới.
// - Lỗi (502 PLACES_UNAVAILABLE hoặc bất kỳ): giữ chữ đã gõ, hiện "đang nhập tay".
// - Sửa chữ sau khi chọn → xoá placeId/toạ độ (nhập tay).

import { useCallback, useEffect, useRef, useState } from 'react';
import { parseError } from '../api/client';
import { placesApi } from '../api/places';
import { useDebounce } from '../hooks/useDebounce';
import type { PlaceDetail, PlaceSuggestion } from '../types';

export interface PlaceInputValue {
  name: string;
  placeId?: string;
  address?: string;
  lat?: number;
  lng?: number;
}

export interface PlaceInputProps {
  /** Giá trị hiện tại (controlled). */
  value: PlaceInputValue;
  /** Báo cho parent biết name hoặc toạ độ đã đổi. */
  onChange: (v: PlaceInputValue) => void;
  id?: string;
  placeholder?: string;
  /** Có báo lỗi ở parent (vd: validate form). */
  error?: string;
  required?: boolean;
  maxLength?: number;
}

function newToken(): string {
  // Trình duyệt nào cũng có crypto.randomUUID() từ 2022; fallback Date.now + Math.random.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function PlaceInput({
  value,
  onChange,
  id = 'place-input',
  placeholder = 'Tên địa điểm (vd: Hà Nội, Phú Quốc…)',
  error,
  required,
  maxLength = 200,
}: PlaceInputProps) {
  const [query, setQuery] = useState(value.name ?? '');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null); // "đang nhập tay"
  const [picking, setPicking] = useState(false);

  // sessionToken mới cho mỗi lượt gõ–chọn (Google dùng để gộp billing).
  const sessionTokenRef = useRef<string>(newToken());
  // Token lượt hiện tại để bỏ qua response cũ khi đổi query.
  const requestIdRef = useRef(0);
  // Tên đã chọn (để biết khi user sửa chữ nào thì clear).
  const lastPickedNameRef = useRef<string>(value.name ?? '');
  // Bỏ qua useEffect 1 lần sau khi chọn gợi ý (chữ vừa set = tên đã chọn, không trigger gọi).
  const suppressNextRef = useRef(false);

  const debounced = useDebounce(query.trim(), 400);

  // Đồng bộ từ value bên ngoài khi parent reset form (vd: sửa bài, parent truyền name mới).
  useEffect(() => {
    if ((value.name ?? '') !== query) {
      setQuery(value.name ?? '');
      lastPickedNameRef.current = value.name ?? '';
      sessionTokenRef.current = newToken();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.name]);

  // Gọi autocomplete khi debounced đổi (≥ 2 kí tự).
  useEffect(() => {
    if (suppressNextRef.current) {
      suppressNextRef.current = false;
      return;
    }
    if (debounced.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    // User đang gõ tay (sau khi đã chọn) → không gọi nữa, xoá placeId/toạ độ 1 lần.
    if (value.placeId && lastPickedNameRef.current !== query.trim()) {
      onChange({ name: query });
      // Đánh dấu đã xoá placeId để lần render sau không lặp.
      lastPickedNameRef.current = '';
    }
    const myId = ++requestIdRef.current;
    setLoading(true);
    setHint(null);
    placesApi
      .autocomplete(debounced, sessionTokenRef.current)
      .then((list) => {
        if (myId !== requestIdRef.current) return;
        setSuggestions(list);
        setOpen(list.length > 0);
        if (list.length === 0) setHint('Đang nhập tay');
      })
      .catch((err) => {
        if (myId !== requestIdRef.current) return;
        // 502 PLACES_UNAVAILABLE hoặc lỗi mạng → giữ chữ đã gõ, gợi ý nhập tay.
        setSuggestions([]);
        setOpen(false);
        setHint(parseError(err).message || 'Đang nhập tay');
      })
      .finally(() => {
        if (myId === requestIdRef.current) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const pick = useCallback(
    async (s: PlaceSuggestion) => {
      // Khi user chọn, giữ nguyên sessionToken để Google gộp chi phí.
      const token = sessionTokenRef.current;
      setPicking(true);
      setOpen(false);
      try {
        const detail: PlaceDetail = await placesApi.detail(s.placeId, token);
        const next: PlaceInputValue = {
          name: detail.name || s.text,
          placeId: detail.placeId,
          address: detail.address,
          lat: detail.lat,
          lng: detail.lng,
        };
        suppressNextRef.current = true; // useEffect sẽ thấy query không đổi → không gọi lại
        lastPickedNameRef.current = next.name;
        setQuery(next.name);
        setSuggestions([]);
        setHint(null);
        onChange(next);
      } catch (err) {
        // Chi tiết thất bại nhưng user đã chọn gợi ý → vẫn giữ tên.
        suppressNextRef.current = true;
        lastPickedNameRef.current = s.text;
        setQuery(s.text);
        setHint(parseError(err).message || 'Đang nhập tay');
        onChange({ name: s.text });
      } finally {
        setPicking(false);
        // Lượt gõ–chọn kết thúc → token mới cho lần sau.
        sessionTokenRef.current = newToken();
      }
    },
    [onChange],
  );

  // Đóng dropdown khi click ra ngoài.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="place-input" ref={rootRef}>
      <input
        id={id}
        type="text"
        value={query}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          // Báo parent ngay để đồng bộ text ngay cả khi chưa gọi API.
          onChange({ name: e.target.value });
        }}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
      />
      {open && (suggestions.length > 0 || loading) && (
        <ul className="place-input-list" role="listbox" id={`${id}-listbox`}>
          {loading && (
            <li className="place-input-loading muted small">Đang tìm…</li>
          )}
          {suggestions.map((s) => (
            <li
              key={s.placeId}
              role="option"
              aria-selected="false"
              className="place-input-item"
              onMouseDown={(e) => {
                // mousedown để chạy trước blur của input.
                e.preventDefault();
                pick(s);
              }}
            >
              {s.text}
            </li>
          ))}
        </ul>
      )}
      {(picking || loading) && !open && (
        <div className="field-hint">Đang tải chi tiết…</div>
      )}
      {hint && !loading && !picking && (
        <div className="field-hint">{hint}</div>
      )}
      {value.placeId && value.lat !== undefined && value.lng !== undefined && !loading && !picking && !hint && (
        <div className="field-hint">Đã lưu toạ độ cho địa điểm này.</div>
      )}
    </div>
  );
}

export default PlaceInput;
