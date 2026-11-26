// client/src/components/ProfileMap.tsx
// B14 (N01): bản đồ Leaflet trên trang cá nhân.
// - Tải lười bằng React.lazy (xem cách dùng ở ProfilePage).
// - Sửa đường dẫn icon ghim mặc định cho Vite (Leaflet tự require image nội bộ → URL lỗi).
// - Tự căn khung theo các ghim (fitBounds); bấm ghim hiện popup có link tới bài.
// - Người không có bài có toạ độ → EmptyState.

import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { EmptyState } from './EmptyState';
import { PageSpinner } from './Spinner';
import type { MapPoint } from '../types';
import { MapIcon } from 'lucide-react';

// Sửa icon mặc định: Vite không tự resolve được đường dẫn mà Leaflet gán trong CSS.
// Gán URL từ các asset đã import → tile sẽ hiển thị đúng.
const defaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

// Căn khung bản đồ theo các ghim, có padding cho popup.
function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }, [map, points]);
  return null;
}

export interface ProfileMapProps {
  points: MapPoint[];
  loading: boolean;
  error: string | null;
}

// Tâm mặc định khi chưa có ghim nào (Hà Nội) — tránh crash MapContainer yêu cầu center.
const DEFAULT_CENTER: [number, number] = [21.0285, 105.8542];
const DEFAULT_ZOOM = 5;

export default function ProfileMap({ points, loading, error }: ProfileMapProps) {
  // Chỉ tính lại center mặc định khi KHÔNG có ghim; khi có ghim FitBounds lo khung.
  const center = useMemo<[number, number]>(() => {
    if (points.length === 0) return DEFAULT_CENTER;
    return [points[0].lat, points[0].lng];
  }, [points]);

  if (loading) return <PageSpinner />;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (points.length === 0) {
    return (
      <EmptyState
        icon={<MapIcon size={48} strokeWidth={1.5} />}
        title="Chưa có bài viết nào có toạ độ"
        description="Khi đăng bài có chọn địa điểm từ gợi ý Google, bài sẽ xuất hiện ở đây."
      />
    );
  }

  return (
    <div className="profile-map">
      <MapContainer
        center={center}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        style={{ height: '480px', width: '100%', borderRadius: '8px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {points.map((p) => (
          <Marker key={p.postId} position={[p.lat, p.lng]}>
            <Popup>
              <div className="profile-map-popup">
                <div className="profile-map-popup-title">{p.title}</div>
                <div className="muted small">{p.name}</div>
                <Link to={`/posts/${p.postId}`} className="btn btn-primary btn-sm">
                  Mở bài
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
