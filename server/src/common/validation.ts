import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common';

function collect(errors: ValidationError[], parent = '', out: Record<string, string[]> = {}) {
  for (const e of errors) {
    const path = parent ? `${parent}.${e.property}` : e.property;
    if (e.constraints) out[path] = Object.values(e.constraints);
    if (e.children?.length) collect(e.children, path, out);
  }
  return out;
}

// whitelist: bỏ trường lạ (BR18: role gửi kèm khi đăng ký bị bỏ qua). Lỗi trả theo từng trường.
export const validationPipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  exceptionFactory: (errors) =>
    new BadRequestException({
      code: 'VALIDATION_ERROR',
      message: 'Dữ liệu không hợp lệ',
      details: collect(errors),
    }),
});
