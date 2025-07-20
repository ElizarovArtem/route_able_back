import multer from 'multer';
import multerS3 from 'multer-s3';
import { s3, S3_BUCKET } from '../../config/connections/s3.config';
import { User } from '../../entities/user.entity';

export const uploadAvatar = multer({
  storage: multerS3({
    s3,
    bucket: S3_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: 'public-read', // или 'private' если URL не должен быть публичным
    key: (req, file, cb) => {
      const userId = (req.user as User).id;
      const ext = file.originalname.split('.').pop();
      cb(null, `avatars/${userId}-${Date.now()}.${ext}`);
    },
  }),
});
