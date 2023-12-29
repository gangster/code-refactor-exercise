import { type z } from 'zod'
import { type ExecuteStandardPTOperationsParamsSchema } from '../schemas'

/**
 * Enumerates the available payment methods.
 *
 * @enum {number}
 * @property {number} FedNow - Represents FedNow payment method.
 * @property {number} Card - Represents Card payment method.
 */
export enum PaymentMethod {
  FedNow = 0,
  Card = 1,
}

/**
 * Enumerates the possible statuses of a payment.
 *
 * @enum {number}
 * @property {number} COMPLETE - Indicates that the payment is complete.
 * @property {number} PENDING - Indicates that the payment is pending.
 */
export enum PaymentStatus {
  COMPLETE = 4,
  PENDING = 5,
}

/**
 * Represents the information related to a user's purchase.
 *
 * @interface
 * @property {string} payerId - The unique identifier of the payer.
 * @property {string} payeeId - The unique identifier of the payee.
 * @property {string} [payerAccountId] - The account identifier of the payer (optional).
 * @property {string} [payeeAccountId] - The account identifier of the payee (optional).
 * @property {string} developerId - The unique identifier of the developer.
 * @property {number} amount - The amount of the transaction.
 * @property {number} interactionTypeId - The type of interaction.
 * @property {PaymentMethod} paymentMethod - The method of payment.
 */
export interface UserPurchaseInformation {
  payerId: string
  payeeId: string
  developerId: string
  amount: number
  interactionTypeId: number
  paymentMethod: PaymentMethod
  payerAccountId?: string
  payeeAccountId?: string
}

/**
 * Contains information about a promotion.
 *
 * @interface
 * @property {number} [promoAmount] - The amount of the promotion (optional).
 */
export interface PromotionInformation {
  promoAmount?: number
}

// Type alias for nullable string
type NullableString = string | null

/**
 * Represents various IDs associated with a transaction.
 *
 * @interface
 * @property {NullableString} primaryPaymentID - The primary payment ID (can be null).
 * @property {NullableString} customerLedgerEntryID - The customer ledger entry ID (can be null).
 * @property {NullableString} pursTransactionID - The PURS transaction ID (can be null).
 * @property {string} [primaryFedNowPaymentID] - The primary FedNow payment ID (optional).
 * @property {string} [promotionLedgerEntryID] - The promotion ledger entry ID (optional).
 */
export interface IdObject {
  primaryPaymentID: NullableString
  customerLedgerEntryID: NullableString
  pursTransactionID: NullableString
  primaryFedNowPaymentID?: string
  promotionLedgerEntryID?: string
}

/**
 * Type representing the parameters for executing standard PT operations.
 * This type is inferred from the `ExecuteStandardPTOperationsParamsSchema`.
 *
 * @typedef {z.infer<typeof ExecuteStandardPTOperationsParamsSchema>} ExecuteStandardPTOperationsParams
 */
export type ExecuteStandardPTOperationsParams = z.infer<typeof ExecuteStandardPTOperationsParamsSchema>
