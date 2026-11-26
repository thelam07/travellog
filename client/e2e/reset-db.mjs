// Xoá database e2e trước mỗi lần chạy Playwright. Chạy với cwd = server/ (dùng mongoose của server).
import { createRequire } from 'node:module';

const require = createRequire(`${process.cwd()}/package.json`);
const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI;
if (!uri || !uri.endsWith('_e2e')) {
  console.error('reset-db: MONGODB_URI phải trỏ tới database *_e2e, dừng lại để không xoá nhầm.');
  process.exit(1);
}
await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
await mongoose.connection.dropDatabase();
await mongoose.disconnect();
console.log('reset-db: đã xoá', uri);
