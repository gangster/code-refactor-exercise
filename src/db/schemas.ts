import { z } from 'zod'

import { PaymentMethod } from '../types'
// Schema for InsertPaymentParams, validating parameters required for inserting a payment.
export const InsertPaymentParamsSchema = z.object({
  payerId: z.string().length(32), // 32-character string for payer ID
  payeeId: z.string().length(32), // 32-character string for payee ID
  developerId: z.string().length(32), // 32-character string for developer ID
  amount: z.number().nonnegative(), // Non-negative number for amount
  interactionTypeId: z.number(), // Numeric ID for interaction type
  paymentMethod: z.nativeEnum(PaymentMethod), // Enum for payment method
  sqlTransactionId: z.string().length(32) // 32-character string for SQL transaction ID
})

// Schema for InsertFedNowPaymentParams, validating parameters required for inserting a FedNow payment.
export const InsertFedNowPaymentParamsSchema = z.object({
  paymentId: z.string().length(32), // 32-character string for payment ID
  payerAccountId: z.string().length(32), // 32-character string for payer account ID
  payeeAccountId: z.string().length(32), // 32-character string for payee account ID
  sqlTransactionId: z.string().length(32) // 32-character string for SQL transaction ID
})

// Schema for InsertLedgerEntryParams, validating parameters required for inserting a ledger entry.
export const InsertLedgerEntryParamsSchema = z.object({
  payerId: z.string().length(32), // 32-character string for payer ID
  payeeId: z.string().length(32), // 32-character string for payee ID
  developerId: z.string().length(32), // 32-character string for developer ID
  amount: z.number(), // Number for amount
  interactionTypeId: z.number(), // Numeric ID for interaction type
  sqlTransactionId: z.string() // String for SQL transaction ID
})

// Schema for InsertPromotionLedgerEntryParams, validating parameters required for inserting a promotion ledger entry.
export const InsertPromotionLedgerEntryParamsSchema = z.object({
  developerId: z.string().length(32), // 32-character string for developer ID
  payerId: z.string().length(32), // 32-character string for payer ID
  payeeId: z.string().length(32), // 32-character string for payee ID
  promoAmount: z.number().nonnegative(), // Non-negative number for promotional amount
  interactionTypeId: z.number(), // Numeric ID for interaction type
  sqlTransactionId: z.string().length(32) // 32-character string for SQL transaction ID
})

// Schema for InsertTransactionRecordParams, validating parameters required for inserting a transaction record.
export const InsertTransactionRecordParamsSchema = z.object({
  ledgerEntries: z.array(z.string()).nonempty(), // Non-empty array of ledger entry strings
  sqlTransactionId: z.string().length(32) // 32-character string for SQL transaction ID
})
