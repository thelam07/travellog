import { Injectable, Logger, BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// B12 (mục 10.1): Google Places — chỉ server giữ API key (GOOGLE_PLACES_KEY).
// Khi key trống / hết quota / Google lỗi → trả 502 PLACES_UNAVAILABLE với thông báo
// tiếng Việt để client hiện "đang nhập tay" thay vì lỗi tiếng Anh.

interface AutocompletePlace {
  placeId: string;
  text: string;
}

interface PlaceDetail {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

const PLACES_TIMEOUT_MS = 5000;

@Injectable()
export class PlacesService {
  private readonly logger = new Logger(PlacesService.name);
  private readonly apiKey: string | undefined;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('GOOGLE_PLACES_KEY') || undefined;
  }

  // Lỗi đồng nhất cho mọi nhánh fail (không có key, timeout, Google 4xx/5xx, body không hợp lệ).
  // Dùng BadGatewayException (502) để khớp api-contract: server chỉ làm cầu nối, Google mới là nguồn gốc.
  private fail(): never {
    throw new BadGatewayException({
      code: 'PLACES_UNAVAILABLE',
      message: 'Chưa gợi ý được địa điểm, bạn vẫn có thể nhập tay.',
    });
  }

  private async fetchWithTimeout(url: string, init: RequestInit, ms = PLACES_TIMEOUT_MS): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  async autocomplete(q: string, sessionToken?: string): Promise<AutocompletePlace[]> {
    if (!this.apiKey) {
      this.logger.warn('GOOGLE_PLACES_KEY chưa cấu hình — autocomplete bị tắt.');
      this.fail();
    }
    const trimmed = (q || '').trim();
    if (!trimmed) return [];

    let res: Response;
    try {
      res = await this.fetchWithTimeout(
        'https://places.googleapis.com/v1/places:autocomplete',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': this.apiKey!,
            'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text',
          },
          body: JSON.stringify({
            input: trimmed,
            sessionToken: sessionToken || undefined,
            languageCode: 'vi',
          }),
        },
      );
    } catch (err) {
      this.logger.warn(`Google Places autocomplete lỗi mạng/timeout: ${(err as Error).message}`);
      this.fail();
    }

    if (!res.ok) {
      this.logger.warn(`Google Places autocomplete HTTP ${res.status}`);
      this.fail();
    }

    let data: any;
    try {
      data = await res.json();
    } catch {
      this.fail();
    }
    const raw = Array.isArray(data?.suggestions) ? data.suggestions : [];
    return raw
      .map((s: any) => s?.placePrediction)
      .filter((p: any) => p && p.placeId && typeof p.placeId === 'string')
      .map((p: any) => ({
        placeId: p.placeId as string,
        text: (p.text?.text as string) || '',
      }))
      .filter((p: AutocompletePlace) => p.text);
  }

  async detail(placeId: string, sessionToken?: string): Promise<PlaceDetail> {
    if (!this.apiKey) {
      this.logger.warn('GOOGLE_PLACES_KEY chưa cấu hình — detail bị tắt.');
      this.fail();
    }
    if (!placeId || typeof placeId !== 'string') this.fail();

    // Google Places API (New) cho phép kèm sessionToken qua header X-Goog-SessionToken.
    const headers: Record<string, string> = {
      'X-Goog-Api-Key': this.apiKey!,
      'X-Goog-FieldMask': 'id,displayName,formattedAddress,location',
    };
    if (sessionToken) headers['X-Goog-SessionToken'] = sessionToken;

    let res: Response;
    try {
      res = await this.fetchWithTimeout(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
        { method: 'GET', headers },
      );
    } catch (err) {
      this.logger.warn(`Google Places detail lỗi mạng/timeout: ${(err as Error).message}`);
      this.fail();
    }

    if (!res.ok) {
      this.logger.warn(`Google Places detail HTTP ${res.status}`);
      this.fail();
    }

    let data: any;
    try {
      data = await res.json();
    } catch {
      this.fail();
    }
    const name = data?.displayName?.text as string | undefined;
    const address = (data?.formattedAddress as string) || '';
    const lat = data?.location?.latitude;
    const lng = data?.location?.longitude;
    if (!name || typeof lat !== 'number' || typeof lng !== 'number') {
      this.logger.warn('Google Places detail thiếu displayName hoặc location');
      this.fail();
    }
    return { placeId, name, address, lat, lng };
  }
}
