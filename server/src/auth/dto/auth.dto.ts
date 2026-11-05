import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Length, Matches, MaxLength } from 'class-validator';

const lower = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value);

// BR19: ít nhất 8 kí tự, có chữ và số. MaxLength 72 vì bcrypt chỉ dùng 72 byte đầu.
export const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
export const PASSWORD_MESSAGE = 'Mật khẩu ít nhất 8 kí tự, có cả chữ và số';
// Tránh trùng với route /api/users/me và đường dẫn /admin.
export const RESERVED_USERNAMES = ['me', 'admin'];

// BR18: không có trường role; ValidationPipe whitelist bỏ trường lạ.
export class RegisterDto {
  @Transform(lower)
  @IsString()
  @Length(3, 30, { message: 'Username dài 3–30 kí tự' })
  @Matches(/^[a-z0-9_]+$/, { message: 'Username chỉ gồm a-z, 0-9 và _' })
  username: string;

  @Transform(lower)
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(100)
  email: string;

  @IsString()
  @Matches(PASSWORD_RULE, { message: PASSWORD_MESSAGE })
  @MaxLength(72)
  password: string;
}

export class LoginDto {
  @Transform(lower)
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Nhập mật khẩu' })
  password: string;
}
