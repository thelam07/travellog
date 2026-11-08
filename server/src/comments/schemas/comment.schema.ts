// server/src/comments/schemas/comment.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type CommentDocument = HydratedDocument<Comment>;

@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Post', required: true })
  post: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Comment', default: null })
  parent: Types.ObjectId | null;

  @Prop({ required: true, maxlength: 1000, trim: true })
  content: string;

  @Prop({ type: Boolean, default: false })
  authorLocked: boolean;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

// Index phục vụ lấy bình luận gốc và phân trang
CommentSchema.index({ post: 1, parent: 1, createdAt: 1 });