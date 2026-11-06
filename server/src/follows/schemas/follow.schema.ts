import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';

@Schema({ timestamps: true, versionKey: false })
export class Follow {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true }) follower: Types.ObjectId;
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true }) following: Types.ObjectId;
  createdAt: Date;
}

export const FollowSchema = SchemaFactory.createForClass(Follow);
// BR04: không theo dõi hai lần.
FollowSchema.index({ follower: 1, following: 1 }, { unique: true });
FollowSchema.index({ following: 1, createdAt: -1 });
