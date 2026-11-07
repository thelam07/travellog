import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsIn,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxDate,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { plainToInstance } from 'class-transformer';

// Cho lệch múi giờ tối đa 14 giờ (BR05: tripDate không được ở tương lai).
const latestTripDate = () => new Date(Date.now() + 14 * 3600 * 1000);

// location gửi dạng chuỗi JSON trong multipart. @Transform chạy SAU bước đổi kiểu mặc định
// của class-transformer, nên phải đọc giá trị gốc qua obj[key] rồi plainToInstance thủ công
// (không dùng @Type(() => LocationDto) — sẽ bị whitelist xoá hết trường).
class LocationDto {
  @IsString({ message: 'Tên địa điểm phải là chuỗi' })
  @IsNotEmpty({ message: 'Tên địa điểm không được trống' })
  @MaxLength(200, { message: 'Tên địa điểm tối đa 200 kí tự' })
  name!: string;

  @IsOptional()
  @IsString({ message: 'placeId phải là chuỗi' })
  placeId?: string;

  @IsOptional()
  @IsString({ message: 'Địa chỉ phải là chuỗi' })
  address?: string;

  @IsOptional()
  @IsLatitude({ message: 'Vĩ độ không hợp lệ' })
  lat?: number;

  @IsOptional()
  @IsLongitude({ message: 'Kinh độ không hợp lệ' })
  lng?: number;
}

export class CreatePostDto {
  @IsString({ message: 'Tiêu đề phải là chuỗi' })
  @IsNotEmpty({ message: 'Tiêu đề không được trống' })
  @MinLength(5, { message: 'Tiêu đề dài 5–120 kí tự' })
  @MaxLength(120, { message: 'Tiêu đề dài 5–120 kí tự' })
  title!: string;

  @IsString({ message: 'Nội dung phải là chuỗi' })
  @IsNotEmpty({ message: 'Nội dung không được trống' })
  @MaxLength(5000, { message: 'Nội dung tối đa 5000 kí tự' })
  content!: string;

  @IsObject({ message: 'Địa điểm không hợp lệ' })
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
  // @MaxDate chặn ngày tương lai (cho lệch múi giờ tối đa 14 giờ).
  @Type(() => Date)
  @IsDate({ message: 'Ngày đi không hợp lệ' })
  @MaxDate(latestTripDate, { message: 'Ngày đi không được ở tương lai' })
  tripDate!: Date;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Chi phí phải là số' })
  @Min(0, { message: 'Chi phí phải ≥ 0' })
  cost?: number;

  // IsEnum với mảng làm message bị trống danh sách giá trị; IsIn cho phép message tuỳ ý.
  @IsIn(['public', 'followers'], { message: 'Chế độ hiển thị phải là public hoặc followers' })
  visibility!: 'public' | 'followers';
}
