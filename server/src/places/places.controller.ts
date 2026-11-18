import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PlacesService } from './places.service';

// B12 (mục 10.1): gợi ý + chi tiết địa điểm qua Google Places.
// Cả hai route yêu cầu đăng nhập (JwtAuthGuard) — khoá chỉ Google dùng trong ứng dụng,
// không cho khách gọi trực tiếp (tránh spam, lộ key nếu sau này tăng quota theo user).
@Controller('places')
@UseGuards(JwtAuthGuard)
export class PlacesController {
  constructor(private readonly places: PlacesService) {}

  @Get('autocomplete')
  autocomplete(@Query('q') q: string, @Query('sessionToken') sessionToken?: string) {
    return this.places.autocomplete(q, sessionToken);
  }

  @Get(':placeId')
  detail(
    @Param('placeId') placeId: string,
    @Query('sessionToken') sessionToken?: string,
  ) {
    return this.places.detail(placeId, sessionToken);
  }
}
