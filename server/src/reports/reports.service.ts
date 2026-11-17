import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { AuthUser } from '../common/auth-user';
import { PostsService } from '../posts/posts.service';
import { toUserSummary } from '../users/user.mapper';
import { CreateReportDto, HandleReportDto } from './dto/report.dto';
import { Report, ReportDocument } from './schemas/report.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name) private readonly reportModel: Model<ReportDocument>,
    private readonly postsService: PostsService,
  ) {}

  private mapReport(report: ReportDocument) {
    const p = report.post as any;
    const postObj = p && p._id ? {
      _id: String(p._id),
      title: p.title,
      status: p.status,
      author: toUserSummary(p.author),
    } : null;

    return {
      _id: String(report._id),
      post: postObj,
      reporter: toUserSummary(report.reporter as any),
      reason: report.reason,
      note: report.note ?? '',
      status: report.status,
      handledBy: toUserSummary(report.handledBy as any),
      createdAt: (report as any).createdAt?.toISOString?.() ?? (report as any).createdAt,
    };
  }

  async createReport(dto: CreateReportDto, user: AuthUser) {
    if (!isValidObjectId(dto.postId)) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Không tìm thấy bài viết',
      });
    }

    const post = await this.postsService.findOneForViewer(dto.postId, user);
    if (!post) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Không tìm thấy bài viết',
      });
    }

    const reporterId = new Types.ObjectId(user.id);
    const existing = await this.reportModel.findOne({
      post: post._id,
      reporter: reporterId,
    });
    if (existing) {
      throw new ConflictException({
        code: 'ALREADY_REPORTED',
        message: 'Bạn đã báo cáo bài này',
      });
    }

    const report = new this.reportModel({
      post: post._id,
      reporter: reporterId,
      reason: dto.reason,
      note: dto.note ?? '',
      status: 'pending',
      handledBy: null,
    });

    try {
      await report.save();
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new ConflictException({
          code: 'ALREADY_REPORTED',
          message: 'Bạn đã báo cáo bài này',
        });
      }
      throw err;
    }

    await report.populate([
      {
        path: 'post',
        select: '_id title status author',
        populate: { path: 'author', select: '_id username displayName avatar role' },
      },
      {
        path: 'reporter',
        select: '_id username displayName avatar role',
      },
      {
        path: 'handledBy',
        select: '_id username displayName avatar role',
      },
    ]);

    return this.mapReport(report);
  }

  async listReports(status?: string, page = 1, limit = 20) {
    const filter: Record<string, unknown> = {};
    if (status && ['pending', 'resolved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    const safePage = Math.max(1, page);
    const skip = (safePage - 1) * limit;
    const total = await this.reportModel.countDocuments(filter);

    const docs = await this.reportModel
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate([
        {
          path: 'post',
          select: '_id title status author',
          populate: { path: 'author', select: '_id username displayName avatar role' },
        },
        {
          path: 'reporter',
          select: '_id username displayName avatar role',
        },
        {
          path: 'handledBy',
          select: '_id username displayName avatar role',
        },
      ])
      .exec();

    const items = docs.map((doc) => this.mapReport(doc));

    return {
      items,
      page: safePage,
      limit,
      total,
    };
  }

  async handleReport(id: string, dto: HandleReportDto, admin: AuthUser) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Không tìm thấy báo cáo',
      });
    }

    const report = await this.reportModel.findById(id);
    if (!report) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Không tìm thấy báo cáo',
      });
    }

    const adminId = new Types.ObjectId(admin.id);
    const updateRes = await this.reportModel.updateMany(
      {
        $or: [
          { _id: report._id },
          { post: report.post, status: 'pending' },
        ],
      },
      {
        $set: {
          status: dto.status,
          handledBy: adminId,
        },
      },
    );

    if (dto.status === 'resolved' && dto.hidePost) {
      await this.postsService.setPostHidden(String(report.post));
    }

    return {
      updated: updateRes.modifiedCount,
    };
  }

  async updatePostStatus(id: string, status: 'active' | 'hidden', admin: AuthUser) {
    return this.postsService.updateStatus(id, status, admin);
  }
}
