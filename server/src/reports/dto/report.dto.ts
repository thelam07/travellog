import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

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
