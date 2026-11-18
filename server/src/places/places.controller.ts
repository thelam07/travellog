import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PlacesService } from './places.service';

// B12 (mục 10.1): gợi ý + chi tiết địa điểm qua Google Places.
// Cả hai route yêu cầu đăng nhập (JwtAuthGuard) — khoá chỉ Google dùng trong ứng dụng,
// không cho khách gọi trực tiếp (tránh spam, lộ key nếu sau này tăng quota theo user).
export class AutocompleteQueryDto {
  @IsString({ message: 'Từ khoá phải là chuỗi' })
  @IsNotEmpty({ message: 'Từ khoá không được trống' })
  @MaxLength(100, { message: 'Từ khoá tối đa 100 kí tự' })
  q!: string;

  @IsOptional()
  @IsString({ message: 'sessionToken phải là chuỗi' })
  @MaxLength(100, { message: 'sessionToken tối đa 100 kí tự' })
  sessionToken?: string;
}

@Controller('places')
@UseGuards(JwtAuthGuard)
export class PlacesController {
  constructor(private readonly places: PlacesService) {}

  @Get('autocomplete')
  autocomplete(@Query() query: AutocompleteQueryDto) {
    return this.places.autocomplete(query.q, query.sessionToken);
  }

  @Get(':placeId')
  detail(
    @Param('placeId') placeId: string,
    @Query('sessionToken') sessionToken?: string,
  ) {
    return this.places.detail(placeId, sessionToken);
  }
}
