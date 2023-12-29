import { type z } from 'zod'
import {
  type InsertPaymentParamsSchema,
  type InsertFedNowPaymentParamsSchema,
  type InsertLedgerEntryParamsSchema,
  type InsertPromotionLedgerEntryParamsSchema,
  type InsertTransactionRecordParamsSchema
} from './schemas'

/**
 * Represents the parameters required to insert a payment.
 * Inferred from the InsertPaymentParamsSchema.
 */
export type InsertPaymentParams = z.infer<typeof InsertPaymentParamsSchema>

/**
 * Represents the parameters required to insert a FedNow payment.
 * Inferred from the InsertFedNowPaymentParamsSchema.
 */
export type InsertFedNowPaymentParams = z.infer<typeof InsertFedNowPaymentParamsSchema>

/**
 * Represents the parameters required to insert a ledger entry.
 * Inferred from the InsertLedgerEntryParamsSchema.
 */
export type InsertLedgerEntryParams = z.infer<typeof InsertLedgerEntryParamsSchema>

/**
 * Represents the parameters required for inserting a promotion ledger entry.
 * Inferred from the InsertPromotionLedgerEntryParamsSchema.
 */
export type InsertPromotionLedgerEntryParams = z.infer<typeof InsertPromotionLedgerEntryParamsSchema>

/**
 * Represents the parameters required for inserting a transaction record.
 * Inferred from the InsertTransactionRecordParamsSchema.
 */
export type InsertTransactionRecordParams = z.infer<typeof InsertTransactionRecordParamsSchema>

/**
 * Interface defining the structure of the database operations.
 */
export interface DB {
  /**
   * Inserts a payment record into the database.
   * @param params - The parameters for the payment insertion.
   * @returns A promise that resolves with the generated payment ID.
   */
  insertPayment: (params: InsertPaymentParams) => Promise<string>

  /**
   * Inserts a FedNow payment record into the database.
   * @param params - The parameters for the FedNow payment insertion.
   * @returns A promise that resolves with the generated FedNow payment ID.
   */
  insertFedNowPayment: (params: InsertFedNowPaymentParams) => Promise<string>

  /**
   * Inserts a ledger entry into the database.
   * @param params - The parameters for the ledger entry insertion.
   * @returns A promise that resolves with the generated ledger ID.
   */
  insertLedgerEntry: (params: InsertLedgerEntryParams) => Promise<string>

  /**
   * Inserts a promotion ledger entry into the database.
   * @param params - The parameters for the promotion ledger entry insertion.
   * @returns A promise that resolves with the generated promotion ledger ID.
   */
  insertPromotionLedgerEntry: (
    params: InsertPromotionLedgerEntryParams
  ) => Promise<string>

  /**
   * Inserts a transaction record into the database.
   * @param params - The parameters for the transaction record insertion.
   * @returns A promise that resolves with the generated transaction record ID.
   */
  insertTransactionRecord: (
    params: InsertTransactionRecordParams
  ) => Promise<string>
};
