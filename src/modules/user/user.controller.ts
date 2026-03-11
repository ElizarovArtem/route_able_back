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
import { CurrentUser } from '../../config/decorators/current-user.decorator';
import { UpdatePersonalGoalsDto } from './dto/update-personal-goals.dto';
import * as multer from 'multer';
import { CalcCaloriesDto } from './dto/analyze-tdee.dto';
import { CoachListItem } from '../../config/interfaces/user';

const memoryStorage = multer.memoryStorage();

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() userData: Partial<User>): Promise<User> {
    return this.userService.create(userData);
  }

  @Get()
  findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Get('coaches')
  getCoaches(@Req() req: Request): Promise<CoachListItem[]> {
    const user = req.user as User;
    return this.userService.getCoaches(user.id);
  }

  @Get(':phone')
  findOne(@Param('phone') phone: string): Promise<User> {
    return this.userService.findOne(phone);
  }

  @Get('byId/:id')
  getById(@Param('id') id: string): Promise<User> {
    return this.userService.getById(id);
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
    return this.userService.updateUser(user, dto, avatarUrl);
  }

  @Patch('goals')
  async updateMyGoals(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePersonalGoalsDto,
  ) {
    return this.userService.updatePersonalGoals(userId, dto);
  }

  @UseInterceptors(
    FileInterceptor('photo', {
      storage: memoryStorage,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5 Mb
      },
    }),
  )
  @Post('body-fat/photo')
  async analyzeBodyFatByPhoto(@UploadedFile() file: Express.Multer.File) {
    return this.userService.analyzeBodyFatByPhoto(file);
  }

  @Patch('tdee')
  calcCaloriesAndSave(
    @CurrentUser('id') userId: string,
    @Body() dto: CalcCaloriesDto,
  ) {
    return this.userService.updateBodyAndCalcCalories(userId, dto);
  }
}
