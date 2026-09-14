import type { Handler } from "@netlify/functions";
import serverless from "serverless-http";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../../src/app.module";

let cachedHandler: Handler | undefined;

async function bootstrap(): Promise<Handler> {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();

  return serverless(expressApp) as Handler;
}

export const handler: Handler = async (event, context) => {
  cachedHandler ??= await bootstrap();

  return cachedHandler(event, context);
};
