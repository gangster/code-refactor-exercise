import { z } from 'zod'

import { PaymentMethod } from './types'

// Schema for UserPurchaseInformation, detailing IDs, account IDs, amount, interaction type, and payment method.
const UserPurchaseInformationSchema = z.object({
  payeeId: z.string().length(32), // 32-character string for Payee ID
  payerId: z.string().length(32), // 32-character string for Payer ID
  payerAccountId: z.string().length(32).optional(), // Optional 32-character string for Payer Account ID
  payeeAccountId: z.string().length(32).optional(), // Optional 32-character string for Payee Account ID
  developerId: z.string().length(32), // 32-character string for Developer ID
  amount: z.number().nonnegative(), // Non-negative number for transaction amount
  interactionTypeId: z.number(), // Numeric ID for interaction type
  paymentMethod: z.nativeEnum(PaymentMethod) // Enum for Payment Method
})

// Schema for PromotionInformation, including an optional non-negative promotional amount.
const PromotionInformationSchema = z.object({
  promoAmount: z.number().nonnegative().optional() // Optional non-negative number for promotional amount
})

// Schema for ExecuteStandardPTOperationsParams, including user purchase information, promotion information, and SQL transaction ID.
export const ExecuteStandardPTOperationsParamsSchema = z.object({
  userPurchaseInformation: UserPurchaseInformationSchema, // Schema for user purchase information
  promotionInformation: PromotionInformationSchema, // Schema for promotion information
  sqlTransactionId: z.string().length(32) // 32-character string for SQL transaction ID
})
