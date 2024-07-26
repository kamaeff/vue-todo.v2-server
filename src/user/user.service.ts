import {BadRequestException, Injectable} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import {JwtService} from "@nestjs/jwt";

import {PrismaService} from "./../prisma.service";
import {
  UserLoginRequestDto,
  UserLoginResponseDto,
  UserRegisterRequestDto,
  UserUpdateRequestDto,
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

  async updateUser(userId: string, dto: UserUpdateRequestDto): Promise<any> {
    const existingTasks = await Promise.all(
      dto.tasks.map(async task => {
        if (task.id) {
          return await this.prismaService.tasks.findUnique({
            where: {id: task.id},
          });
        }
        return null;
      }),
    );

    const newTasks = dto.tasks.filter(
      task =>
        !task.id || !existingTasks.find(existing => existing?.id === task.id),
    );

    const updatedTasks = dto.tasks.filter(
      task =>
        task.id && existingTasks.find(existing => existing.id === task.id),
    );

    const updatedUser = await this.prismaService.user.update({
      where: {
        user_id: userId,
      },
      data: {
        task: {
          create: newTasks.map(task => ({
            date: task.date,
            priority: task.priority,
            title: task.title,
            subtext: task.subtext,
            status: task.status,
          })),
          update: updatedTasks.map(task => ({
            where: {id: task.id},
            data: {
              date: task.date,
              priority: task.priority,
              title: task.title,
              subtext: task.subtext,
              status: task.status,
            },
          })),
          connect: existingTasks.filter(Boolean).map(task => ({id: task.id})),
        },
      },
    });

    if (updatedUser) {
      return {status: 200, message: "User updated successfully"};
    }
  }

  async getTasks(userId: string): Promise<any> {
    try {
      const user = await this.prismaService.user.findUnique({
        where: {user_id: userId},
        include: {task: true},
      });

      if (!user) throw new BadRequestException("User not found");

      return {tasks: user.task};
    } catch (error) {
      throw new BadRequestException("Failed to fetch tasks");
    }
  }

  async deleteTask(userId: string, taskId: number): Promise<void> {
    const user = await this.prismaService.user.findUnique({
      where: {
        user_id: userId,
      },
      include: {
        task: true,
      },
    });

    if (!user) throw new BadRequestException("User not found");

    const taskIdNumber = Number(taskId);
    const userIdNumber = Number(user.id);

    if (isNaN(taskIdNumber) || isNaN(userIdNumber)) {
      throw new BadRequestException("Invalid taskId or userId");
    }

    await this.prismaService.tasks.deleteMany({
      where: {
        id: taskIdNumber,
        user_id: userIdNumber,
      },
    });

    console.log(`Task with id ${taskId} for user with id ${userId} deleted`);
  }
}
