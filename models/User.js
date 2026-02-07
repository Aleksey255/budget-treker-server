import { Schema, model } from 'mongoose'

// export interface IUser extends Document {
//   email: string
//   password: string
//   name: string
//   comparePassword(candidatePassword: string): Promise<boolean>
// }

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
)

const User = model('User', UserSchema)

export default User
