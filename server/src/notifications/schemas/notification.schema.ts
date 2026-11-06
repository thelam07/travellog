import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';

export type NotificationType = 'like' | 'comment' | 'follow';

@Schema({ timestamps: true, versionKey: false })
export class Notification {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true }) recipient: Types.ObjectId;
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true }) actor: Types.ObjectId;
  @Prop({ type: String, enum: ['like', 'comment', 'follow'], required: true }) type: NotificationType;
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Post', default: null }) post: Types.ObjectId | null;
  @Prop({ type: Boolean, default: false }) isRead: boolean;
  createdAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, actor: 1, type: 1, post: 1 });
