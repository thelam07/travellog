import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthUser } from '../common/auth-user';
import { CurrentUser, Roles } from '../common/decorators';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AccessiblePost } from '../posts/decorators/accessible-post.decorator';
import { PostAccessGuard } from '../posts/guards/post-access.guard';
import { PostDocument } from '../posts/schemas/post.schema';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/comment.dto';

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('posts/:id/comments')
  @UseGuards(OptionalJwtAuthGuard, PostAccessGuard)
  getComments(
    @AccessiblePost() post: PostDocument,
    @Query('cursor') cursor?: string,
    @CurrentUser() viewer?: AuthUser,
  ) {
    return this.commentsService.getComments(post, cursor, viewer);
  }

  @Post('posts/:id/comments')
  @UseGuards(JwtAuthGuard, RolesGuard, PostAccessGuard)
  @Roles('member')
  createComment(
    @AccessiblePost() post: PostDocument,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.createComment(post, user, dto);
  }

  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard)
  deleteComment(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.commentsService.deleteComment(id, user);
  }
}
