import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as expressLayouts from 'express-ejs-layouts';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });
  app.setGlobalPrefix('/api/v1');
  app.setViewEngine('ejs');
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.use(expressLayouts);
  app.set('layout', './layout');
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`App running at http://localhost:${port}`);
}
bootstrap();
