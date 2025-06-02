import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Render,
  Redirect,
  Res,
  Req,
  Query,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { Register } from './entities/register.entity';
import { Response } from 'express';
import { Request } from 'express';
import { Like } from 'typeorm';

@Controller('student')
export class StudentController {
  constructor(
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(Register)
    private registerRepo: Repository<Register>,
  ) {}

  @Get('/')
  @Render('student/index')
  async getStudents(
    @Req() req: Request,
    @Query('page') page: string = '1',
    @Query('search') search: string = '',
  ) {
    const pageNumber = parseInt(page, 10) || 1;
    const itemsPerPage = 5;
    const skip = (pageNumber - 1) * itemsPerPage;

    const [students, total] = await this.studentRepo.findAndCount({
      relations: ['registers', 'registers.subject'],
      where: search ? { name: Like(`%${search}%`) } : undefined,
      skip,
      take: itemsPerPage,
    });

    const totalPages = Math.ceil(total / itemsPerPage);

    return {
      students,
      totalPages,
      page: pageNumber,
      search,
      currentPath: req.path,
    };
  }

  // GET /student/add → views/student/student-add.ejs
  @Get('/add')
  @Render('student/student-add')
  addStudentPage(@Req() req: Request) {
    return { currentPath: req.path };
  }

  // POST /student/add → redirect to /student
  @Post('/add')
  @Redirect('/student')
  async addStudent(
    @Body() body: { name: string; birthday: string; gender: string },
  ) {
    const student = this.studentRepo.create({
      name: body.name,
      birthday: body.birthday,
      gender: body.gender,
    });
    await this.studentRepo.save(student);
    alert('Student added successfully!');
  }

  // GET /student/edit/:id → views/student/student-edit.ejs
  @Get('/edit/:id')
  @Render('student/student-edit')
  async editStudentPage(@Param('id') id: number, @Req() req: Request) {
    const student = await this.studentRepo.findOneBy({ id });
    return { student, currentPath: req.path };
  }

  // POST /student/edit/:id → redirect to /student
  @Post('/edit/:id')
  @Redirect('/student')
  async updateStudent(
    @Param('id') id: number,
    @Body() body: { name: string; birthday: string; gender: string },
  ) {
    await this.studentRepo.update(id, {
      name: body.name,
      birthday: body.birthday,
      gender: body.gender,
    });
  }

  // POST /student/delete/:id → conditional deletion with alert
  @Post('/delete/:id')
  async deleteStudent(@Param('id') id: number, @Res() res: Response) {
    const hasRegister = await this.registerRepo.count({
      where: { student: { id } },
    });

    if (hasRegister > 0) {
      return res.send(
        `<script>alert("Cannot delete this student because they are registered for subjects."); window.location.href='/student';</script>`,
      );
    }

    await this.studentRepo.delete(id);
    return res.redirect('/student');
  }
}
