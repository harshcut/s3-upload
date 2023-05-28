import dotenv from 'dotenv'
import express from 'express'
import cookieSession from 'cookie-session'
import cors from 'cors'
import passport from 'passport'
import { Strategy } from 'passport-google-oauth20'
import prisma from '../prisma'
import type { User } from '@prisma/client'

dotenv.config()
const port = process.env.HTTP_PORT || 4000

passport.use(
  new Strategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: '/auth/google/callback',
    },
    async (_accessToken, _refreshToken, profile, done) => {
      const user = await prisma.user.findUnique({ where: { googleId: profile.id } })
      if (!user) {
        const newUser = await prisma.user.create({
          data: { googleId: profile.id, displayName: profile.displayName },
        })
        return done(null, newUser)
      }
      done(null, user)
    }
  )
)

passport.serializeUser((user, done) => {
  done(null, (user as User).id)
})

passport.deserializeUser<string>(async (id, done) => {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    const err = new Error('User not found')
    return done(err, null)
  }
  done(null, user)
})

const app = express()
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieSession({ keys: [process.env.SECRET || ''], maxAge: 24 * 60 * 60 * 1000 }))
app.use((req, _, next) => {
  if (req.session) {
    req.session.regenerate ||= (done: () => void) => done()
    req.session.save ||= (done: () => void) => done()
  }
  next()
})
app.use(passport.initialize())
app.use(passport.session())

app.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['email', 'profile'],
  })
)

app.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: 'http://localhost:3000',
    failureRedirect: 'http://localhost:3000',
  }),
  (_, res) => {
    res.redirect('http://localhost:3000')
  }
)

app.get('/', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ data: null, error: 'Unauthorized' })
  }
  res.status(200).json({ data: req.user, error: null })
})

app.listen(port, () => {
  console.info(`ready - started express server on http://localhost:${port}`)
})
