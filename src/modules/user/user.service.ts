import { Injectable } from '@nestjs/common';
import { User } from '../../entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateUserDto } from './dto/update-user.dto';

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

  async updateUser(user: User, dto: UpdateUserDto, avatarUrl?: string) {
    const updateData: Partial<User> = { ...dto };
    if (avatarUrl) updateData.avatar = avatarUrl;
    await this.userRepository.update({ id: user.id }, updateData);
    return this.userRepository.findOne({ where: { id: user.id } });
  }

  async remove(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }
}
