// Test StorageService: upload, uploadMany (rollback khi lỗi), remove, bỏ qua "demo/".
// Chạy bằng: npm test
import { promises as fs } from 'fs';
import { join } from 'path';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

function makeStorage() {
  const config = new ConfigService({
    PUBLIC_URL: 'http://localhost:3000',
    CLOUDINARY_CLOUD_NAME: '',
  });
  return new StorageService(config);
}

const fakeFile = (name = 'test.jpg'): Express.Multer.File => ({
  fieldname: 'images',
  originalname: name,
  encoding: '7bit',
  mimetype: 'image/jpeg',
  buffer: Buffer.from('fake-jpeg-content'),
  size: 17,
  destination: '',
  filename: '',
  path: '',
  stream: null as never,
});

test('upload: ghi file vào uploads/<folder>/<uuid>.<ext>, trả url và publicId', async () => {
  const storage = makeStorage();
  const result = await storage.upload(fakeFile(), 'test');
  assert.match(result.url, /^http:\/\/localhost:3000\/uploads\/test\/[a-f0-9-]+\.jpg$/);
  assert.match(result.publicId, /^[a-f0-9-]+\.jpg$/);
  const stat = await fs.stat(join(process.cwd(), 'uploads', 'test', result.publicId));
  assert.equal(stat.size, 17);
  await storage.remove(result.publicId);
});

test('uploadMany: trả mảng đúng số file', async () => {
  const storage = makeStorage();
  const many = await storage.uploadMany([fakeFile(), fakeFile(), fakeFile()], 'test');
  assert.equal(many.length, 3);
  await storage.removeMany(many.map((m) => m.publicId));
});

test('remove: bỏ qua publicId bắt đầu bằng "demo/"', async () => {
  const storage = makeStorage();
  await storage.remove('demo/abc.jpg'); // không ném lỗi
});

test('remove: xoá file thật trong uploads/<folder>/', async () => {
  const storage = makeStorage();
  const result = await storage.upload(fakeFile(), 'test');
  await storage.remove(result.publicId);
  await assert.rejects(() => fs.stat(join(process.cwd(), 'uploads', 'test', result.publicId)));
});

test('upload: đuôi file lấy từ mimetype, không lấy từ originalname (chống XSS)', async () => {
  const storage = makeStorage();
  // originalname là .html nhưng mimetype khai image/png → phải lưu thành .png.
  const file: Express.Multer.File = { ...fakeFile('x.html'), mimetype: 'image/png' };
  const result = await storage.upload(file, 'test');
  assert.match(result.publicId, /\.png$/);
  await storage.remove(result.publicId);
});

test('upload: mimetype không phải ảnh thì ném BadRequestException', async () => {
  const storage = makeStorage();
  const bad: Express.Multer.File = { ...fakeFile(), mimetype: 'text/html' };
  await assert.rejects(
    () => storage.upload(bad, 'test'),
    (err: Error & { response?: { code?: string } }) => err.response?.code === 'INVALID_FILE_TYPE',
  );
});
