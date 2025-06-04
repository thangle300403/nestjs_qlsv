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
import { Subject } from '../../entities/subject.entity';
import { Register } from '../../entities/register.entity';
import { SubjectPayload } from '../../types';

@Controller('subjects')
export class SubjectApiController {
  constructor(
    @InjectRepository(Subject)
    private subjectRepo: Repository<Subject>,
    @InjectRepository(Register)
    private registerRepo: Repository<Register>,
  ) {}

  @Get()
  async getSubjectsJson(
    @Query('page') page: string = '1',
    @Query('search') search: string = '',
  ) {
    const pageNumber = parseInt(page, 10) || 1;
    const itemsPerPage = 5;
    const skip = (pageNumber - 1) * itemsPerPage;

    const [subjects, total] = await this.subjectRepo.findAndCount({
      where: search ? { name: Like(`%${search}%`) } : undefined,
      skip,
      take: itemsPerPage,
    });

    const formattedSubjects = subjects.map((subject) => ({
      id: subject.id,
      name: subject.name,
      number_of_credit: subject.number_of_credit,
    }));

    return {
      items: formattedSubjects,
      totalItem: total,
      pagination: {
        page: pageNumber,
        totalPage: Math.ceil(total / itemsPerPage),
      },
    };
  }

  @Post()
  async createSubject(
    @Body() body: SubjectPayload,
  ) {
    const subject = this.subjectRepo.create({
      name: body.name,
      number_of_credit: body.number_of_credit,
    });
    const savedSubject = await this.subjectRepo.save(subject);
    return {
      id: savedSubject.id,
      name: savedSubject.name,
      number_of_credit: savedSubject.number_of_credit,
    };
  }

  @Put('/:id')
  async updateSubject(
    @Param('id') id: number,
    @Body() body: SubjectPayload,
  ) {
    const subject = await this.subjectRepo.findOneBy({ id });

    if (!subject) {
      throw new NotFoundException('Subject not found.');
    }

    subject.name = body.name;
    subject.number_of_credit = body.number_of_credit;

    const updatedSubject = await this.subjectRepo.save(subject);

    return {
      id: updatedSubject.id,
      name: updatedSubject.name,
      number_of_credit: updatedSubject.number_of_credit,
    };
  }

  @Delete('/:id')
  async deleteSubject(@Param('id') id: number) {
    const subject = await this.subjectRepo.findOneBy({ id });

    if (!subject) {
      throw new NotFoundException('Subject not found.');
    }

    const registerCount = await this.registerRepo.count({
      where: { subject: { id } },
    });

    if (registerCount > 0) {
      throw new BadRequestException(
        'Cannot delete this subject because they are registered in subjects.',
      );
    }

    await this.subjectRepo.delete(id);

    return {
      message: `Subject with ID ${id} has been deleted successfully.`,
    };
  }
}
