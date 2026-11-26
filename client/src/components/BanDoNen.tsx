// client/src/components/BanDoNen.tsx
// Lớp nền cho bản đồ Leaflet.
// - Có VITE_GOOGLE_MAPS_KEY → nền Google Maps (Maps JavaScript API, region=VN, tiếng Việt) qua plugin GoogleMutant:
//   hiển thị đúng quần đảo Hoàng Sa, Trường Sa của Việt Nam. Ghim, popup, căn khung vẫn do Leaflet lo.
// - Không có key (dev, test e2e) → nền OpenStreetMap như cũ.
// Mỗi lần trang hiện bản đồ Google là 1 lượt tải (map load) tính theo key; ghim, kéo, zoom không tính thêm.

import { useEffect } from 'react';
import { TileLayer, useMap } from 'react-leaflet';
import GoogleMutant from 'leaflet.gridlayer.googlemutant';

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY as string | undefined;

// Chèn script Google Maps đúng một lần cho cả app.
function napGoogleMaps(key: string) {
  if (document.getElementById('google-maps-js')) return;
  const s = document.createElement('script');
  s.id = 'google-maps-js';
  s.async = true;
  s.src =
    'https://maps.googleapis.com/maps/api/js?' +
    new URLSearchParams({ key, language: 'vi', region: 'VN', loading: 'async', v: 'weekly' }).toString();
  document.head.appendChild(s);
}

function NenGoogle({ apiKey }: { apiKey: string }) {
  const map = useMap();
  useEffect(() => {
    napGoogleMaps(apiKey);
    const nen = new GoogleMutant({ type: 'roadmap', maxZoom: 21 });
    nen.addTo(map);
    return () => {
      nen.remove();
    };
  }, [map, apiKey]);
  return null;
}

export function BanDoNen() {
  if (GOOGLE_KEY) return <NenGoogle apiKey={GOOGLE_KEY} />;
  return (
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
  );
}
