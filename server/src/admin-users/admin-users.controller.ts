import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { AdminCreateUserDto, ResetPasswordDto } from '../auth/dto/auth.dto';
import { AuthUser, Role } from '../common/auth-user';
import { CurrentUser, Roles } from '../common/decorators';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { AdminUsersService } from './admin-users.service';

class ListUsersQuery {
  @IsOptional() @IsString() @MaxLength(100) q?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
}

class UpdateUserDto {
  @IsOptional() @IsBoolean({ message: 'isLocked là true hoặc false' }) isLocked?: boolean;
  @IsOptional() @IsIn(['member', 'admin'], { message: 'Vai trò là member hoặc admin' }) role?: Role;
}

// F17, F14. Chỉ admin; guard gắn cho cả controller.
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminUsersController {
  constructor(private readonly adminUsers: AdminUsersService) {}

  @Get()
  list(@Query() query: ListUsersQuery) {
    return this.adminUsers.list(query.q, query.page);
  }

  @Post()
  create(@Body() dto: AdminCreateUserDto) {
    return this.adminUsers.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateUserDto, @CurrentUser() admin: AuthUser) {
    return this.adminUsers.update(id, dto, admin);
  }

  @Put(':id/password')
  resetPassword(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: ResetPasswordDto) {
    return this.adminUsers.resetPassword(id, dto.newPassword);
  }
}
