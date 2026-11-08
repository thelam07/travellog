import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';

// @Global để mọi module khác inject StorageService mà không cần imports vào PostsModule.
@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
