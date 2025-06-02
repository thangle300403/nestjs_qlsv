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
import { Register } from './entities/register.entity';
import { Request } from 'express';
import { Student } from './entities/student.entity';
import { Subject } from './entities/subject.entity';
import { Response as ExpressResponse } from 'express';

@Controller('register')
export class RegisterController {
  constructor(
    @InjectRepository(Register)
    private registerRepo: Repository<Register>,
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(Subject)
    private subjectRepo: Repository<Subject>,
  ) {}

  @Get('/')
  @Render('register/index')
  async getRegisters(
    @Req() req: Request,
    @Query('page') page: string = '1',
    @Query('search') search: string = '',
  ) {
    const pageNumber = parseInt(page, 10) || 1;
    const itemsPerPage = 5;
    const skip = (pageNumber - 1) * itemsPerPage;

    const [registers, total] = await this.registerRepo.findAndCount({
      relations: ['student', 'subject'],
      where: search
        ? [
            { student: { name: Like(`%${search}%`) } },
            { subject: { name: Like(`%${search}%`) } },
          ]
        : undefined,
      order: { id: 'ASC' },
      skip,
      take: itemsPerPage,
    });

    const totalPages = Math.ceil(total / itemsPerPage);
    return {
      registers,
      page: pageNumber,
      totalPages,
      currentPath: req.path,
      search,
    };
  }

  @Get('/add')
  @Render('register/register-add')
  async addRegisterPage(@Req() req: Request) {
    const students = await this.studentRepo.find();
    const subjects = await this.subjectRepo.find();
    const registers = await this.registerRepo.find({
      relations: ['student', 'subject'],
    });
    return { currentPath: req.path, students, subjects, registers };
  }

  @Post('/add')
  @Redirect('/register')
  async addRegister(
    @Body() body: { studentId: number; subjectId: number },
    @Res() res: ExpressResponse,
  ) {
    // Check if a register already exists
    const existingRegister = await this.registerRepo.findOne({
      where: {
        student: { id: body.studentId },
        subject: { id: body.subjectId },
      },
    });

    if (existingRegister) {
      if (existingRegister.score === null) {
        // Incomplete registration exists—deny duplicate registration
        return res.send(
          `<script>alert("Student has already registered for this subject but has not been scored yet."); window.location.href='/register';</script>`,
        );
      } else {
        // Already scored—overwrite the score
        await this.registerRepo.save(existingRegister);
        return;
      }
    }

    const newRegister = this.registerRepo.create({
      student: { id: body.studentId },
      subject: { id: body.subjectId },
    });
    await this.registerRepo.save(newRegister);
  }

  @Get('/edit/:id')
  @Render('register/register-edit')
  async editRegisterPage(@Param('id') id: number, @Req() req: Request) {
    const register = await this.registerRepo.findOne({
      where: { id },
      relations: ['student', 'subject'],
    });
    return { register, currentPath: req.path };
  }

  @Post('/edit/:id')
  @Redirect('/register')
  async updateRegister(
    @Param('id') id: number,
    @Body() body: { score: number },
  ) {
    await this.registerRepo.update(id, {
      score: body.score,
    });
  }

  @Post('/delete/:id')
  async deleteStudent(@Param('id') id: number, @Res() res: ExpressResponse) {
    await this.registerRepo.delete(id);
    res.redirect('/register');
  }
}
