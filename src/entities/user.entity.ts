import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Day } from './day.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  name: string;

  @Column('text', { array: true })
  roles: string[];

  @Column()
  phone: string;

  @OneToMany(() => Day, (day) => day.user, { onDelete: 'CASCADE' })
  days: Day[];

  @Column({ nullable: true })
  avatar?: string;
}
