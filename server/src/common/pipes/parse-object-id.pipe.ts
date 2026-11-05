import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common';
import { isValidObjectId } from 'mongoose';

// :id sai định dạng thì coi như không tồn tại (404) thay vì để Mongoose ném CastError.
@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!isValidObjectId(value)) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Không tìm thấy dữ liệu' });
    return value;
  }
}
