import {
  Body,
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../common/decorators';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators';
import { AuthUser } from '../common/auth-user';
import { CreatePostDto } from './dto/post.dto';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly posts: PostsService) {}

  // Đăng bài có ảnh (BR05). Admin không đăng bài (BR20).
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('member')
  @UseInterceptors(FilesInterceptor('images', 6, { limits: { fileSize: 5 * 1024 * 1024, files: 6 } }))
  async create(
    @Body() dto: CreatePostDto,
    @UploadedFiles(
      new ParseFilePipe({
        fileIsRequired: false,
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
    return this.posts.toClient(post);
  }
}
