import { GetObjectCommand } from '@aws-sdk/client-s3'
import { s3, bucketName } from '../lib/s3'
import prisma from '../../prisma'
import type { Request, Response } from 'express'
import type { User } from '@prisma/client'
import type { Readable } from 'stream'

const getFile = async (req: Request, res: Response) => {
  const fileId = req.params.fileId
  const user = req.user as User
  const upload = await prisma.upload.findFirst({ where: { fileId, userId: user.id } })
  if (!upload) {
    return res.status(404).json({ data: null, error: 'File not found' })
  }
  const getObjectCommand = new GetObjectCommand({
    Bucket: bucketName,
    Key: fileId,
  })
  try {
    const output = await s3.send(getObjectCommand)
    res.attachment(upload.fileName)
    if (output.ContentType) {
      res.contentType(output.ContentType)
    }
    const fileStream = output.Body as Readable
    fileStream.pipe(res)
  } catch (err) {
    res.status(500).json({ data: null, error: err })
  }
}

export default getFile
