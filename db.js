import { connect } from 'mongoose'
import {config} from 'dotenv'

config()

export const connectDB = async () => {
  try {
    await connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log('MongoDB connected...')
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }
}

// module.exports = connectDB;
