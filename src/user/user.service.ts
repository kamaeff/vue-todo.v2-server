import {BadRequestException, Injectable} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import {JwtService} from "@nestjs/jwt";

import {PrismaService} from "./../prisma.service";
import {
  UserLoginRequestDto,
  UserLoginResponseDto,
  UserRegisterRequestDto,
} from "src/types/user.dto";

@Injectable()
export class UserService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signUp(
    dto: UserRegisterRequestDto,
  ): Promise<{userId: string; username: string; access_token: string}> {
    const existingUser = await this.prismaService.user.findUnique({
      where: {
        username: dto.username,
      },
    });

    if (existingUser) throw new BadRequestException("Username already taken");

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    try {
      const newUser = await this.prismaService.user.create({
        data: {
          user_id: dto.id,
          username: dto.username,
          name: dto.name,
          password: hashedPassword,
        },
      });

      const payload = {sub: newUser.user_id, username: newUser.username};
      const access_token = await this.jwtService.signAsync(payload);

      return {
        userId: newUser.user_id,
        username: newUser.username,
        access_token,
      };
    } catch (error) {
      throw new BadRequestException("Failed to create user");
    }
  }

  async signIn(dto: UserLoginRequestDto): Promise<UserLoginResponseDto> {
    const user = await this.prismaService.user.findUnique({
      where: {
        username: dto.username,
      },
      include: {
        task: true,
      },
    });

    if (!user) throw new BadRequestException("User not found");

    const isPasswordMatch = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordMatch) throw new BadRequestException("Wrong password");

    const payload = {sub: user.user_id, username: user.username};
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.user_id,
        username: user.username,
        name: user.name,
        tasks: user.task,
      },
    };
  }
}
