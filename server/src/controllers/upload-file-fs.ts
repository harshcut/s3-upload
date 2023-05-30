import { writeFile } from 'fs/promises'
import crypto from 'crypto'
import { bucketName } from '../lib/s3'
import prisma from '../../prisma'
import type { Request, Response } from 'express'
import type { User } from '@prisma/client'

const uploadFileFS = async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[]
  if (!files) {
    return res.status(400).json({ error: 'No file uploaded' })
  }
  const { id } = req.user as User
  try {
    const newUploads = files.map(async (file) => {
      const fileId = crypto.randomUUID()
      await writeFile(`./${bucketName}/${fileId}`, file.buffer)
      return await prisma.upload.create({
        data: {
          fileId: fileId,
          fileName: file.originalname,
          fileSize: file.size.toString(),
          userId: id,
        },
      })
    })
    res.status(200).json({ data: await Promise.all(newUploads), error: null })
  } catch (err) {
    return res.status(500).json({ data: null, error: err })
  }
}

export default uploadFileFS
