import {
  Body,
  Controller,
  HttpCode,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Request,
  Get,
  Param,
  Delete,
} from "@nestjs/common";
import {UserService} from "./user.service";
import {
  UserLoginRequestDto,
  UserLoginResponseDto,
  UserRegisterRequestDto,
  UserUpdateRequestDto,
} from "src/types/user.dto";
import {JwtAuthGuard} from "src/auth/jwt-auth.guard";
import {Tasks} from "@prisma/client";

@Controller("user")
@UsePipes(new ValidationPipe())
export class UserController {
  constructor(private readonly userService: UserService) {}

  @HttpCode(200)
  @Post("reg")
  async reg(
    @Body() dto: UserRegisterRequestDto,
  ): Promise<{userId: string; username: string; access_token: string}> {
    return this.userService.signUp(dto);
  }

  @HttpCode(200)
  @Post("auth")
  async auth(@Body() dto: UserLoginRequestDto): Promise<UserLoginResponseDto> {
    return this.userService.signIn(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post("update")
  async updateUser(
    @Body() dto: UserUpdateRequestDto,
    @Request() req: {user: {userId: string}},
  ): Promise<any> {
    const userId = req.user.userId;
    return this.userService.updateUser(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id/tasks")
  async getTasks(@Param("id") id: string): Promise<any> {
    return this.userService.getTasks(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id/tasks/:taskId")
  async deleteTask(
    @Param("id") userId: string,
    @Param("taskId") taskId: number,
  ): Promise<void> {
    console.log(userId, taskId);
    return this.userService.deleteTask(userId, taskId);
  }
}
