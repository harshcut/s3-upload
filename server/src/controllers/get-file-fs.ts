import { readFile } from 'fs/promises'
import { bucketName } from '../lib/s3'
import prisma from '../../prisma'
import type { Request, Response } from 'express'
import type { User } from '@prisma/client'

const getFile = async (req: Request, res: Response) => {
  const fileId = req.params.fileId
  const user = req.user as User
  const upload = await prisma.upload.findFirst({ where: { fileId, userId: user.id } })
  if (!upload) {
    return res.status(404).json({ data: null, error: 'File not found' })
  }
  try {
    const output = await readFile(`./${bucketName}/${fileId}`)
    res.attachment(upload.fileName).send(output)
  } catch (err) {
    res.status(500).json({ data: null, error: err })
  }
}

export default getFile
