/**
 * Module dependencies.
 */
import AWS from 'aws-sdk'
import { getEnvVariable, type genId as genIdType, formatDate } from '../helpers'
import { PaymentMethod, PaymentStatus } from '../types'
import {
  type InsertPaymentParams,
  type InsertFedNowPaymentParams,
  type InsertLedgerEntryParams,
  type InsertPromotionLedgerEntryParams,
  type InsertTransactionRecordParams,
  type DB
} from './types'
import { InsertPaymentParamsSchema, InsertFedNowPaymentParamsSchema, InsertLedgerEntryParamsSchema, InsertPromotionLedgerEntryParamsSchema, InsertTransactionRecordParamsSchema } from './schemas'

const RDS = new AWS.RDSDataService()

/**
 * Defines the types for the dependencies required by the module.
 */
interface Dependencies {
  genId: typeof genIdType
}

/**
 * Factory function to create various database operation methods.
 * This function initializes methods for different database operations using the provided dependencies.
 *
 * @param {Dependencies} dependencies - The required dependencies including `genId`.
 * @returns An object containing methods for various database operations.
 */
export default ({ genId }: Dependencies): DB => ({
  /**
   * Inserts a payment record into the database.
   * This function takes payment details, validates them against the `InsertPaymentParamsSchema`,
   * and then inserts a new record into the payment table.
   *
   * @param {InsertPaymentParams} params - The parameters for the payment insertion.
   * The `params` object includes payerId, payeeId, developerId, amount, interactionTypeId, paymentMethod,
   * and sqlTransactionId, which are essential for creating the payment record.
   *
   * @returns {Promise<string>} A promise that resolves with the generated payment ID.
   * The promise resolves after the payment record is successfully inserted into the database.
   * If the operation fails, the promise rejects with an error detailing the cause of the failure.
   *
   * @example
   * ```
   * const paymentParams: InsertPaymentParams = {
   *   payerId: '12345',
   *   payeeId: '67890',
   *   developerId: '11223',
   *   amount: 100.50,
   *   interactionTypeId: 3,
   *   paymentMethod: PaymentMethod.Card,
   *   sqlTransactionId: 'abcd1234'
   * };
   * insertPayment(paymentParams)
   *   .then(paymentId => console.log(`Payment inserted with ID: ${paymentId}`))
   *   .catch(error => console.error(`Failed to insert payment: ${error}`));
   * ```
   */
  insertPayment: async (params: InsertPaymentParams): Promise<string> => {
    InsertPaymentParamsSchema.parse(params)
    const {
      payerId,
      payeeId,
      developerId,
      amount,
      interactionTypeId,
      paymentMethod,
      sqlTransactionId
    } = InsertPaymentParamsSchema.parse(params)

    const sql = 'INSERT ...'
    const paymentId = genId(32)
    const statementParams: AWS.RDSDataService.ExecuteStatementRequest = {
      database: getEnvVariable('DATABASE'),
      secretArn: getEnvVariable('SECRET_ARN'),
      resourceArn: getEnvVariable('CLUSTER_ARN'),
      transactionId: sqlTransactionId,
      sql,
      parameters: [
        {
          name: 'paymentId',
          value: { blobValue: Buffer.from(paymentId, 'hex') }
        },
        {
          name: 'payerId',
          value: { blobValue: Buffer.from(payerId, 'hex') }
        },
        {
          name: 'payeeId',
          value: { blobValue: Buffer.from(payeeId, 'hex') }
        },
        {
          name: 'developerId',
          value: { blobValue: Buffer.from(developerId, 'hex') }
        },
        {
          name: 'paymentAmount',
          value: { doubleValue: amount }
        },
        {
          name: 'interactionTypeId',
          value: { doubleValue: interactionTypeId }
        },
        {
          name: 'paymentMethod',
          value: { doubleValue: paymentMethod }
        },
        {
          name: 'paymentStatus',
          value: {
            doubleValue:
              paymentMethod !== PaymentMethod.FedNow || amount === 0 ? PaymentStatus.COMPLETE : PaymentStatus.PENDING
          }
        },
        {
          name: 'datePaid',
          value: {
            stringValue:
              paymentMethod === PaymentMethod.FedNow && amount > 0
                ? undefined
                : formatDate(new Date()),
            isNull: paymentMethod === PaymentMethod.FedNow && amount > 0
          }
        }
      ]
    }

    await RDS.executeStatement(statementParams).promise()
    return paymentId
  },

  /**
   * Inserts a FedNow payment record into the database.
   * This function is specific to FedNow payments and takes necessary details,
   * validates them, and inserts a record into the FedNow payments table.
   *
   * @param {InsertFedNowPaymentParams} params - The parameters for the FedNow payment insertion.
   * Includes paymentId, payerAccountId, payeeAccountId, and sqlTransactionId.
   *
   * @returns {Promise<string>} A promise that resolves with the generated FedNow payment ID.
   * Resolves after successful insertion of the FedNow payment record.
   *
   * @example
   * ```
   * const fedNowParams: InsertFedNowPaymentParams = {
   *   paymentId: 'payment123',
   *   payerAccountId: 'account456',
   *   payeeAccountId: 'account789',
   *   sqlTransactionId: 'xyz9876'
   * };
   * insertFedNowPayment(fedNowParams)
   *   .then(fedNowId => console.log(`FedNow payment inserted with ID: ${fedNowId}`))
   *   .catch(error => console.error(`Failed to insert FedNow payment: ${error}`));
   * ```
   */
  insertFedNowPayment: async (params: InsertFedNowPaymentParams): Promise<string> => {
    InsertFedNowPaymentParamsSchema.parse(params)
    const {
      paymentId,
      payerAccountId,
      payeeAccountId,
      sqlTransactionId
    } = params

    const sql = 'INSERT ...'
    const fedNowPaymentId = genId(32)
    const statementParams: AWS.RDSDataService.ExecuteStatementRequest = {
      database: getEnvVariable('DATABASE'),
      secretArn: getEnvVariable('SECRET_ARN'),
      resourceArn: getEnvVariable('CLUSTER_ARN'),
      transactionId: sqlTransactionId,
      sql,
      parameters: [
        {
          name: 'fedNowPaymentId',
          value: { blobValue: Buffer.from(fedNowPaymentId, 'hex') }
        },
        {
          name: 'paymentId',
          value: { blobValue: Buffer.from(paymentId, 'hex') }
        },
        {
          name: 'payerAccountId',
          value: { stringValue: payerAccountId }
        },
        {
          name: 'payeeAccountId',
          value: { stringValue: payeeAccountId }
        }
      ]
    }

    await RDS.executeStatement(statementParams).promise()
    return fedNowPaymentId
  },

  /**
   * Inserts a ledger entry into the database.
   * This function handles the insertion of a general ledger entry, taking various transaction details.
   *
   * @param {InsertLedgerEntryParams} params - The parameters for the ledger entry insertion.
   * Parameters include payerId, payeeId, developerId, amount, interactionTypeId, and sqlTransactionId.
   *
   * @returns {Promise<string>} A promise that resolves with the generated ledger ID.
   * Resolves after successful insertion of the ledger entry.
   *
   * @example
   * ```
   * const ledgerParams: InsertLedgerEntryParams = {
   *   payerId: '123abc',
   *   payeeId: '456def',
   *   developerId: '789ghi',
   *   amount: 150.75,
   *   interactionTypeId: 4,
   *   sqlTransactionId: 'tran12345'
   * };
   * insertLedgerEntry(ledgerParams)
   *   .then(ledgerId => console.log(`Ledger entry inserted with ID: ${ledgerId}`))
   *   .catch(error => console.error(`Failed to insert ledger entry: ${error}`));
   * ```
   */
  insertLedgerEntry: async (params: InsertLedgerEntryParams): Promise<string> => {
    const {
      payerId,
      payeeId,
      developerId,
      amount,
      interactionTypeId,
      sqlTransactionId
    } = params
    InsertLedgerEntryParamsSchema.parse(params)

    const sql = 'INSERT ...'
    const ledgerId = genId(32)
    const statementParams: AWS.RDSDataService.ExecuteStatementRequest = {
      database: getEnvVariable('DATABASE'),
      secretArn: getEnvVariable('SECRET_ARN'),
      resourceArn: getEnvVariable('CLUSTER_ARN'),
      transactionId: sqlTransactionId,
      sql,
      parameters: [
        {
          name: 'ledgerId',
          value: { blobValue: Buffer.from(ledgerId, 'hex') }
        },
        {
          name: 'payerId',
          value: { blobValue: Buffer.from(payerId, 'hex') }
        },
        {
          name: 'payeeId',
          value: { blobValue: Buffer.from(payeeId, 'hex') }
        },
        {
          name: 'amount',
          value: { doubleValue: amount }
        },
        {
          name: 'interactionTypeId',
          value: { doubleValue: interactionTypeId }
        },
        {
          name: 'developerId',
          value: { blobValue: Buffer.from(developerId, 'hex') }
        }
      ]
    }

    await RDS.executeStatement(statementParams).promise()
    return ledgerId
  },

  /**
   * Inserts a promotion ledger entry into the database.
   * This function is for recording promotional transactions, taking details like promotion amount.
   *
   * @param {InsertPromotionLedgerEntryParams} params - The parameters for the promotion ledger entry insertion.
   * Includes developerId, payeeId, payerId, promoAmount, interactionTypeId, and sqlTransactionId.
   *
   * @returns {Promise<string>} A promise that resolves with the generated promotion ledger ID.
   * Resolves after successful insertion of the promotion ledger entry.
   *
   * @example
   * ```
   * const promoLedgerParams: InsertPromotionLedgerEntryParams = {
   *   developerId: 'dev123',
   *   payeeId: 'payee456',
   *   payerId: 'payer789',
   *   promoAmount: 25.00,
   *   interactionTypeId: 5,
   *   sqlTransactionId: 'sqltrans678'
   * };
   * insertPromotionLedgerEntry(promoLedgerParams)
   *   .then(promoLedgerId => console.log(`Promotion ledger entry inserted with ID: ${promoLedgerId}`))
   *   .catch(error => console.error(`Failed to insert promotion ledger entry: ${error}`));
   * ```
   */
  insertPromotionLedgerEntry: async (params: InsertPromotionLedgerEntryParams): Promise<string> => {
    InsertPromotionLedgerEntryParamsSchema.parse(params)
    const {
      developerId,
      payeeId,
      payerId,
      promoAmount,
      interactionTypeId,
      sqlTransactionId
    } = params

    const sql = 'INSERT ...'
    const ledgerId = genId(32)
    const statementParams: AWS.RDSDataService.ExecuteStatementRequest = {
      database: getEnvVariable('DATABASE'),
      secretArn: getEnvVariable('SECRET_ARN'),
      resourceArn: getEnvVariable('CLUSTER_ARN'),
      transactionId: sqlTransactionId,
      sql,
      parameters: [
        {
          name: 'ledgerId',
          value: { blobValue: Buffer.from(ledgerId, 'hex') }
        },
        {
          name: 'payerId',
          value: { blobValue: Buffer.from(payerId, 'hex') }
        },
        {
          name: 'payeeId',
          value: { blobValue: Buffer.from(payeeId, 'hex') }
        },
        {
          name: 'developerId',
          value: { blobValue: Buffer.from(developerId, 'hex') }
        },
        {
          name: 'amount',
          value: { doubleValue: promoAmount }
        },
        {
          name: 'interactionTypeId',
          value: { doubleValue: interactionTypeId }
        }
      ]
    }

    await RDS.executeStatement(statementParams).promise()
    return ledgerId
  },

  /**
   * Inserts a transaction record into the database.
   * This function manages the insertion of a comprehensive transaction record, including multiple ledger entries.
   *
   * @param {InsertTransactionRecordParams} params - The parameters for the transaction record insertion.
   * Includes a list of ledgerEntries and an sqlTransactionId.
   *
   * @returns {Promise<string>} A promise that resolves with the generated transaction record ID.
   * Resolves after successful insertion of the transaction record.
   *
   * @example
   * ```
   * const transactionRecordParams: InsertTransactionRecordParams = {
   *   ledgerEntries: ['ledger123', 'ledger456'],
   *   sqlTransactionId: 'transql789'
   * };
   * insertTransactionRecord(transactionRecordParams)
   *   .then(transactionId => console.log(`Transaction record inserted with ID: ${transactionId}`))
   *   .catch(error => console.error(`Failed to insert transaction record: ${error}`));
   * ```
   */
  insertTransactionRecord: async (params: InsertTransactionRecordParams): Promise<string> => {
    InsertTransactionRecordParamsSchema.parse(params)
    const {
      ledgerEntries,
      sqlTransactionId
    } = params
    const sql = 'INSERT ...'
    const pursTransactionId = genId(32)
    const parameterSets = ledgerEntries.map((ledgerEntry) => [
      {
        name: 'transactionId',
        value: { blobValue: Buffer.from(pursTransactionId, 'hex') }
      },
      {
        name: 'ledgerId',
        value: { blobValue: Buffer.from(ledgerEntry, 'hex') }
      }
    ])

    const statementParams: AWS.RDSDataService.BatchExecuteStatementRequest = {
      database: getEnvVariable('DATABASE'),
      secretArn: getEnvVariable('SECRET_ARN'),
      resourceArn: getEnvVariable('CLUSTER_ARN'),
      transactionId: sqlTransactionId,
      sql,
      parameterSets
    }

    await RDS.batchExecuteStatement(statementParams).promise()
    return pursTransactionId
  }
})
