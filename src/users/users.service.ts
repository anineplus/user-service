import {
  Injectable,
  BadRequestException,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { LoginUserInput } from './inputs';
import { RegisterUserInput } from './inputs';
import { CheckUserExistDto, LoginResponse } from './dtos';
import { hashPassword, verifyPassword } from 'src/common/functions';
import { ERROR_MESSAGES, ROLE_USER } from 'src/common/constants';
import { createGraphQLError } from '@bune/common';
import { randomUUIDv7 } from 'bun';
import { RedisService } from 'src/redis/redis.service';
import { UserStatusEnum } from 'prisma/@generated';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  async register(input: RegisterUserInput): Promise<User> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existingUser) {
      throw createGraphQLError(
        HttpStatus.BAD_REQUEST,
        ERROR_MESSAGES.USER.EMAIL_EXISTS.MESSAGE,
        ERROR_MESSAGES.USER.EMAIL_EXISTS.CODE,
      );
    }

    const hashedPassword = await hashPassword(input.password);
    const role = await this.prisma.role.findUnique({
      where: {
        key: ROLE_USER,
      },
    });
    if (!role) {
      throw createGraphQLError(
        HttpStatus.BAD_REQUEST,
        ERROR_MESSAGES.ROLE.NOT_FOUND.CODE,
        ERROR_MESSAGES.ROLE.NOT_FOUND.MESSAGE,
      );
    }
    const username = input.email.split('@')[0];
    return this.prisma.user.create({
      data: {
        email: input.email,
        username: username,
        name: username,
        password: hashedPassword,
        status: UserStatusEnum.INACTIVE,
        roles: {
          connect: {
            id: role.id,
          },
        },
      },
    });
  }

  async login(input: LoginUserInput): Promise<LoginResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      include: { roles: { select: { key: true } } },
    });

    if (!user || !(await verifyPassword(input.password, user.password))) {
      throw createGraphQLError(
        HttpStatus.BAD_REQUEST,
        ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS.MESSAGE,
        ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS.CODE,
      );
    }

    const token = this.jwtService.sign(
      { userId: user.id, roles: user.roles.map((role) => role.key).join(',') },
      { expiresIn: process.env.JWT_EXPIRATION, secret: process.env.JWT_SECRET },
      // { jit: randomUUIDv7() },
    );

    const refreshToken = this.jwtService.sign(
      { userId: user.id },
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRATION,
        secret: process.env.JWT_REFRESH_SECRET,
      },
    );

    return { accessToken: token, refreshToken, userId: user.id };
  }

  async findUserById(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: { permissions: true },
        },
      },
    });

    if (!user) {
      throw createGraphQLError(
        HttpStatus.NOT_FOUND,
        ERROR_MESSAGES.USER.NOT_FOUND.MESSAGE,
        ERROR_MESSAGES.USER.NOT_FOUND.CODE,
      );
    }

    return user;
  }

  async checkUserExists(data: CheckUserExistDto): Promise<boolean> {
    if (!data.email && !data.phone && !data.username) {
      return false;
    }
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { phone: data.phone },
          { username: data.username },
        ].filter((condition) => Object.values(condition)[0] !== undefined),
      },
    });

    return !!user;
  }

  async logout(token: string): Promise<boolean> {
    try {
      const decodedToken = this.jwtService.decode(token) as {
        exp: number;
        jit: string;
      };
      if (!decodedToken || !decodedToken.exp) {
        throw createGraphQLError(
          HttpStatus.BAD_REQUEST,
          ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS.MESSAGE,
          ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS.CODE,
        );
      }

      // Add token to blacklist with expiration time
      const expiration = decodedToken.exp - Math.floor(Date.now() / 1000); // Thời gian còn lại của token
      const jit = decodedToken.jit;
      if (expiration > 0) {
        await this.redisService.set(`blacklist:${jit}`, true, expiration);
      }

      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    // Decode token để lấy thông tin
    const decodedToken = this.jwtService.decode(token) as {
      exp: number;
      jit: string;
    };
    if (!decodedToken || !decodedToken.exp) {
      throw createGraphQLError(
        HttpStatus.BAD_REQUEST,
        ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS.MESSAGE,
        ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS.CODE,
      );
    }
    return !!(await this.redisService.get(`blacklist:${decodedToken.jit}`));
  }
}
