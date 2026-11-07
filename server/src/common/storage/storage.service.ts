import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

// Kết quả trả về khi upload một ảnh.
export interface UploadedFile {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
}

// Lưu ảnh vào thư mục uploads/ ở gốc server. Sau này A thêm Cloudinary thì rẽ nhánh
// theo CLOUDINARY_CLOUD_NAME trong .env: có thì dùng Cloudinary, không thì lưu đĩa.
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly publicUrl: string;
  private readonly uploadsDir: string;
  // true khi .env có CLOUDINARY_CLOUD_NAME — chỗ rẽ nhánh cho tương lai.
  private readonly useCloudinary: boolean;

  constructor(config: ConfigService) {
    this.publicUrl = (config.get<string>('PUBLIC_URL') ?? 'http://localhost:3000').replace(/\/$/, '');
    // uploads/ đặt cạnh dist/ khi chạy, tức là cạnh server/.
    this.uploadsDir = join(process.cwd(), 'uploads');
    this.useCloudinary = !!config.get<string>('CLOUDINARY_CLOUD_NAME');
  }

  // Upload một ảnh: ghi file vào uploads/<folder>/<randomUUID>.<ext>, trả về url + publicId.
  // publicId = tên file (không kèm folder) để sau này xoá dễ.
  // Đuôi file lấy từ mimetype, KHÔNG lấy từ originalname — tránh lưu file .html/.js
  // mà trình duyệt chạy như trang web (lỗi bảo mật A review ở PR #15).
  async upload(file: Express.Multer.File, folder: string): Promise<UploadedFile> {
    if (this.useCloudinary) {
      // TODO: khi A thêm Cloudinary thì upload lên Cloudinary ở đây.
      throw new Error('Cloudinary chưa được cài đặt');
    }
    const ext = this.extFromMime(file.mimetype);
    if (!ext) {
      throw new BadRequestException({
        code: 'INVALID_FILE_TYPE',
        message: 'Chỉ nhận ảnh JPG, PNG, WEBP',
      });
    }
    const dir = join(this.uploadsDir, folder);
    await fs.mkdir(dir, { recursive: true });
    const name = `${randomUUID()}${ext}`;
    await fs.writeFile(join(dir, name), file.buffer);
    return {
      url: `${this.publicUrl}/uploads/${folder}/${name}`,
      publicId: name,
    };
  }

  // Upload nhiều ảnh; nếu một ảnh lỗi thì xoá các ảnh đã upload trước rồi ném lỗi.
  async uploadMany(files: Express.Multer.File[], folder: string): Promise<UploadedFile[]> {
    const uploaded: UploadedFile[] = [];
    try {
      for (const file of files) {
        const result = await this.upload(file, folder);
        uploaded.push(result);
      }
      return uploaded;
    } catch (err) {
      // Lỗi giữa chừng: dọn các ảnh đã upload rồi ném tiếp.
      await this.removeMany(uploaded.map((u) => u.publicId));
      throw err;
    }
  }

  // Xoá một file; lỗi chỉ ghi log, không ném. Bỏ qua publicId bắt đầu bằng "demo/".
  async remove(publicId: string): Promise<void> {
    if (!publicId || publicId.startsWith('demo/')) return;
    if (this.useCloudinary) {
      // TODO: Cloudinary.uploader.destroy(publicId).
      return;
    }
    try {
      // publicId chỉ là tên file; tìm trong tất cả folder con của uploads/.
      const dirs = await this.findDirs(this.uploadsDir);
      for (const dir of dirs) {
        const filePath = join(dir, publicId);
        await fs.unlink(filePath).catch(() => undefined);
      }
    } catch (err) {
      this.logger.warn(`Không xoá được ${publicId}: ${(err as Error).message}`);
    }
  }

  async removeMany(publicIds: string[]): Promise<void> {
    await Promise.all(publicIds.map((id) => this.remove(id)));
  }

  // Lấy đuôi file từ MIME type khi originalname không có đuôi.
  private extFromMime(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };
    return map[mime] ?? '';
  }

  // Liệt kê folder con trực tiếp của uploads/ (mỗi folder là một "folder" truyền vào upload).
  private async findDirs(root: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(root, { withFileTypes: true });
      return entries.filter((e) => e.isDirectory()).map((e) => join(root, e.name));
    } catch {
      return [];
    }
  }
}
