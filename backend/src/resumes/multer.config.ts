
import { diskStorage } from 'multer';
import { extname } from 'path';
import { HttpException, HttpStatus } from '@nestjs/common';

export const multerOptions = {
    storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = extname(file.originalname);
            callback(null, `${uniqueSuffix}${ext}`);
        },
    }),
    fileFilter: (req: any, file: any, callback: any) => {
        if (file.mimetype.match(/\/(pdf|plain|msword|vnd.openxmlformats-officedocument.wordprocessingml.document)$/)) {
            callback(null, true);
        } else {
            callback(
                new HttpException(
                    `Unsupported file type ${extname(file.originalname)}`,
                    HttpStatus.BAD_REQUEST,
                ),
                false,
            );
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
};
