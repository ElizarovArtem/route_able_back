import { Injectable } from '@nestjs/common';
import { User } from '../../entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../../config/emuns/user';

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

  async updateUser(
    user: User,
    { isCoach, ...dto }: UpdateUserDto,
    avatarUrl?: string,
  ) {
    let updateData: Partial<User> = { ...dto, roles: user.roles };

    if (avatarUrl) {
      updateData = { ...updateData, avatar: avatarUrl };
    }

    if (isCoach) {
      updateData = { ...updateData, roles: [...updateData.roles, Roles.Coach] };
    } else {
      updateData = {
        ...updateData,
        roles: updateData.roles.filter((role) => role !== Roles.Coach),
      };
    }

    await this.userRepository.update({ id: user.id }, updateData);

    return this.userRepository.findOne({ where: { id: user.id } });
  }
}
