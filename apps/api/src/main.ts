import { config } from "dotenv";
import { resolve } from "path";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

config({
  path: resolve(process.cwd(), "../../.env"),
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("v1");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000" });
  await app.listen(Number(process.env.PORT));
}
bootstrap();
