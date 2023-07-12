import aws from "aws-sdk";
import { S3Client } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";

aws.config.update({
  accessKeyId: process.env.ACCESS_KEY!,
  secretAccessKey: process.env.ACCESS_SECRET!,
  region: process.env.REGION,
});

const s3 = new aws.S3();

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
    acl: "public-read",
    bucket: S3_BUCKET!,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      file.filename = Date.now().toString() + path.extname(file.originalname);
      cb(null, file.filename);
    },
  }),
  limits: {
    // Max Size is 20MB
    fileSize: 1024 * 1024 * 20,
  },
});

export { s3, upload };
