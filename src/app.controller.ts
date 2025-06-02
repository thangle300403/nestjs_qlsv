import { Controller, Get, Render, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller()
export class AppController {
  @Get('/')
  @Render('index') // views/index.ejs
  getIndex(@Req() req: Request) {
    return { currentPath: req.path };
  }
}
