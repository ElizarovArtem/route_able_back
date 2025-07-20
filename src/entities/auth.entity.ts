import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('auth_codes')
export class AuthCodes {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  phone: string;

  @Column({ nullable: true })
  smsCode: string;
}
