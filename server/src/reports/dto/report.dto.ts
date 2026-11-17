import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export const REPORT_REASONS = ['spam', 'offensive', 'false_info', 'other'] as const;
export type ReportReasonType = (typeof REPORT_REASONS)[number];

export class CreateReportDto {
  @IsNotEmpty({ message: 'Mã bài viết không được để trống' })
  @IsString({ message: 'Mã bài viết phải là chuỗi' })
  postId: string;

  @IsNotEmpty({ message: 'Lý do báo cáo không được để trống' })
  @IsEnum(REPORT_REASONS, { message: 'Lý do báo cáo không hợp lệ' })
  reason: ReportReasonType;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  @MaxLength(500, { message: 'Ghi chú tối đa 500 ký tự' })
  note?: string;
}

export class ListReportsQuery {
  @IsOptional()
  @IsIn(['pending', 'resolved', 'rejected'], { message: 'Trạng thái không hợp lệ' })
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Trang phải là số nguyên' })
  @Min(1, { message: 'Trang tối thiểu là 1' })
  page?: number = 1;
}

export class HandleReportDto {
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  @IsIn(['resolved', 'rejected'], { message: 'Trạng thái phải là resolved hoặc rejected' })
  status: 'resolved' | 'rejected';

  @IsOptional()
  @IsBoolean({ message: 'hidePost phải là boolean' })
  hidePost?: boolean;
}

export class UpdatePostStatusDto {
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  @IsIn(['active', 'hidden'], { message: 'Trạng thái phải là active hoặc hidden' })
  status: 'active' | 'hidden';
}
