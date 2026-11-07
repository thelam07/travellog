import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { plainToInstance } from 'class-transformer';

// location gửi dạng chuỗi JSON trong multipart. @Transform chạy SAU bước đổi kiểu mặc định
// của class-transformer, nên phải đọc giá trị gốc qua obj[key] rồi plainToInstance thủ công
// (không dùng @Type(() => LocationDto) — sẽ bị whitelist xoá hết trường).
class LocationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  placeId?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsLatitude()
  lat?: number;

  @IsOptional()
  @IsLongitude()
  lng?: number;
}

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(120)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content!: string;

  @IsObject()
  @ValidateNested()
  @Transform(({ obj }) => {
    const raw = obj.location;
    if (raw && typeof raw === 'string') {
      try {
        return plainToInstance(LocationDto, JSON.parse(raw));
      } catch {
        return raw;
      }
    }
    return raw;
  })
  location!: LocationDto;

  // tripDate gửi dạng YYYY-MM-DD; @Type đổi sang Date rồi @IsDate kiểm tra hợp lệ.
  // Không được ở tương lai (cho lệch múi giờ tối đa 14 giờ).
  @Type(() => Date)
  @IsDate({ message: 'tripDate phải là ngày hợp lệ' })
  tripDate!: Date;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cost?: number;

  @IsEnum(['public', 'followers'])
  visibility!: 'public' | 'followers';
}
