import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuthUser } from '../common/auth-user';
import { clampLimit, CURSOR_SORT, cursorFilter, toCursorPage } from '../common/utils/cursor';
import { FollowsService } from '../follows/follows.service';
import { Like } from '../likes/schemas/like.schema';
import { Comment } from '../comments/schemas/comment.schema';
import { Notification } from '../notifications/schemas/notification.schema';
import { Report } from '../reports/schemas/report.schema';
import { StorageService } from '../common/storage/storage.service';
import { toUserSummary } from '../users/user.mapper';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
import { Post, PostDocument, PostImage } from './schemas/post.schema';

const MAX_IMAGES = 6;

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
    @InjectModel(Like.name) private readonly likeModel: Model<Like>,
    @InjectModel(Comment.name) private readonly commentModel: Model<Comment>,
    @InjectModel(Notification.name) private readonly notificationModel: Model<Notification>,
    @InjectModel(Report.name) private readonly reportModel: Model<Report>,
    private readonly storage: StorageService,
    private readonly follows: FollowsService,
  ) {}

  // Tạo bài viết mới: upload ảnh trước, nếu lưu DB lỗi thì xoá ảnh vừa upload.
  async create(dto: CreatePostDto, files: Express.Multer.File[], user: AuthUser): Promise<PostDocument> {
    if (files?.length > MAX_IMAGES) {
      throw new BadRequestException({
        code: 'TOO_MANY_IMAGES',
        message: 'Mỗi bài tối đa 6 ảnh',
      });
    }
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

  // BR01/BR09/BR10: bộ lọc quyền xem dùng chung cho mọi API trả bài (bảng tin, tìm kiếm, trang cá nhân, bản đồ).
  // - admin: thấy hết ({}).
  // - khách: chỉ bài public, đang active, tác giả không bị khoá.
  // - thành viên: bài của chính mình HOẶC (active VÀ (public HOẶC thuộc người mình theo dõi)); tác giả không bị khoá.
  async visibilityFilter(viewer?: AuthUser): Promise<Record<string, unknown>> {
    if (viewer?.role === 'admin') return {};
    if (!viewer) {
      return { status: 'active', authorLocked: false, visibility: 'public' };
    }
    const followingIds = await this.follows.followingIds(viewer.id);
    return {
      authorLocked: false,
      $or: [
        { author: new Types.ObjectId(viewer.id) },
        {
          status: 'active',
          $or: [{ visibility: 'public' }, { author: { $in: followingIds } }],
        },
      ],
    };
  }

  // Tải một bài theo id, đồng thời áp luật quyền xem. Trả null nếu không tồn tại hoặc không có quyền.
  // Dùng cho PostAccessGuard và mọi chỗ cần xem chi tiết / thích / bình luận / báo cáo.
  // Tận dụng lại visibilityFilter để không chép điều kiện ở hai nơi.
  async findOneForViewer(id: string, viewer?: AuthUser): Promise<PostDocument | null> {
    if (viewer?.role === 'admin') {
      return this.postModel.findById(id).exec();
    }
    const filter = await this.visibilityFilter(viewer);
    return this.postModel.findOne({ _id: id, ...filter }).exec();
  }

  // Tải bài theo id KHÔNG qua visibilityFilter — dùng cho OwnershipGuard cần biết author
  // kể cả khi bài hidden / authorLocked.
  async findByIdRaw(id: string): Promise<PostDocument | null> {
    return this.postModel.findById(id).exec();
  }

  // BR06 + BR15: sửa bài. OwnershipGuard đã chặn quyền trước khi vào đây.
  // - keepImageIds: chuỗi JSON mảng _id ảnh cũ muốn giữ; không gửi = giữ tất cả.
  // - Ảnh mới qua files. Tổng ảnh giữ + ảnh mới > 6 → 400.
  // - Cập nhật bằng post.save() để hook pre('validate') tính lại hashtags và nameKey.
  // - Ảnh bị bỏ chỉ xoá khỏi kho SAU khi lưu thành công; lưu lỗi thì xoá ảnh mới vừa upload.
  async update(
    post: PostDocument,
    dto: UpdatePostDto,
    files: Express.Multer.File[],
  ): Promise<PostDocument> {
    // 1. Tính danh sách ảnh giữ lại.
    const keepIds = this.parseKeepImageIds(dto.keepImageIds, post.images);
    const keptImages = keepIds === null
      ? [...post.images]
      : post.images.filter((img) => img._id && keepIds.has(String(img._id)));
    const removedImages = keepIds === null
      ? []
      : post.images.filter((img) => !img._id || !keepIds.has(String(img._id)));

    // 2. Upload ảnh mới (nếu có).
    const newFiles = files ?? [];
    if (keptImages.length + newFiles.length > MAX_IMAGES) {
      throw new BadRequestException({
        code: 'TOO_MANY_IMAGES',
        message: `Mỗi bài tối đa ${MAX_IMAGES} ảnh (đang giữ ${keptImages.length}, thêm ${newFiles.length})`,
      });
    }
    const uploaded = newFiles.length ? await this.storage.uploadMany(newFiles, 'posts') : [];

    // 3. Cập nhật các trường nếu có.
    if (dto.title !== undefined) post.title = dto.title;
    if (dto.content !== undefined) post.content = dto.content;
    if (dto.tripDate !== undefined) post.tripDate = dto.tripDate;
    if (dto.cost !== undefined) post.cost = dto.cost;
    if (dto.visibility !== undefined) post.visibility = dto.visibility;
    if (dto.location !== undefined) {
      post.location = {
        name: dto.location.name,
        placeId: dto.location.placeId ?? null,
        address: dto.location.address ?? null,
        lat: dto.location.lat ?? null,
        lng: dto.location.lng ?? null,
        // nameKey sẽ được hook pre('validate') tự tính lại.
        nameKey: post.location.nameKey,
      };
    }

    // 4. Gộp ảnh: giữ cũ + mới.
    const finalImages: PostImage[] = [
      ...keptImages,
      ...uploaded.map((u) => ({ url: u.url, publicId: u.publicId } as PostImage)),
    ];
    post.images = finalImages;

    // 5. Lưu (hook pre('validate') tính lại hashtags + nameKey).
    try {
      await post.save();
    } catch (err) {
      // Lưu lỗi: dọn ảnh mới vừa upload rồi ném tiếp.
      await this.storage.removeMany(uploaded.map((u) => u.publicId));
      throw err;
    }

    // 6. Lưu thành công: xoá ảnh cũ bị bỏ khỏi kho.
    if (removedImages.length) {
      await this.storage.removeMany(removedImages.map((img) => img.publicId));
    }

    return post;
  }

  // BR06 + BR07: xoá bài. OwnershipGuard đã chặn quyền trước khi vào đây.
  // Xoá bài + likes + comments + notifications + reports có post = bài này, rồi xoá ảnh trong kho.
  async remove(post: PostDocument): Promise<void> {
    const postId = post._id;
    await Promise.all([
      this.likeModel.deleteMany({ post: postId }).exec(),
      this.commentModel.deleteMany({ post: postId }).exec(),
      this.notificationModel.deleteMany({ post: postId }).exec(),
      this.reportModel.deleteMany({ post: postId }).exec(),
    ]);
    await post.deleteOne();
    // Xoá ảnh sau cùng (nếu lỗi thì ảnh mồ côi, không ảnh hưởng DB).
    if (post.images.length) {
      await this.storage.removeMany(post.images.map((img) => img.publicId));
    }
  }

  // Serialize một bài viết theo api-contract: author là UserSummary, likedByMe tính theo bảng likes.
  async toClient(post: PostDocument, viewer?: AuthUser) {
    const author = await this.postModel.populate(post, { path: 'author', select: 'username displayName avatar' });
    const likedByMe = viewer ? !!(await this.likeModel.exists({ post: post._id, user: viewer.id })) : false;
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
      likedByMe,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  async getFeed(viewer: AuthUser, cursor?: string, rawLimit?: unknown) {
    const limit = clampLimit(rawLimit, 10, 20);
    const followingIds = await this.follows.followingIds(viewer.id);
    const authors = [...followingIds, new Types.ObjectId(viewer.id)];
    const visFilter = await this.visibilityFilter(viewer);
    const curFilter = cursorFilter(cursor);

    const andConditions: Record<string, unknown>[] = [
      { author: { $in: authors } },
      visFilter,
    ];
    if (Object.keys(curFilter).length > 0) {
      andConditions.push(curFilter);
    }

    const docs = await this.postModel
      .find({ $and: andConditions })
      .sort(CURSOR_SORT)
      .limit(limit + 1)
      .exec();

    const page = toCursorPage(docs, limit);
    const items = await Promise.all(page.items.map((post) => this.toClient(post, viewer)));
    return {
      items,
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
    };
  }

  // Parse chuỗi JSON keepImageIds thành Set<string>. Trả null nếu không gửi (nghĩa là giữ tất cả).
  // Ném 400 nếu chuỗi không phải JSON hợp lệ hoặc chứa _id không thuộc bài.
  private parseKeepImageIds(raw: string | undefined, currentImages: PostImage[]): Set<string> | null {
    if (raw === undefined || raw === null || raw === '') return null; // giữ tất cả
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new BadRequestException({
        code: 'INVALID_KEEP_IMAGE_IDS',
        message: 'keepImageIds phải là chuỗi JSON mảng _id ảnh',
      });
    }
    if (!Array.isArray(parsed)) {
      throw new BadRequestException({
        code: 'INVALID_KEEP_IMAGE_IDS',
        message: 'keepImageIds phải là mảng _id ảnh',
      });
    }
    const validIds = new Set(currentImages.map((img) => img._id && String(img._id)));
    const keep = new Set<string>();
    for (const id of parsed) {
      if (typeof id !== 'string' || !validIds.has(id)) {
        throw new BadRequestException({
          code: 'INVALID_KEEP_IMAGE_IDS',
          message: 'keepImageIds chứa _id không thuộc bài viết',
        });
      }
      keep.add(id);
    }
    return keep;
  }
}
