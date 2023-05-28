import { S3Client } from '@aws-sdk/client-s3'

export const bucketName = process.env.AWS_S3_BUCKET_NAME || 'storage'

export const s3 = new S3Client({
  endpoint: process.env.AWS_S3_ENDPOINT || 'http://localhost:5000',
  region: process.env.AWS_S3_REGION || 'us-east-1',
  forcePathStyle: true,
})
