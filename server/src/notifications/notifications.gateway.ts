import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtPayload, loadSessionUser } from '../auth/jwt.strategy';
import { User } from '../users/schemas/user.schema';

const room = (userId: string) => `user:${userId}`;

// N03: đẩy thông báo mới tới người nhận ngay khi tạo. CORS cấu hình ở SocketIoAdapter (main.ts).
@WebSocketGateway()
export class NotificationsGateway implements OnGatewayConnection {
  private readonly logger = new Logger(NotificationsGateway.name);
  @WebSocketServer() private readonly server!: Server;

  constructor(
    private readonly jwt: JwtService,
    @InjectModel(User.name) private readonly users: Model<User>,
  ) {}

  // Kiểm token giống REST (khoá, đổi mật khẩu, role từ DB); chỉ thành viên nhận thông báo.
  async handleConnection(socket: Socket) {
    try {
      const token = socket.handshake.auth?.token;
      if (typeof token !== 'string') throw new Error('Thiếu token');
      const user = await loadSessionUser(this.users, await this.jwt.verifyAsync<JwtPayload>(token));
      if (user.role !== 'member') throw new Error('Không phải thành viên');
      await socket.join(room(user.id));
    } catch (err) {
      this.logger.debug(`Từ chối socket: ${(err as Error).message}`);
      socket.disconnect(true);
    }
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server.to(room(userId)).emit(event, payload);
  }

  // Khoá tài khoản hoặc admin đặt mật khẩu tạm: cắt kết nối, client tự kiểm lại phiên.
  disconnectUser(userId: string) {
    this.server.in(room(userId)).disconnectSockets(true);
  }
}
