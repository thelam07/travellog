import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from '../../common/auth-user';

@Schema({ _id: false })
export class Avatar {
  @Prop({ type: String, required: true }) url: string;
  @Prop({ type: String, required: true }) publicId: string;
}

@Schema({ timestamps: true, versionKey: false })
export class User {
  @Prop({ type: String, required: true, unique: true, trim: true, lowercase: true, minlength: 3, maxlength: 30, match: /^[a-z0-9_]+$/ })
  username: string;

  @Prop({ type: String, required: true, unique: true, trim: true, lowercase: true })
  email: string;

  @Prop({ type: String, required: true, select: false })
  passwordHash: string;

  @Prop({ type: String, default: '', trim: true, maxlength: 50 })
  displayName: string;

  @Prop({ type: String, default: '', maxlength: 200 })
  bio: string;

  @Prop({ type: Avatar, default: null })
  avatar: Avatar | null;

  @Prop({ type: String, enum: ['member', 'admin'], default: 'member' })
  role: Role;

  @Prop({ type: Boolean, default: false })
  isLocked: boolean;

  // BR11: token phát hành trước mốc này bị từ chối.
  @Prop({ type: Date, default: null })
  passwordChangedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);

export const USER_SUMMARY_FIELDS = 'username displayName avatar';
