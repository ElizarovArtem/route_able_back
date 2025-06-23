import { Injectable } from '@nestjs/common';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  findOne(phone: string): Promise<User | null> {
    return this.userRepository.findOneBy({ phone });
  }

  async update(phone: string, updateData: Partial<User>): Promise<User> {
    await this.userRepository.update(phone, updateData);
    return this.findOne(phone);
  }

  async remove(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }
}
