import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '../../entities/user.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { uploadAvatar } from './multer-s3.config';
import { UpdateUserDto } from './dto/update-user.dto';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/libs/guards/auth.guard';
// import { File } from 'multer-s3';

@Controller('user')
@UseGuards(JwtAuthGuard)
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

  @Patch()
  // @UseInterceptors(FileInterceptor('avatar', uploadAvatar))
  async updateProfile(
    @Body() dto: UpdateUserDto,
    @UploadedFile() file: File & { location: string },
    @Req() req: Request,
  ) {
    const user = req.user as User;
    const avatarUrl = file?.location; // публичная ссылка
    return this.usersService.updateUser(user, dto, avatarUrl);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(Number(id));
  }
}
