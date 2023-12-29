/* eslint-disable import/first */
import {
  type InsertFedNowPaymentParams,
  type InsertLedgerEntryParams,
  type InsertPaymentParams,
  type InsertPromotionLedgerEntryParams,
  type InsertTransactionRecordParams
} from './types'
import { PaymentMethod, PaymentStatus } from '../types'
import { formatDate } from '../helpers'

const mockExecuteStatement = jest.fn().mockImplementation(() => ({
  promise: jest.fn().mockResolvedValue({ records: [] }) // Mock resolved value
}))
const mockBatchExecuteStatement = jest.fn().mockImplementation(() => ({
  promise: jest.fn().mockResolvedValue({ records: [] }) // Mock resolved value for batch execute
}))

jest.mock('aws-sdk', () => {
  return {
    RDSDataService: jest.fn(() => ({
      executeStatement: mockExecuteStatement,
      batchExecuteStatement: mockBatchExecuteStatement
    }))
  }
})

import createDatabaseOperations from './'

describe('Database Operations', () => {
  let db: ReturnType<typeof createDatabaseOperations>

  const mockDate = new Date('2023-12-28T20:49:19.559Z')

  const PAYEE_ID = 'a'.repeat(32)
  const PAYER_ID = 'b'.repeat(32)
  const DEVELOPER_ID = 'c'.repeat(32)
  const SQL_TRANSACTION_ID = 'd'.repeat(32)
  const PAYER_ACCOUNT_ID = 'e'.repeat(32)
  const PAYEE_ACCOUNT_ID = 'f'.repeat(32)

  const PAYMENT_ID = 'b'.repeat(32)

  beforeAll(() => {
    process.env.DATABASE = 'mock-database'
    process.env.SECRET_ARN = 'mock-secret-arn'
    process.env.CLUSTER_ARN = 'mock-cluster-arn'
    const mockDependencies = { genId: () => 'a'.repeat(32) }

    jest.spyOn(global, 'Date').mockImplementation(() => mockDate)

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    db = createDatabaseOperations(mockDependencies)

    jest.spyOn(global, 'Date').mockImplementation(() => mockDate)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('insertPayment', () => {
    describe('when the parameters are valid for card payment', () => {
      it('should call executeStatement with correct parameters', async () => {
        const params: InsertPaymentParams = {
          payeeId: PAYEE_ID,
          payerId: PAYER_ID,
          developerId: DEVELOPER_ID,
          amount: 100,
          interactionTypeId: 1,
          paymentMethod: PaymentMethod.Card,
          sqlTransactionId: SQL_TRANSACTION_ID
        }

        await db.insertPayment(params)

        const expected = {
          database: 'mock-database',
          secretArn: 'mock-secret-arn',
          resourceArn: 'mock-cluster-arn',
          transactionId: SQL_TRANSACTION_ID,
          sql: 'INSERT ...',
          parameters: [
            {
              name: 'paymentId',
              value: {
                blobValue: Buffer.from([
                  170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170,
                  170, 170, 170, 170
                ])
              }
            },
            {
              name: 'payerId',
              value: {
                blobValue: Buffer.from([
                  187, 187, 187, 187, 187, 187, 187, 187, 187, 187, 187, 187,
                  187, 187, 187, 187
                ])
              }
            },
            {
              name: 'payeeId',
              value: {
                blobValue: Buffer.from([
                  170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170,
                  170, 170, 170, 170
                ])
              }
            },
            {
              name: 'developerId',
              value: {
                blobValue: Buffer.from([
                  204, 204, 204, 204, 204, 204, 204, 204, 204, 204, 204, 204,
                  204, 204, 204, 204
                ])
              }
            },
            {
              name: 'paymentAmount',
              value: {
                doubleValue: 100
              }
            },
            {
              name: 'interactionTypeId',
              value: {
                doubleValue: 1
              }
            },
            {
              name: 'paymentMethod',
              value: {
                doubleValue: PaymentMethod.Card
              }
            },
            {
              name: 'paymentStatus',
              value: {
                doubleValue: PaymentStatus.COMPLETE
              }
            },
            {
              name: 'datePaid',
              value: {
                stringValue: formatDate(mockDate),
                isNull: false
              }
            }
          ]
        }
        expect(mockExecuteStatement).toHaveBeenCalledWith(expected)
      })
    })

    describe('when the parameters are valid for fednow payment', () => {
      it('should call executeStatement with correct parameters', async () => {
        const params: InsertPaymentParams = {
          payeeId: PAYEE_ID,
          payerId: PAYER_ID,
          developerId: DEVELOPER_ID,
          amount: 100,
          interactionTypeId: 1,
          paymentMethod: PaymentMethod.FedNow,
          sqlTransactionId: SQL_TRANSACTION_ID
        }

        await db.insertPayment(params)

        const expected = {
          database: 'mock-database',
          secretArn: 'mock-secret-arn',
          resourceArn: 'mock-cluster-arn',
          transactionId: SQL_TRANSACTION_ID,
          sql: 'INSERT ...',
          parameters: [
            {
              name: 'paymentId',
              value: {
                blobValue: Buffer.from([
                  170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170,
                  170, 170, 170, 170
                ])
              }
            },
            {
              name: 'payerId',
              value: {
                blobValue: Buffer.from([
                  187, 187, 187, 187, 187, 187, 187, 187, 187, 187, 187, 187,
                  187, 187, 187, 187
                ])
              }
            },
            {
              name: 'payeeId',
              value: {
                blobValue: Buffer.from([
                  170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170,
                  170, 170, 170, 170
                ])
              }
            },
            {
              name: 'developerId',
              value: {
                blobValue: Buffer.from([
                  204, 204, 204, 204, 204, 204, 204, 204, 204, 204, 204, 204,
                  204, 204, 204, 204
                ])
              }
            },
            {
              name: 'paymentAmount',
              value: {
                doubleValue: 100
              }
            },
            {
              name: 'interactionTypeId',
              value: {
                doubleValue: 1
              }
            },
            {
              name: 'paymentMethod',
              value: {
                doubleValue: PaymentMethod.FedNow
              }
            },
            {
              name: 'paymentStatus',
              value: {
                doubleValue: PaymentStatus.PENDING
              }
            },
            {
              name: 'datePaid',
              value: {
                stringValue: undefined,
                isNull: true
              }
            }
          ]
        }
        expect(mockExecuteStatement).toHaveBeenCalledWith(expected)
      })
    })
    describe('when parameters are invalid', () => {
      it('should throw an error if fields are of incorrect type', async () => {
        const params = {
          payerId: 'invalid',
          payeeId: 'invalid',
          developerId: 'invalid',
          amount: -1,
          interactionTypeId: 1,
          paymentMethod: 10,
          sqlTransactionId: 'invalid'
        }

        await expect(db.insertPayment(params)).rejects.toThrow(
          JSON.stringify(
            [
              {
                code: 'too_small',
                minimum: 32,
                type: 'string',
                inclusive: true,
                exact: true,
                message: 'String must contain exactly 32 character(s)',
                path: ['payerId']
              },
              {
                code: 'too_small',
                minimum: 32,
                type: 'string',
                inclusive: true,
                exact: true,
                message: 'String must contain exactly 32 character(s)',
                path: ['payeeId']
              },
              {
                code: 'too_small',
                minimum: 32,
                type: 'string',
                inclusive: true,
                exact: true,
                message: 'String must contain exactly 32 character(s)',
                path: ['developerId']
              },
              {
                code: 'too_small',
                minimum: 0,
                type: 'number',
                inclusive: true,
                exact: false,
                message: 'Number must be greater than or equal to 0',
                path: ['amount']
              },
              {
                received: 10,
                code: 'invalid_enum_value',
                options: [0, 1],
                path: ['paymentMethod'],
                message: "Invalid enum value. Expected 0 | 1, received '10'"
              },
              {
                code: 'too_small',
                minimum: 32,
                type: 'string',
                inclusive: true,
                exact: true,
                message: 'String must contain exactly 32 character(s)',
                path: ['sqlTransactionId']
              }
            ],
            null,
            2
          )
        )
      })

      // Additional test cases for other invalid scenarios
    })

    describe('when executeStatement throws an error', () => {
      it('should propagate the error', async () => {
        const params: InsertPaymentParams = {
          payeeId: PAYEE_ID,
          payerId: PAYER_ID,
          developerId: DEVELOPER_ID,
          amount: 100,
          interactionTypeId: 1,
          paymentMethod: PaymentMethod.Card,
          sqlTransactionId: SQL_TRANSACTION_ID
        }

        const errorMessage = 'Database operation failed'
        mockExecuteStatement.mockImplementationOnce(() => {
          throw new Error(errorMessage)
        })

        await expect(db.insertPayment(params)).rejects.toThrow(errorMessage)
      })
    })
  })

  describe('insertFedNowPayment', () => {
    describe('when the parameters are valid', () => {
      it('should call executeStatement with correct parameters', async () => {
        const params: InsertFedNowPaymentParams = {
          paymentId: PAYMENT_ID,
          payerAccountId: PAYER_ACCOUNT_ID,
          payeeAccountId: PAYEE_ACCOUNT_ID,
          sqlTransactionId: SQL_TRANSACTION_ID
        }

        await db.insertFedNowPayment(params)

        const expected = {
          database: 'mock-database',
          secretArn: 'mock-secret-arn',
          resourceArn: 'mock-cluster-arn',
          transactionId: SQL_TRANSACTION_ID,
          sql: 'INSERT ...', // Replace with the actual SQL query
          parameters: [
            {
              name: 'fedNowPaymentId',
              value: { blobValue: expect.any(Buffer) }
            },
            { name: 'paymentId', value: { blobValue: expect.any(Buffer) } },
            {
              name: 'payerAccountId',
              value: { stringValue: PAYER_ACCOUNT_ID }
            },
            {
              name: 'payeeAccountId',
              value: { stringValue: PAYEE_ACCOUNT_ID }
            }
          ]
        }
        expect(mockExecuteStatement).toHaveBeenCalledWith(expected)
      })
    })

    describe('when parameters are invalid', () => {
      it('should throw an error if fields are of incorrect type', async () => {
        const invalidParams = {
          paymentId: 'invalid-length',
          payerAccountId: 'invalid-length',
          payeeAccountId: 'invalid-length',
          sqlTransactionId: 'invalid-length'
        }

        await expect(db.insertFedNowPayment(invalidParams)).rejects.toThrow(
          JSON.stringify(
            [
              {
                code: 'too_small',
                minimum: 32,
                type: 'string',
                inclusive: true,
                exact: true,
                message: 'String must contain exactly 32 character(s)',
                path: ['paymentId']
              },
              {
                code: 'too_small',
                minimum: 32,
                type: 'string',
                inclusive: true,
                exact: true,
                message: 'String must contain exactly 32 character(s)',
                path: ['payerAccountId']
              },
              {
                code: 'too_small',
                minimum: 32,
                type: 'string',
                inclusive: true,
                exact: true,
                message: 'String must contain exactly 32 character(s)',
                path: ['payeeAccountId']
              },
              {
                code: 'too_small',
                minimum: 32,
                type: 'string',
                inclusive: true,
                exact: true,
                message: 'String must contain exactly 32 character(s)',
                path: ['sqlTransactionId']
              }
            ],
            null,
            2
          )
        )
      })
    })

    describe('when executeStatement throws an error', () => {
      it('should propagate the error', async () => {
        const params: InsertFedNowPaymentParams = {
          paymentId: PAYMENT_ID,
          payerAccountId: PAYER_ACCOUNT_ID,
          payeeAccountId: PAYEE_ACCOUNT_ID,
          sqlTransactionId: SQL_TRANSACTION_ID
        }

        const errorMessage = 'Database operation failed'
        mockExecuteStatement.mockImplementationOnce(() => {
          throw new Error(errorMessage)
        })

        await expect(db.insertFedNowPayment(params)).rejects.toThrow(
          errorMessage
        )
      })
    })
  })

  describe('insertLedgerEntry', () => {
    describe('when the parameters are valid', () => {
      it('should call executeStatement with correct parameters', async () => {
        const params: InsertLedgerEntryParams = {
          payerId: PAYER_ID,
          payeeId: PAYEE_ID,
          developerId: DEVELOPER_ID,
          amount: 100,
          interactionTypeId: 1,
          sqlTransactionId: SQL_TRANSACTION_ID
        }

        await db.insertLedgerEntry(params)

        const expected = {
          database: 'mock-database',
          secretArn: 'mock-secret-arn',
          resourceArn: 'mock-cluster-arn',
          transactionId: SQL_TRANSACTION_ID,
          sql: 'INSERT ...', // Replace with the actual SQL query
          parameters: [
            {
              name: 'ledgerId',
              value: {
                blobValue: Buffer.from([
                  170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170,
                  170, 170, 170, 170
                ])
              }
            },
            {
              name: 'payerId',
              value: {
                blobValue: Buffer.from([
                  187, 187, 187, 187, 187, 187, 187, 187, 187, 187, 187, 187,
                  187, 187, 187, 187
                ])
              }
            },
            {
              name: 'payeeId',
              value: {
                blobValue: Buffer.from([
                  170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170,
                  170, 170, 170, 170
                ])
              }
            },
            {
              name: 'amount',
              value: {
                doubleValue: 100
              }
            },
            {
              name: 'interactionTypeId',
              value: {
                doubleValue: 1
              }
            },
            {
              name: 'developerId',
              value: {
                blobValue: Buffer.from([
                  204, 204, 204, 204, 204, 204, 204, 204, 204, 204, 204, 204,
                  204, 204, 204, 204
                ])
              }
            }
          ]
        }
        expect(mockExecuteStatement).toHaveBeenCalledWith(expected)
      })
    })

    describe('when parameters are invalid', () => {
      it('should throw an error if fields are of incorrect type', async () => {
        const invalidParams = {
          payerId: 'invalid-length',
          payeeId: 'invalid-length',
          developerId: 'invalid-length',
          amount: -1,
          interactionTypeId: 1,
          sqlTransactionId: 'invalid-length'
        }

        await expect(db.insertLedgerEntry(invalidParams)).rejects.toThrow(
          JSON.stringify(
            [
              {
                code: 'too_small',
                minimum: 32,
                type: 'string',
                inclusive: true,
                exact: true,
                message: 'String must contain exactly 32 character(s)',
                path: ['payerId']
              },
              {
                code: 'too_small',
                minimum: 32,
                type: 'string',
                inclusive: true,
                exact: true,
                message: 'String must contain exactly 32 character(s)',
                path: ['payeeId']
              },
              {
                code: 'too_small',
                minimum: 32,
                type: 'string',
                inclusive: true,
                exact: true,
                message: 'String must contain exactly 32 character(s)',
                path: ['developerId']
              }
            ],
            null,
            2
          )
        )
      })
    })

    describe('when executeStatement throws an error', () => {
      it('should propagate the error', async () => {
        const params: InsertLedgerEntryParams = {
          payerId: PAYER_ID,
          payeeId: PAYEE_ID,
          developerId: DEVELOPER_ID,
          amount: 100,
          interactionTypeId: 1,
          sqlTransactionId: SQL_TRANSACTION_ID
        }

        const errorMessage = 'Database operation failed'
        mockExecuteStatement.mockImplementationOnce(() => {
          throw new Error(errorMessage)
        })

        await expect(db.insertLedgerEntry(params)).rejects.toThrow(
          errorMessage
        )
      })
    })
  })
  describe('insertPromotionLedgerEntry', () => {
    describe('when the parameters are valid', () => {
      it('should call executeStatement with correct parameters', async () => {
        const params: InsertPromotionLedgerEntryParams = {
          payerId: PAYER_ID,
          payeeId: PAYEE_ID,
          developerId: DEVELOPER_ID,
          interactionTypeId: 1,
          sqlTransactionId: SQL_TRANSACTION_ID,
          promoAmount: 10
        }

        await db.insertPromotionLedgerEntry(params)

        const expected = {
          database: 'mock-database',
          secretArn: 'mock-secret-arn',
          resourceArn: 'mock-cluster-arn',
          transactionId: SQL_TRANSACTION_ID,
          sql: 'INSERT ...', // Replace with the actual SQL query
          parameters: [
            {
              name: 'ledgerId',
              value: {
                blobValue: Buffer.from([
                  170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170,
                  170, 170, 170, 170
                ])
              }
            },
            {
              name: 'payerId',
              value: {
                blobValue: Buffer.from([
                  187, 187, 187, 187, 187, 187, 187, 187, 187, 187, 187, 187,
                  187, 187, 187, 187
                ])
              }
            },
            {
              name: 'payeeId',
              value: {
                blobValue: Buffer.from([
                  170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170,
                  170, 170, 170, 170
                ])
              }
            },
            {
              name: 'developerId',
              value: {
                blobValue: Buffer.from([
                  204, 204, 204, 204, 204, 204, 204, 204, 204, 204, 204, 204,
                  204, 204, 204, 204
                ])
              }
            },
            {
              name: 'amount',
              value: {
                doubleValue: 10
              }
            },
            {
              name: 'interactionTypeId',
              value: {
                doubleValue: 1
              }
            }
          ]
        }
        expect(mockExecuteStatement).toHaveBeenCalledWith(expected)
      })
    })

    describe('when parameters are invalid', () => {
      it('should throw an error if fields are of incorrect type', async () => {
        const params: InsertPromotionLedgerEntryParams = {
          payerId: 'invalid-length',
          payeeId: 'invalid-length',
          developerId: 'invalid-length',
          interactionTypeId: 1,
          sqlTransactionId: 'invalid-length',
          promoAmount: -1
        }

        await expect(db.insertPromotionLedgerEntry(params)).rejects.toThrow(
          JSON.stringify(
            [
              {
                code: 'too_small',
                minimum: 32,
                type: 'string',
                inclusive: true,
                exact: true,
                message: 'String must contain exactly 32 character(s)',
                path: ['developerId']
              },
              {
                code: 'too_small',
                minimum: 32,
                type: 'string',
                inclusive: true,
                exact: true,
                message: 'String must contain exactly 32 character(s)',
                path: ['payerId']
              },
              {
                code: 'too_small',
                minimum: 32,
                type: 'string',
                inclusive: true,
                exact: true,
                message: 'String must contain exactly 32 character(s)',
                path: ['payeeId']
              },
              {
                code: 'too_small',
                minimum: 0,
                type: 'number',
                inclusive: true,
                exact: false,
                message: 'Number must be greater than or equal to 0',
                path: ['promoAmount']
              },
              {
                code: 'too_small',
                minimum: 32,
                type: 'string',
                inclusive: true,
                exact: true,
                message: 'String must contain exactly 32 character(s)',
                path: ['sqlTransactionId']
              }
            ],
            null,
            2
          )
        )
      })
    })

    describe('when executeStatement throws an error', () => {
      it('should propagate the error', async () => {
        const params: InsertPromotionLedgerEntryParams = {
          payerId: PAYER_ID,
          payeeId: PAYEE_ID,
          developerId: DEVELOPER_ID,
          interactionTypeId: 1,
          sqlTransactionId: SQL_TRANSACTION_ID,
          promoAmount: 10
        }

        const errorMessage = 'Database operation failed'
        mockExecuteStatement.mockImplementationOnce(() => {
          throw new Error(errorMessage)
        })

        await expect(db.insertPromotionLedgerEntry(params)).rejects.toThrow(
          errorMessage
        )
      })
    })
  })

  describe('insertTransactionRecord', () => {
    describe('when the parameters are valid', () => {
      it('should call executeStatement with correct parameters', async () => {
        const params: InsertTransactionRecordParams = {
          ledgerEntries: ['a'.repeat(32), 'b'.repeat(32)],
          sqlTransactionId: SQL_TRANSACTION_ID
        }

        await db.insertTransactionRecord(params)

        const expected = {
          database: 'mock-database',
          secretArn: 'mock-secret-arn',
          resourceArn: 'mock-cluster-arn',
          transactionId: SQL_TRANSACTION_ID,
          sql: 'INSERT ...', // Replace with the actual SQL query
          parameterSets: [
            [
              {
                name: 'transactionId',
                value: {
                  blobValue: Buffer.from([
                    170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170,
                    170, 170, 170, 170
                  ])
                }
              },
              {
                name: 'ledgerId',
                value: {
                  blobValue: Buffer.from([
                    170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170,
                    170, 170, 170, 170
                  ])
                }
              }
            ],
            [
              {
                name: 'transactionId',
                value: {
                  blobValue: Buffer.from([
                    170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170,
                    170, 170, 170, 170
                  ])
                }
              },
              {
                name: 'ledgerId',
                value: {
                  blobValue: Buffer.from([
                    187, 187, 187, 187, 187, 187, 187, 187, 187, 187, 187, 187,
                    187, 187, 187, 187
                  ])
                }
              }
            ]
          ]
        }
        expect(mockBatchExecuteStatement).toHaveBeenCalledWith(expected)
      })
    })

    describe('when parameters are invalid', () => {
      it('should throw an error if fields are of incorrect type', async () => {
        const params: InsertPromotionLedgerEntryParams = {
          payerId: 'invalid-length',
          payeeId: 'invalid-length',
          developerId: 'invalid-length',
          interactionTypeId: 1,
          sqlTransactionId: 'invalid-length',
          promoAmount: -1
        }

        await expect(db.insertPromotionLedgerEntry(params)).rejects.toThrow(
          JSON.stringify(
            [
              {
                code: 'too_small',
                minimum: 32,
                type: 'string',
                inclusive: true,
                exact: true,
                message: 'String must contain exactly 32 character(s)',
                path: ['developerId']
              },
              {
                code: 'too_small',
                minimum: 32,
                type: 'string',
                inclusive: true,
                exact: true,
                message: 'String must contain exactly 32 character(s)',
                path: ['payerId']
              },
              {
                code: 'too_small',
                minimum: 32,
                type: 'string',
                inclusive: true,
                exact: true,
                message: 'String must contain exactly 32 character(s)',
                path: ['payeeId']
              },
              {
                code: 'too_small',
                minimum: 0,
                type: 'number',
                inclusive: true,
                exact: false,
                message: 'Number must be greater than or equal to 0',
                path: ['promoAmount']
              },
              {
                code: 'too_small',
                minimum: 32,
                type: 'string',
                inclusive: true,
                exact: true,
                message: 'String must contain exactly 32 character(s)',
                path: ['sqlTransactionId']
              }
            ],
            null,
            2
          )
        )
      })
    })

    describe('when executeStatement throws an error', () => {
      it('should propagate the error', async () => {
        const params: InsertTransactionRecordParams = {
          ledgerEntries: ['a'.repeat(32), 'b'.repeat(32)],
          sqlTransactionId: SQL_TRANSACTION_ID
        }

        const errorMessage = 'Database operation failed'
        mockBatchExecuteStatement.mockImplementationOnce(() => {
          throw new Error(errorMessage)
        })

        await expect(db.insertTransactionRecord(params)).rejects.toThrow(
          errorMessage
        )
      })
    })
  })
})
