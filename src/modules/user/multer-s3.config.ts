// import multerS3 from 'multer-s3';
// import { s3, S3_BUCKET } from '../../config/connections/s3.config';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { User } from '../../entities/user.entity';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

// export const uploadAvatar = multer({
//   storage: multerS3({
//     s3,
//     bucket: S3_BUCKET,
//     contentType: multerS3.AUTO_CONTENT_TYPE,
//     acl: 'public-read', // или 'private' если URL не должен быть публичным
//     key: (req, file, cb) => {
//       const userId = (req.user as User).id;
//       const ext = file.originalname.split('.').pop();
//       cb(null, `avatars/${userId}-${Date.now()}.${ext}`);
//     },
//   }),
// });

const uploadDir = path.resolve(__dirname, '../../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const uploadAvatarOptions: MulterOptions = {
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const userId = (req.user as User).id;
      const ext = path.extname(file.originalname);
      const fileName = `avatar-${userId}-${Date.now()}${ext}`;
      cb(null, fileName);
    },
  }),
  fileFilter: (req, file, cb) => {
    // Простейшая валидация на тип файла
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Недопустимый тип файла'), false);
    }
  },
  limits: {
    // fileSize: 5 * 1024 * 1024, // ограничение 5MB
  },
};
