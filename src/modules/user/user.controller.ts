import {
  Body,
  Controller,
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
import { uploadAvatarOptions } from './multer-s3.config';
import { UpdateUserDto } from './dto/update-user.dto';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/libs/guards/auth.guard';
import { Public } from '../../config/decorators/public.decorator';
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

  @Get('coaches')
  getCoaches(@Req() req: Request): Promise<User[]> {
    const user = req.user as User;
    return this.usersService.getCoaches(user.id);
  }

  @Get(':phone')
  findOne(@Param('phone') phone: string): Promise<User> {
    return this.usersService.findOne(phone);
  }

  @Patch()
  @UseInterceptors(FileInterceptor('avatar', uploadAvatarOptions))
  async updateProfile(
    @Body() dto: UpdateUserDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const user = req.user as User;
    const avatarUrl = file?.filename; // публичная ссылка
    return this.usersService.updateUser(user, dto, avatarUrl);
  }
}
