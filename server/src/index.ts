import dotenv from 'dotenv'
import express, { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import cookieSession from 'cookie-session'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { google } from 'googleapis'
import multer from 'multer'
import prisma from '../prisma'
import getFileFS from './controllers/get-file-fs'
import uploadFileFS from './controllers/upload-file-fs'
import type { User } from '@prisma/client'

dotenv.config()
const port = process.env.HTTP_PORT || 4000
const secret = process.env.SECRET || ''
const origin = process.env.CROSS_ORIGIN || 'http://localhost:3000'
const upload = multer()

const authClient = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID || '',
  process.env.GOOGLE_CLIENT_SECRET || '',
  'http://localhost:4000/auth/google/callback'
)

const authUrl = authClient.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['email', 'profile'],
})

const app = express()
app.use(cors({ origin: origin, credentials: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieSession({ keys: [secret], maxAge: 24 * 60 * 60 * 1000 }))
app.use(cookieParser(secret))

const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  try {
    req.user = jwt.verify(req.cookies['token'], secret, { ignoreExpiration: false })
    next()
  } catch {
    res.status(401).json({ data: null, error: 'Unauthorized' })
  }
}

app.get('/auth/google', (_, res) => {
  res.redirect(authUrl)
})

app.get('/auth/google/callback', async (req, res) => {
  const code = req.query.code as string
  const { tokens } = await authClient.getToken(code)
  authClient.setCredentials(tokens)
  const { data } = await google.oauth2('v2').userinfo.get({ auth: authClient })
  let user = await prisma.user.findUnique({ where: { googleId: data.id! } })
  if (!user) {
    user = await prisma.user.create({
      data: { googleId: data.id!, displayName: data.name! },
    })
  }
  const token = jwt.sign(user, secret)
  res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
  res.redirect(origin)
})

app.get('/logout', (_, res) => {
  res.clearCookie('token').redirect(origin)
})

app.post('/upload', isAuthenticated, upload.array('file'), uploadFileFS)

app.get('/download/:fileId', isAuthenticated, getFileFS)

app.get('/', isAuthenticated, async (req, res) => {
  const user = req.user as User & { uploads?: any[] }
  user.uploads = await prisma.upload.findMany({ where: { userId: user.id } })
  res.status(200).json({ data: user, error: null })
})

app.listen(port, () => {
  console.info(`ready - started express server on http://localhost:${port}`)
})
