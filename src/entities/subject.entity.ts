import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Register } from './register.entity';

@Entity()
export class Subject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  number_of_credit: number;

  @OneToMany(() => Register, (register) => register.subject)
  registers: Register[];
}
