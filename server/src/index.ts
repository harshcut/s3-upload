import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'

dotenv.config()
const port = process.env.HTTP_PORT || 4000

const app = express()
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.listen(port, () => {
  console.info(`ready - started express server on http://localhost:${port}`)
})
