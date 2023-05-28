import { PutObjectCommand } from '@aws-sdk/client-s3'
import crypto from 'crypto'
import { s3, bucketName } from '../lib/s3'
import prisma from '../../prisma'
import type { Request, Response } from 'express'
import type { User } from '@prisma/client'

const uploadFile = async (req: Request, res: Response) => {
  const file = req.file
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' })
  }
  const fileId = crypto.randomUUID()
  const putObjectCommand = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileId,
    ContentType: file.mimetype,
    Body: file.buffer,
  })
  try {
    await s3.send(putObjectCommand)
  } catch (err) {
    return res.status(500).json({ data: null, error: err })
  }
  const user = req.user as User
  const newUpload = await prisma.upload.create({
    data: {
      fileId: fileId,
      fileName: file.originalname,
      fileSize: file.size.toString(),
      userId: user.id,
    },
  })
  return res.status(200).json({ data: newUpload, error: null })
}

export default uploadFile
