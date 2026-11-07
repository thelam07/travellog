// server/src/reports/schemas/report.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type ReportDocument = HydratedDocument<Report>;

@Schema({ timestamps: true })
export class Report {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Post', required: true })
  post: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  reporter: Types.ObjectId;

  @Prop({ required: true, enum: ['spam', 'offensive', 'false_info', 'other'] })
  reason: string;

  @Prop({ maxlength: 500, default: '' })
  note: string;

  @Prop({
    required: true,
    enum: ['pending', 'resolved', 'rejected'],
    default: 'pending',
  })
  status: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', default: null })
  handledBy: Types.ObjectId | null;
}

export const ReportSchema = SchemaFactory.createForClass(Report);

// BR14: Mỗi người báo cáo một bài một lần
ReportSchema.index({ post: 1, reporter: 1 }, { unique: true });
// Index cho màn hình admin
ReportSchema.index({ status: 1, createdAt: -1 });