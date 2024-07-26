import {BadRequestException, Injectable} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import {JwtService} from "@nestjs/jwt";

import {PrismaService} from "./../prisma.service";
import {
  UserAddTaskRequestDto,
  UserLoginRequestDto,
  UserLoginResponseDto,
  UserRegisterRequestDto,
} from "src/types/user.dto";
import {Tasks} from "@prisma/client";

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
      where: {username: dto.username},
      include: {task: true},
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

  async addTask(userId: string, dto: UserAddTaskRequestDto): Promise<any> {
    const user = await this.prismaService.user.findUnique({
      where: {
        user_id: userId,
      },
      include: {
        task: true,
      },
    });

    if (!user) throw new BadRequestException("User not found");

    const newTask = await this.prismaService.tasks.create({
      data: {
        title: dto.task.title,
        subtext: dto.task.subtext,
        priority: dto.task.priority,
        status: dto.task.status,
        date: dto.task.date,
        user_id: user.id,
      },
    });

    return {status: 200, message: "Task added successfully"};
  }

  async updateTask(dto: Tasks): Promise<any> {
    const task = await this.prismaService.tasks.findUnique({
      where: {
        id: dto.id,
      },
    });

    if (!task) throw new BadRequestException("Task not found");

    const updatedTask = await this.prismaService.tasks.update({
      where: {
        id: dto.id,
      },
      data: {
        status: dto.status,
      },
    });

    if (!updatedTask) throw new BadRequestException("Failed to update task");

    return {status: 200, message: "Task updated successfully"};
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
