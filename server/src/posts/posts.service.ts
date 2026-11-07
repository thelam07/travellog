import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthUser } from '../common/auth-user';
import { StorageService } from '../common/storage/storage.service';
import { toUserSummary } from '../users/user.mapper';
import { CreatePostDto } from './dto/post.dto';
import { Post, PostDocument } from './schemas/post.schema';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
    private readonly storage: StorageService,
  ) {}

  // Tạo bài viết mới: upload ảnh trước, nếu lưu DB lỗi thì xoá ảnh vừa upload.
  async create(dto: CreatePostDto, files: Express.Multer.File[], user: AuthUser): Promise<PostDocument> {
    const uploaded = files?.length ? await this.storage.uploadMany(files, 'posts') : [];

    try {
      const post = new this.postModel({
        author: user.id,
        title: dto.title,
        content: dto.content,
        location: {
          name: dto.location.name,
          placeId: dto.location.placeId ?? null,
          address: dto.location.address ?? null,
          lat: dto.location.lat ?? null,
          lng: dto.location.lng ?? null,
        },
        tripDate: dto.tripDate,
        cost: dto.cost ?? 0,
        visibility: dto.visibility,
        images: uploaded.map((u) => ({ url: u.url, publicId: u.publicId })),
      });
      return await post.save();
    } catch (err) {
      // Lưu lỗi: dọn ảnh đã upload rồi ném tiếp.
      await this.storage.removeMany(uploaded.map((u) => u.publicId));
      throw err;
    }
  }

  // Serialize một bài viết theo api-contract: author là UserSummary, likedByMe = false.
  // likedByMe sẽ tính đúng ở B6 khi có bảng likes.
  async toClient(post: PostDocument) {
    const author = await this.postModel.populate(post, { path: 'author', select: 'username displayName avatar' });
    return {
      _id: String(post._id),
      author: toUserSummary(author.author as never),
      title: post.title,
      content: post.content,
      images: post.images,
      location: post.location,
      hashtags: post.hashtags,
      tripDate: post.tripDate,
      cost: post.cost,
      visibility: post.visibility,
      status: post.status,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      likedByMe: false,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }
}
