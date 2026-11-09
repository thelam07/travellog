import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from '../../common/auth-user';
import { normalizeKey } from '../../common/utils/text';

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

  // Tìm người dùng không phân biệt dấu (mở rộng ngoài thiết kế): normalizeKey("tên hiển thị username"), tự tính bằng hook bên dưới.
  @Prop({ type: String, default: '', select: false })
  searchKey: string;

  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);

export const userSearchKey = (displayName: string, username: string) => normalizeKey(`${displayName} ${username}`);

UserSchema.index({ searchKey: 1 });

UserSchema.pre('save', function () {
  if (this.isModified('displayName') || this.isModified('username')) {
    this.searchKey = userSearchKey(this.displayName, this.username);
  }
});

// Sửa hồ sơ, seed… dùng updateOne / findByIdAndUpdate nên không qua hook save: tính lại khi update có displayName.
UserSchema.pre(['updateOne', 'findOneAndUpdate'], async function () {
  const update = this.getUpdate() as Record<string, any> | null;
  const displayName = update?.displayName ?? update?.$set?.displayName;
  if (displayName === undefined) return;
  const doc = await this.model.findOne(this.getQuery()).select('username').lean<{ username: string }>();
  if (doc) this.set('searchKey', userSearchKey(displayName, doc.username));
});

export const USER_SUMMARY_FIELDS = 'username displayName avatar';
