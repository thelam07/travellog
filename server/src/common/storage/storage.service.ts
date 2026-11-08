import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
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

// .env có CLOUDINARY_CLOUD_NAME (khi deploy Render) thì lưu lên Cloudinary, ảnh nằm trong thư mục travellog/<folder>.
// Không có (chạy local) thì lưu vào thư mục uploads/ ở gốc server. Ổ đĩa Render bị xoá mỗi lần deploy nên bản thật phải dùng Cloudinary.
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly publicUrl: string;
  private readonly uploadsDir: string;
  private readonly useCloudinary: boolean;

  constructor(config: ConfigService) {
    this.publicUrl = (config.get<string>('PUBLIC_URL') ?? 'http://localhost:3000').replace(/\/$/, '');
    // uploads/ đặt cạnh dist/ khi chạy, tức là cạnh server/.
    this.uploadsDir = join(process.cwd(), 'uploads');
    const cloudName = config.get<string>('CLOUDINARY_CLOUD_NAME');
    this.useCloudinary = !!cloudName;
    if (cloudName) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: config.get<string>('CLOUDINARY_API_KEY'),
        api_secret: config.get<string>('CLOUDINARY_API_SECRET'),
        secure: true,
      });
    }
  }

  // Upload một ảnh, trả về url + publicId.
  // Lưu đĩa: ghi vào uploads/<folder>/<randomUUID>.<ext>, publicId = tên file (không kèm folder) để sau này xoá dễ.
  // Cloudinary: publicId do Cloudinary đặt, dạng travellog/<folder>/<id>.
  // Đuôi file lấy từ mimetype, KHÔNG lấy từ originalname — tránh lưu file .html/.js
  // mà trình duyệt chạy như trang web (lỗi bảo mật A review ở PR #15).
  async upload(file: Express.Multer.File, folder: string): Promise<UploadedFile> {
    const ext = this.extFromMime(file.mimetype);
    if (!ext) {
      throw new BadRequestException({
        code: 'INVALID_FILE_TYPE',
        message: 'Chỉ nhận ảnh JPG, PNG, WEBP',
      });
    }
    if (this.useCloudinary) return this.uploadToCloudinary(file, folder);
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
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        this.logger.warn(`Không xoá được ${publicId} trên Cloudinary: ${(err as Error).message}`);
      }
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

  // Gửi buffer lên Cloudinary qua stream (multer giữ file trong bộ nhớ, không ghi ra đĩa).
  private uploadToCloudinary(file: Express.Multer.File, folder: string): Promise<UploadedFile> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: `travellog/${folder}`, resource_type: 'image' }, (err, result) => {
          if (err || !result) return reject(err ?? new Error('Cloudinary không trả kết quả'));
          resolve({ url: result.secure_url, publicId: result.public_id, width: result.width, height: result.height });
        })
        .end(file.buffer);
    });
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
