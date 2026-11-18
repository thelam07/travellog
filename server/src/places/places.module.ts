import { Module } from '@nestjs/common';
import { PlacesController } from './places.controller';
import { PlacesService } from './places.service';

// B12 (mục 10.1): gợi ý + chi tiết địa điểm qua Google Places.
// API key chỉ đọc ở server (ConfigService), client không biết.
@Module({
  controllers: [PlacesController],
  providers: [PlacesService],
})
export class PlacesModule {}
