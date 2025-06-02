import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Redirect,
  Render,
  Req,
  Res,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Subject } from './entities/subject.entity';
import { Register } from './entities/register.entity';
import { Response } from 'express';
import { Request } from 'express';

@Controller('subject')
export class SubjectController {
  constructor(
    @InjectRepository(Subject)
    private subjectRepo: Repository<Subject>,
    @InjectRepository(Register)
    private registerRepo: Repository<Register>,
  ) {}

  // GET /subject → views/subject/index.ejs
  @Get()
  @Render('subject/index')
  async getSubjects(
    @Req() req: Request,
    @Query('page') page: string = '1',
    @Query('search') search: string = '',
  ) {
    const pageNumber = parseInt(page, 10) || 1;
    const itemsPerPage = 5;
    const skip = (pageNumber - 1) * itemsPerPage;

    const [subjects, total] = await this.subjectRepo.findAndCount({
      relations: ['registers', 'registers.subject'],
      where: search ? { name: Like(`%${search}%`) } : undefined,
      skip,
      take: itemsPerPage,
    });

    const totalPages = Math.ceil(total / itemsPerPage);

    return {
      subjects,
      totalPages,
      page: pageNumber,
      search,
      currentPath: req.path,
    };
  }

  // GET /subject/add → views/subject/subject-add.ejs
  @Get('/add')
  @Render('subject/subject-add')
  addSubjectPage(@Req() req: Request) {
    return { currentPath: req.path };
  }

  // POST /subject/add → redirect to /subject
  @Post('/add')
  @Redirect('/subject')
  async addSubject(@Body() body: { name: string; number_of_credit: number }) {
    const subject = this.subjectRepo.create({
      name: body.name,
      number_of_credit: body.number_of_credit,
    });
    await this.subjectRepo.save(subject);
  }

  // GET /subject/edit/:id → views/subject/subject-edit.ejs
  @Get('/edit/:id')
  @Render('subject/subject-edit')
  async editSubjectPage(@Param('id') id: number, @Req() req: Request) {
    const subject = await this.subjectRepo.findOneBy({ id });
    return { subject, currentPath: req.path };
  }

  // POST /subject/edit/:id → redirect to /subject
  @Post('/edit/:id')
  @Redirect('/subject')
  async updateSubject(
    @Param('id') id: number,
    @Body() body: { name: string; number_of_credit: number },
  ) {
    await this.subjectRepo.update(id, {
      name: body.name,
      number_of_credit: body.number_of_credit,
    });
  }

  // POST /subject/delete/:id → conditional deletion with alert
  @Post('/delete/:id')
  async deleteSubject(@Param('id') id: number, @Res() res: Response) {
    const hasRegister = await this.registerRepo.count({
      where: { subject: { id } },
    });

    if (hasRegister > 0) {
      return res.send(
        `<script>alert("Cannot delete this subject because it is registered by subjects."); window.location.href='/subject';</script>`,
      );
    }

    await this.subjectRepo.delete(id);
    return res.redirect('/subject');
  }
}
