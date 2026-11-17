import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthUser } from '../common/auth-user';
import { CurrentUser, Roles } from '../common/decorators';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateReportDto, HandleReportDto, ListReportsQuery, UpdatePostStatusDto } from './dto/report.dto';
import { ReportsService } from './reports.service';

@Controller()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('reports')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('member')
  createReport(@CurrentUser() user: AuthUser, @Body() dto: CreateReportDto) {
    return this.reportsService.createReport(dto, user);
  }

  @Get('reports')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  listReports(@Query() query: ListReportsQuery) {
    return this.reportsService.listReports(query.status, query.page);
  }

  @Patch('reports/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  handleReport(
    @Param('id') id: string,
    @Body() dto: HandleReportDto,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.reportsService.handleReport(id, dto, admin);
  }

  @Patch('admin/posts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updatePostStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePostStatusDto,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.reportsService.updatePostStatus(id, dto.status, admin);
  }
}
