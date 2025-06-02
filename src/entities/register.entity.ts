import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Student } from './student.entity';
import { Subject } from './subject.entity';

@Entity()
export class Register {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  student_id: number;

  @Column()
  subject_id: number;

  @Column({ type: 'float', default: 0 })
  score: number;

  @ManyToOne(() => Student, (student) => student.registers)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @ManyToOne(() => Subject, (subject) => subject.registers)
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;
}
