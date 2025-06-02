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
import { Repository } from 'typeorm';
import { Register } from '../../entities/register.entity';
import { Student } from '../../entities/student.entity';
import { Subject } from '../../entities/subject.entity';

@Controller('registers')
export class RegisterApiController {
  constructor(
    @InjectRepository(Register)
    private readonly registerRepo: Repository<Register>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
  ) {}

  @Get()
  async getRegistersJson(
    @Query('page') page: string = '1',
    @Query('search') search: string = '',
  ) {
    const pageNumber = parseInt(page, 10) || 1;
    const itemsPerPage = 5;
    const skip = (pageNumber - 1) * itemsPerPage;

    const queryBuilder = this.registerRepo
      .createQueryBuilder('register')
      .leftJoinAndSelect('register.student', 'student')
      .leftJoinAndSelect('register.subject', 'subject')
      .orderBy('register.id', 'ASC')
      .skip(skip)
      .take(itemsPerPage);

    if (search) {
      queryBuilder.andWhere('student.name LIKE :search', {
        search: `%${search}%`,
      });
    }

    const [registers, total] = await queryBuilder.getManyAndCount();

    const formattedRegisters = registers.map((register) => ({
      id: register.id,
      student_id: register.student?.id || '',
      student_name: register.student?.name || '',
      subject_id: register.subject?.id || '',
      subject_name: register.subject?.name || '',
      score: register.score?.toString() || '',
    }));

    return {
      items: formattedRegisters,
      totalItem: total,
      pagination: {
        page: pageNumber,
        totalPage: Math.ceil(total / itemsPerPage),
      },
    };
  }

  @Post()
  async createRegister(
    @Body()
    body: {
      studentId: number;
      subjectId: number;
      score: number;
    },
  ) {
    const student = await this.studentRepo.findOneBy({ id: body.studentId });
    const subject = await this.subjectRepo.findOneBy({ id: body.subjectId });

    if (!student || !subject) {
      throw new BadRequestException('Student or Subject not found.');
    }

    const register = this.registerRepo.create({
      student,
      subject,
      score: body.score,
    });
    const savedRegister = await this.registerRepo.save(register);

    return {
      id: savedRegister.id,
      student_id: savedRegister.student.id,
      student_name: savedRegister.student.name,
      subject_id: savedRegister.subject.id,
      subject_name: savedRegister.subject.name,
      score: savedRegister.score,
    };
  }

  @Put('/:id')
  async updateRegister(
    @Param('id') id: number,
    @Body()
    body: {
      studentId: number;
      subjectId: number;
      score: number;
    },
  ) {
    const register = await this.registerRepo.findOne({
      where: { id },
      relations: ['student', 'subject'],
    });

    if (!register) {
      throw new NotFoundException('Register not found.');
    }

    const student = await this.studentRepo.findOneBy({ id: body.studentId });
    const subject = await this.subjectRepo.findOneBy({ id: body.subjectId });

    if (!student || !subject) {
      throw new BadRequestException('Student or Subject not found.');
    }

    register.student = student;
    register.subject = subject;
    register.score = body.score;

    const updatedRegister = await this.registerRepo.save(register);

    return {
      id: updatedRegister.id,
      student_id: updatedRegister.student.id,
      student_name: updatedRegister.student.name,
      subject_id: updatedRegister.subject.id,
      subject_name: updatedRegister.subject.name,
      score: updatedRegister.score,
    };
  }

  @Delete('/:id')
  async deleteRegister(@Param('id') id: number) {
    const register = await this.registerRepo.findOneBy({ id });

    if (!register) {
      throw new NotFoundException('Register not found.');
    }

    await this.registerRepo.delete(id);

    return {
      message: `Register with ID ${id} has been deleted successfully.`,
    };
  }
}
