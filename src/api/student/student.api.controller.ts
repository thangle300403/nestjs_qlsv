import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Student } from '../../entities/student.entity';
import { Register } from '../../entities/register.entity';

@Controller('students')
export class StudentApiController {
  constructor(
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(Register)
    private registerRepo: Repository<Register>,
  ) {}

  @Get()
  async getStudentsJson(
    @Query('page') page: string = '1',
    @Query('search') search: string = '',
  ) {
    const pageNumber = parseInt(page, 10) || 1;
    const itemsPerPage = 5;
    const skip = (pageNumber - 1) * itemsPerPage;

    const [students, total] = await this.studentRepo.findAndCount({
      where: search ? { name: Like(`%${search}%`) } : undefined,
      skip,
      take: itemsPerPage,
    });

    const formattedStudents = students.map((student) => ({
      id: student.id,
      name: student.name,
      birthday: student.birthday
        ? student.birthday.toISOString().split('T')[0]
        : '',
      gender: student.gender,
    }));

    return {
      items: formattedStudents,
      totalItem: total,
      pagination: {
        page: pageNumber,
        totalPage: Math.ceil(total / itemsPerPage),
      },
    };
  }

  @Post()
  async createStudent(
    @Body() body: { name: string; birthday: string; gender: string },
  ) {
    const student = this.studentRepo.create({
      name: body.name,
      birthday: body.birthday,
      gender: body.gender,
    });
    const savedStudent = await this.studentRepo.save(student);
    return {
      id: savedStudent.id,
      name: savedStudent.name,
      birthday: savedStudent.birthday,
      gender: savedStudent.gender,
    };
  }

  @Put('/:id')
  async updateStudent(
    @Param('id') id: number,
    @Body() body: { name: string; birthday: string; gender: string },
  ) {
    const student = await this.studentRepo.findOneBy({ id });

    if (!student) {
      throw new NotFoundException('Student not found.');
    }

    student.name = body.name;
    student.birthday = new Date(body.birthday);
    student.gender = body.gender;

    const updatedStudent = await this.studentRepo.save(student);

    return {
      id: updatedStudent.id,
      name: updatedStudent.name,
      birthday: updatedStudent.birthday,
      gender: updatedStudent.gender,
    };
  }

  @Delete('/:id')
  async deleteStudent(@Param('id') id: number) {
    const student = await this.studentRepo.findOneBy({ id });

    if (!student) {
      throw new NotFoundException('Student not found.');
    }

    const registerCount = await this.registerRepo.count({
      where: { student: { id } },
    });

    if (registerCount > 0) {
      throw new BadRequestException(
        'Cannot delete this student because they are registered in subjects.',
      );
    }

    await this.studentRepo.delete(id);

    return {
      message: `Student with ID ${id} has been deleted successfully.`,
    };
  }
}
