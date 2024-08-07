import {
  IsArray,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import {Tasks} from "./tasks.dto";

export class UserLoginRequestDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(8)
  password: string;
}

export class UserLoginResponseDto {
  access_token: string;
  user: {
    id: string;
    username: string;
    name: string;
    tasks: Tasks[];
  };
}

export class UserAddTaskRequestDto {
  @IsString()
  id: string;

  @IsObject()
  task: Tasks;
}

export class UserRegisterRequestDto {
  @IsString()
  id: string;

  @IsString()
  username: string;

  @IsString()
  name: string;

  @IsString()
  @MinLength(8)
  password: string;
}
