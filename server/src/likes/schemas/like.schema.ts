import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type LikeDocument = HydratedDocument<Like>;

@Schema({ timestamps: true })
export class Like {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Post', required: true })
  post: Types.ObjectId;
}

export const LikeSchema = SchemaFactory.createForClass(Like);

// BR02: Mỗi người chỉ thích một bài một lần
LikeSchema.index({ user: 1, post: 1 }, { unique: true });
LikeSchema.index({ post: 1 });