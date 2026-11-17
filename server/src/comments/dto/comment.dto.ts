import { Transform } from 'class-transformer';
import { IsMongoId, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateCommentDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty({ message: 'Nội dung bình luận không được để trống' })
  @IsString({ message: 'Nội dung bình luận phải là chuỗi' })
  @Length(1, 1000, { message: 'Nội dung bình luận từ 1 đến 1000 ký tự' })
  content: string;

  @IsOptional()
  @IsMongoId({ message: 'parentId không hợp lệ' })
  parentId?: string;
}
