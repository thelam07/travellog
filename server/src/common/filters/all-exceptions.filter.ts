import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { mongo } from 'mongoose';

const DEFAULT_CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  429: 'TOO_MANY_REQUESTS',
  502: 'BAD_GATEWAY',
};

// Gom mọi lỗi về { error: { code, message, details } } (mục 6).
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Có lỗi xảy ra, vui lòng thử lại sau';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      code = DEFAULT_CODES[status] ?? 'ERROR';
      if (typeof body === 'string') {
        message = body;
      } else {
        const b = body as { code?: string; message?: string | string[]; details?: unknown };
        code = b.code ?? code;
        message = Array.isArray(b.message) ? b.message.join('; ') : (b.message ?? message);
        details = b.details;
      }
      // Multer báo file quá lớn bằng 413; tài liệu thống nhất trả 400 (BR05).
      if (status === HttpStatus.PAYLOAD_TOO_LARGE) {
        status = HttpStatus.BAD_REQUEST;
        code = 'FILE_TOO_LARGE';
        message = 'Mỗi ảnh tối đa 5 MB';
      }
    } else if (exception instanceof mongo.MongoServerError && exception.code === 11000) {
      status = HttpStatus.CONFLICT;
      code = 'DUPLICATE';
      message = 'Dữ liệu đã tồn tại';
    } else {
      this.logger.error(exception instanceof Error ? exception.stack : exception);
    }

    res.status(status).json({ error: { code, message, ...(details ? { details } : {}) } });
  }
}
