import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LocationStatsQueryDto } from './dto/location-stats.dto';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('locations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getLocationStats(@Query() query: LocationStatsQueryDto) {
    return this.statsService.getLocationStats(query.limit);
  }
}
