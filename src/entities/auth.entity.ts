import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { Optional } from '@nestjs/common';

export enum AuthChannel {
  SMS = 'sms',
  EMAIL = 'email',
}

@Entity('auth_codes')
export class AuthCodes {
  @PrimaryGeneratedColumn()
  id: number;

  @Optional()
  @Column({ nullable: true })
  phone: string;

  @Optional()
  @Column({ nullable: true })
  email: string;

  @Column()
  code: string;

  @Column({
    type: 'enum',
    enum: AuthChannel,
  })
  channel: AuthChannel;

  @CreateDateColumn()
  createdAt: Date;
}
