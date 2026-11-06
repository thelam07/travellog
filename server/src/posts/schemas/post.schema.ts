import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { extractHashtags, normalizeKey } from '../../common/utils/text';

// Mỗi ảnh có _id riêng để sửa bài giữ/bỏ từng ảnh (BR15).
@Schema({ _id: true })
export class PostImage {
  @Prop({ type: String, required: true }) url: string;
  @Prop({ type: String, required: true }) publicId: string;
  @Prop({ type: Number }) width?: number;
  @Prop({ type: Number }) height?: number;
}
export const PostImageSchema = SchemaFactory.createForClass(PostImage);

@Schema({ _id: false })
export class PostLocation {
  @Prop({ type: String, required: true, trim: true, maxlength: 200 }) name: string;
  // BR16: nameKey = chữ thường, bỏ dấu, gộp khoảng trắng; hook pre('save') tự sinh.
  @Prop({ type: String, required: true, index: true }) nameKey: string;
  @Prop({ type: String, default: null, index: true }) placeId?: string | null;
  @Prop({ type: String, default: null }) address?: string | null;
  @Prop({ type: Number, default: null, min: -90, max: 90 }) lat?: number | null;
  @Prop({ type: Number, default: null, min: -180, max: 180 }) lng?: number | null;
}
export const PostLocationSchema = SchemaFactory.createForClass(PostLocation);

@Schema({ timestamps: true, versionKey: false })
export class Post {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true }) author: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true, minlength: 5, maxlength: 120 }) title: string;

  @Prop({ type: String, required: true, maxlength: 5000 }) content: string;

  @Prop({ type: [PostImageSchema], default: [] }) images: PostImage[];

  @Prop({ type: PostLocationSchema, required: true }) location: PostLocation;

  // BR09: bật khi admin khoá tác giả; bộ lọc quyền xem loại trừ.
  @Prop({ type: Boolean, default: false }) authorLocked: boolean;

  // BR13: tách từ content, chữ thường; hook pre('save') tự tính.
  @Prop({ type: [String], default: [] }) hashtags: string[];

  @Prop({ type: Date, required: true }) tripDate: Date;

  @Prop({ type: Number, required: true, default: 0, min: 0 }) cost: number;

  @Prop({ type: String, enum: ['public', 'followers'], required: true, default: 'public' }) visibility: 'public' | 'followers';

  // BR10: admin ẩn bài.
  @Prop({ type: String, enum: ['active', 'hidden'], required: true, default: 'active' }) status: 'active' | 'hidden';

  @Prop({ type: Number, default: 0, min: 0 }) likeCount: number;
  @Prop({ type: Number, default: 0, min: 0 }) commentCount: number;

  createdAt: Date;
  updatedAt: Date;
}

export type PostDocument = Post & { _id: Types.ObjectId };
export const PostSchema = SchemaFactory.createForClass(Post);

// Index theo mục 5.1.
// Bảng tin (cursor) và trang cá nhân: sort theo createdAt desc, _id desc trong từng tác giả.
PostSchema.index({ author: 1, createdAt: -1, _id: -1 });
// Hashtag.
PostSchema.index({ hashtags: 1 });
// Tìm kiếm / thống kê theo địa điểm.
PostSchema.index({ 'location.nameKey': 1 });
PostSchema.index({ 'location.placeId': 1 });
// Danh sách chung, tìm kiếm.
PostSchema.index({ createdAt: -1, _id: -1 });

// BR13: tách hashtag từ content. BR16: nameKey = normalizeKey(location.name).
// Mongoose 9: hook không dùng tham số next, dùng hàm async.
PostSchema.pre('save', async function () {
  const post = this as unknown as PostDocument;
  if (post.isModified('content')) {
    post.hashtags = extractHashtags(post.content);
  }
  if (post.isModified('location') && post.location?.name) {
    post.location.nameKey = normalizeKey(post.location.name);
  }
});
