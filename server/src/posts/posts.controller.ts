import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { SetMetadata } from '@nestjs/common';
import { CurrentUser, Roles } from '../common/decorators';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ALLOW_ADMIN_KEY, OwnershipGuard } from '../common/guards/ownership.guard';
import { AuthUser } from '../common/auth-user';
import { AccessiblePost } from './decorators/accessible-post.decorator';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
import { PostAccessGuard } from './guards/post-access.guard';
import { PostDocument } from './schemas/post.schema';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly posts: PostsService) {}

  // Đăng bài có ảnh (BR05). Admin không đăng bài (BR20).
  // FilesInterceptor đặt 7 để multer không ném "Too many files" tiếng Anh; service sẽ kiểm
  // tra files.length > 6 và trả TOO_MANY_IMAGES bằng tiếng Việt.
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('member')
  @UseInterceptors(FilesInterceptor('images', 7, { limits: { fileSize: 5 * 1024 * 1024, files: 7 } }))
  async create(
    @Body() dto: CreatePostDto,
    @UploadedFiles(
      new ParseFilePipe({
        fileIsRequired: false,
        exceptionFactory: () =>
          new BadRequestException({
            code: 'INVALID_FILE_TYPE',
            message: 'Chỉ nhận ảnh JPG, PNG, WEBP, tối đa 5 MB',
          }),
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      }),
    )
    files: Express.Multer.File[],
    @CurrentUser() user: AuthUser,
  ) {
    const post = await this.posts.create(dto, files, user);
    return this.posts.toClient(post, user);
  }

  // Xem chi tiết bài (F02). Khách cũng xem được bài public; bài followers / hidden / authorLocked → 404.
  // PostAccessGuard đã kiểm tra quyền xem và gắn bài vào req.post.
  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard, PostAccessGuard)
  async findOne(@AccessiblePost() post: PostDocument, @CurrentUser() user?: AuthUser) {
    return this.posts.toClient(post, user);
  }

  // BR06 + BR15: sửa bài. OwnershipGuard chặn người không phải chủ (admin không sửa bài người khác — BR20).
  // Multipart như POST: mọi trường tuỳ chọn + keepImageIds + images[] mới.
  @Patch(':id')
  @UseGuards(JwtAuthGuard, OwnershipGuard)
  @UseInterceptors(FilesInterceptor('images', 7, { limits: { fileSize: 5 * 1024 * 1024, files: 7 } }))
  async update(
    @AccessiblePost() post: PostDocument,
    @Body() dto: UpdatePostDto,
    @UploadedFiles(
      new ParseFilePipe({
        fileIsRequired: false,
        exceptionFactory: () =>
          new BadRequestException({
            code: 'INVALID_FILE_TYPE',
            message: 'Chỉ nhận ảnh JPG, PNG, WEBP, tối đa 5 MB',
          }),
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      }),
    )
    files: Express.Multer.File[],
    @CurrentUser() user: AuthUser,
  ) {
    const updated = await this.posts.update(post, dto, files);
    return this.posts.toClient(updated, user);
  }

  // BR06 + BR07: xoá bài. OwnershipGuard cho phép admin qua (BR06: admin xoá được bài người khác).
  @Delete(':id')
  @UseGuards(JwtAuthGuard, OwnershipGuard)
  @SetMetadata(ALLOW_ADMIN_KEY, true)
  async remove(@AccessiblePost() post: PostDocument) {
    await this.posts.remove(post);
    return { deleted: true };
  }
}
