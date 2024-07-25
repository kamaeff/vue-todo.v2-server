import {Module} from "@nestjs/common";
import {UserController} from "./user.controller";
import {ConfigModule} from "@nestjs/config";
import {UserService} from "./user.service";
import {PrismaService} from "src/prisma.service";
import {AuthModule} from "../auth/auth.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
  ],
  controllers: [UserController],
  providers: [UserService, PrismaService],
  exports: [UserService],
})
export class UserModule {}
