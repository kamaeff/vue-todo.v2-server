import {
  Body,
  Controller,
  HttpCode,
  Post,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {UserService} from "./user.service";
import {
  UserLoginRequestDto,
  UserLoginResponseDto,
  UserRegisterRequestDto,
} from "src/types/user.dto";

@Controller("user")
@UsePipes(new ValidationPipe())
export class UserController {
  constructor(private readonly userService: UserService) {}

  @HttpCode(200)
  @Post("reg")
  async reg(
    @Body() dto: UserRegisterRequestDto,
  ): Promise<{userId: string; username: string; access_token: string}> {
    console.log("DTO:" + Object.keys(dto));
    return this.userService.signUp(dto);
  }

  @HttpCode(200)
  @Post("auth")
  async auth(@Body() dto: UserLoginRequestDto): Promise<UserLoginResponseDto> {
    return this.userService.signIn(dto);
  }
}
