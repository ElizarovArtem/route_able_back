import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '../../entities /user.entity';

@Controller('user')
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @Post()
  create(@Body() userData: Partial<User>): Promise<User> {
    return this.usersService.create(userData);
  }

  @Get()
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':phone')
  findOne(@Param('phone') phone: string): Promise<User> {
    return this.usersService.findOne(phone);
  }

  // @Put(':id')
  // update(
  //   @Param('id') id: string,
  //   @Body() updateData: Partial<User>,
  // ): Promise<User> {
  //   return this.usersService.update(Number(id), updateData);
  // }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(Number(id));
  }
}
