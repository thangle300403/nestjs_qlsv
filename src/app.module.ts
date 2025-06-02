import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { Register } from './entities/register.entity';
import { Subject } from './entities/subject.entity';
import { StudentController } from './student.controller';
import { SubjectController } from './subject.controller';
import { RegisterController } from './register.controller';
import { AppController } from './app.controller';
import { StudentApiController } from './api/student/student.api.controller';
import { SubjectApiController } from './api/subject/subject.api.controller';
import { RegisterApiController } from './api/register/register.api.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('DB_HOST'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        entities: [Student, Register, Subject],
        synchronize: false,
      }),
    }),
    TypeOrmModule.forFeature([Student, Register, Subject]),
  ],
  controllers: [
    StudentController,
    SubjectController,
    RegisterController,
    AppController,
    StudentApiController,
    SubjectApiController,
    RegisterApiController,
  ],
})
export class AppModule {}
