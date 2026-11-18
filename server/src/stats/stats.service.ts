import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from '../posts/schemas/post.schema';

export interface LocationStatItem {
  _id: string;
  name: string;
  count: number;
  likes: number;
}

@Injectable()
export class StatsService {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
  ) {}

  async getLocationStats(limit?: number): Promise<LocationStatItem[]> {
    const take = Math.min(Math.max(Number(limit) || 10, 1), 50);

    return this.postModel.aggregate<LocationStatItem>([
      {
        $match: {
          status: 'active',
          authorLocked: false,
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $group: {
          _id: { $ifNull: ['$location.placeId', '$location.nameKey'] },
          name: { $first: '$location.name' },
          count: { $sum: 1 },
          likes: { $sum: '$likeCount' },
        },
      },
      {
        $sort: {
          count: -1,
          likes: -1,
        },
      },
      {
        $limit: take,
      },
    ]);
  }
}
