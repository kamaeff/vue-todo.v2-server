import {Module} from "@nestjs/common";
import {AppController} from "./app.controller";
import {AppService} from "./app.service";
import {UserController} from "./user/user.controller";
import {UserModule} from "./user/user.module";
import {PrismaService} from "./prisma.service";
import {PassportModule} from "@nestjs/passport";
import {JwtModule} from "@nestjs/jwt";
import {AuthModule} from "./auth/auth.module";
import {JwtStrategy} from "./auth/jwt.strategy";

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.SECRET,
      signOptions: {expiresIn: "60s"},
    }),
    AuthModule,
  ],
  controllers: [AppController, UserController],
  providers: [AppService, PrismaService, JwtStrategy],
})
export class AppModule {}
