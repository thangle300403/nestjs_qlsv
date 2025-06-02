import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Register } from './register.entity';

@Entity()
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'datetime', nullable: true })
  birthday: Date;

  @Column()
  gender: string;

  @OneToMany(() => Register, (register) => register.student)
  registers: Register[];
}
