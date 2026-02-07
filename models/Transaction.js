import { Schema, model } from 'mongoose'

export const TransactionSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    categoryId: {
      type: String,
      required: true,
    },
    categoryName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
)
const Transaction = model('Transaction', TransactionSchema)
export default Transaction
