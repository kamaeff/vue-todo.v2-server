import {NestFactory} from "@nestjs/core";
import {AppModule} from "./app.module";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as https from "https";

dotenv.config();

async function bootstrap() {
  // const httpsOptions = {
  //   key: fs.readFileSync("/etc/letsencrypt/live/kamaeff-site.ru/privkey.pem"),
  //   cert: fs.readFileSync(
  //     "/etc/letsencrypt/live/kamaeff-site.ru/fullchain.pem",
  //   ),
  // };

  const app = await NestFactory.create(AppModule, {
    // httpsOptions,
  });

  app.setGlobalPrefix("api");
  app.enableCors();
  await app.listen(4200);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
