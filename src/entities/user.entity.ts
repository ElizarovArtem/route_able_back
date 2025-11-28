import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Day } from './day.entity';
import { Roles } from '../config/emuns/user';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  name: string;

  @Column('text', { array: true })
  roles: Roles[];

  @Column({ nullable: true, unique: true })
  phone: string;

  @Column({ nullable: true, unique: true })
  email: string;

  @Column({ nullable: true })
  about: string;

  @OneToMany(() => Day, (day) => day.user, { onDelete: 'CASCADE' })
  days: Day[];

  @Column({ nullable: true })
  avatar?: string;
}
