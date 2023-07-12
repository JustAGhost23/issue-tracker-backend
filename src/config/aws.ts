import { S3Client } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from "multer-s3";
import { prisma } from "./db.js";

const s3Config = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY!,
    secretAccessKey: process.env.ACCESS_SECRET!,
  },
});

const S3_BUCKET = process.env.S3_BUCKET_NAME;

const upload = multer({
  storage: multerS3({
    s3: s3Config,
    bucket: S3_BUCKET!,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString());
    },
  }),
});

export { upload };
