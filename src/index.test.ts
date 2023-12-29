import factory from '.'
import {
  PaymentMethod,
  type UserPurchaseInformation,
  type PromotionInformation
} from './types'
import { type DB } from './db/types'

// Constants for test data
const constants = {
  PAYEE_ID: 'a'.repeat(32),
  PAYER_ID: 'b'.repeat(32),
  DEVELOPER_ID: 'c'.repeat(32),
  SQL_TRANSACTION_ID: 'd'.repeat(32),
  PAYER_ACCOUNT_ID: 'e'.repeat(32),
  PAYEE_ACCOUNT_ID: 'f'.repeat(32),
  PAYMENT_ID: 'g'.repeat(32),
  FED_NOW_PAYMENT_ID: 'h'.repeat(32),
  LEDGER_ENTRY_ID: 'i'.repeat(32),
  PROMOTION_LEDGER_ENTRY_ID: 'j'.repeat(32),
  TRANSACTION_RECORD_ID: 'k'.repeat(32)
}

describe('executeStandardPTOperations', () => {
  let db: DB
  let executeStandardPTOperations: ReturnType<typeof factory>

  beforeEach(() => {
    db = {
      insertPayment: jest.fn(async () => constants.PAYMENT_ID),
      insertFedNowPayment: jest.fn(async () => constants.FED_NOW_PAYMENT_ID),
      insertLedgerEntry: jest.fn(async () => constants.LEDGER_ENTRY_ID),
      insertPromotionLedgerEntry: jest.fn(
        async () => constants.PROMOTION_LEDGER_ENTRY_ID
      ),
      insertTransactionRecord: jest.fn(
        async () => constants.TRANSACTION_RECORD_ID
      )
    }
    executeStandardPTOperations = factory({ db })
  })

  const userPurchaseInformation: UserPurchaseInformation = {
    payerId: constants.PAYER_ID,
    payeeId: constants.PAYEE_ID,
    developerId: constants.DEVELOPER_ID,
    amount: 100,
    interactionTypeId: 1,
    paymentMethod: PaymentMethod.Card
  }

  const promotionInformation: PromotionInformation = { promoAmount: 10 }

  // Testing standard payment processing
  describe('Standard Payment Processing', () => {
    let standardUserPurchaseInformation: UserPurchaseInformation

    beforeEach(() => {
      standardUserPurchaseInformation = {
        ...userPurchaseInformation,
        paymentMethod: PaymentMethod.Card
      }
    })

    it('should handle standard payment without promotion', async () => {
      const idObj = await executeStandardPTOperations({
        userPurchaseInformation: standardUserPurchaseInformation,
        promotionInformation: {},
        sqlTransactionId: constants.SQL_TRANSACTION_ID
      })

      // Assertions
      expect(idObj).toEqual({
        primaryPaymentID: constants.PAYMENT_ID,
        customerLedgerEntryID: constants.LEDGER_ENTRY_ID,
        pursTransactionID: constants.TRANSACTION_RECORD_ID
      })
      expect(db.insertPayment).toHaveBeenCalledWith({
        payerId: constants.PAYER_ID,
        payeeId: constants.PAYEE_ID,
        developerId: constants.DEVELOPER_ID,
        amount: 100,
        interactionTypeId: 1,
        paymentMethod: PaymentMethod.Card,
        sqlTransactionId: constants.SQL_TRANSACTION_ID
      })
      expect(db.insertLedgerEntry).toHaveBeenCalledWith({
        payerId: constants.PAYER_ID,
        payeeId: constants.PAYEE_ID,
        developerId: constants.DEVELOPER_ID,
        amount: 100,
        interactionTypeId: 1,
        sqlTransactionId: constants.SQL_TRANSACTION_ID
      })
      expect(db.insertTransactionRecord).toHaveBeenCalledWith({
        ledgerEntries: [constants.LEDGER_ENTRY_ID],
        sqlTransactionId: constants.SQL_TRANSACTION_ID
      })
      expect(db.insertPromotionLedgerEntry).not.toHaveBeenCalled()
    })

    it('should handle standard payment with promotion', async () => {
      const idObj = await executeStandardPTOperations({
        userPurchaseInformation: standardUserPurchaseInformation,
        promotionInformation,
        sqlTransactionId: constants.SQL_TRANSACTION_ID
      })

      // Assertions
      expect(idObj).toEqual({
        primaryPaymentID: constants.PAYMENT_ID,
        customerLedgerEntryID: constants.LEDGER_ENTRY_ID,
        promotionLedgerEntryID: constants.PROMOTION_LEDGER_ENTRY_ID,
        pursTransactionID: constants.TRANSACTION_RECORD_ID
      })
      expect(db.insertPayment).toHaveBeenCalledWith({
        payerId: constants.PAYER_ID,
        payeeId: constants.PAYEE_ID,
        developerId: constants.DEVELOPER_ID,
        amount: 100,
        interactionTypeId: 1,
        paymentMethod: PaymentMethod.Card,
        sqlTransactionId: constants.SQL_TRANSACTION_ID
      })
      expect(db.insertLedgerEntry).toHaveBeenCalledWith({
        payerId: constants.PAYER_ID,
        payeeId: constants.PAYEE_ID,
        developerId: constants.DEVELOPER_ID,
        amount: 100,
        interactionTypeId: 1,
        sqlTransactionId: constants.SQL_TRANSACTION_ID
      })
      expect(db.insertPromotionLedgerEntry).toHaveBeenCalledWith({
        developerId: constants.DEVELOPER_ID,
        payeeId: constants.PAYEE_ID,
        payerId: constants.PAYER_ID,
        promoAmount: promotionInformation.promoAmount,
        interactionTypeId: 1,
        sqlTransactionId: constants.SQL_TRANSACTION_ID
      })
      expect(db.insertTransactionRecord).toHaveBeenCalledWith({
        ledgerEntries: [
          constants.LEDGER_ENTRY_ID,
          constants.PROMOTION_LEDGER_ENTRY_ID
        ],
        sqlTransactionId: constants.SQL_TRANSACTION_ID
      })
    })
  })

  // Testing invalid parameter scenarios
  describe('Invalid Parameter Handling', () => {
    it('should throw an error with invalid UserPurchaseInformation', async () => {
      const invalidUserPurchaseInformation = {
        payerId: 'invalid',
        payeeId: 'invalid',
        developerId: 'invalid',
        amount: -1,
        interactionTypeId: 1,
        paymentMethod: PaymentMethod.Card
      }

      await expect(
        executeStandardPTOperations({
          userPurchaseInformation: invalidUserPurchaseInformation,
          promotionInformation: {},
          sqlTransactionId: constants.SQL_TRANSACTION_ID
        })
      ).rejects.toThrow(
        JSON.stringify(
          [
            {
              code: 'too_small',
              minimum: 32,
              type: 'string',
              inclusive: true,
              exact: true,
              message: 'String must contain exactly 32 character(s)',
              path: ['userPurchaseInformation', 'payeeId']
            },
            {
              code: 'too_small',
              minimum: 32,
              type: 'string',
              inclusive: true,
              exact: true,
              message: 'String must contain exactly 32 character(s)',
              path: ['userPurchaseInformation', 'payerId']
            },
            {
              code: 'too_small',
              minimum: 32,
              type: 'string',
              inclusive: true,
              exact: true,
              message: 'String must contain exactly 32 character(s)',
              path: ['userPurchaseInformation', 'developerId']
            },
            {
              code: 'too_small',
              minimum: 0,
              type: 'number',
              inclusive: true,
              exact: false,
              message: 'Number must be greater than or equal to 0',
              path: ['userPurchaseInformation', 'amount']
            }
          ],
          null,
          2
        )
      )
    })
  })

  // Testing FedNow payment processing
  describe('FedNow Payment Processing', () => {
    let fedNowUserPurchaseInformation: UserPurchaseInformation

    beforeEach(() => {
      fedNowUserPurchaseInformation = {
        ...userPurchaseInformation,
        paymentMethod: PaymentMethod.FedNow,
        payerAccountId: constants.PAYER_ACCOUNT_ID,
        payeeAccountId: constants.PAYEE_ACCOUNT_ID
      }
    })

    it('should handle FedNow payment without promotion', async () => {
      const idObj = await executeStandardPTOperations({
        userPurchaseInformation: fedNowUserPurchaseInformation,
        promotionInformation: {},
        sqlTransactionId: constants.SQL_TRANSACTION_ID
      })

      // Assertions for FedNow payment without promotion
      expect(idObj).toEqual({
        primaryPaymentID: constants.PAYMENT_ID,
        primaryFedNowPaymentID: constants.FED_NOW_PAYMENT_ID,
        customerLedgerEntryID: constants.LEDGER_ENTRY_ID,
        pursTransactionID: constants.TRANSACTION_RECORD_ID
      })
      expect(db.insertPayment).toHaveBeenCalledWith({
        amount: 100,
        developerId: constants.DEVELOPER_ID,
        interactionTypeId: 1,
        payeeId: constants.PAYEE_ID,
        payerId: constants.PAYER_ID,
        paymentMethod: PaymentMethod.FedNow,
        sqlTransactionId: constants.SQL_TRANSACTION_ID
      })
      expect(db.insertFedNowPayment).toHaveBeenCalledWith({
        paymentId: constants.PAYMENT_ID,
        payerAccountId: constants.PAYER_ACCOUNT_ID,
        payeeAccountId: constants.PAYEE_ACCOUNT_ID,
        sqlTransactionId: constants.SQL_TRANSACTION_ID
      })
      expect(db.insertLedgerEntry).toHaveBeenCalledWith({
        amount: 100,
        developerId: constants.DEVELOPER_ID,
        interactionTypeId: 1,
        payeeId: constants.PAYEE_ID,
        payerId: constants.PAYER_ID,
        sqlTransactionId: constants.SQL_TRANSACTION_ID
      })
      expect(db.insertTransactionRecord).toHaveBeenCalledWith({
        ledgerEntries: [constants.LEDGER_ENTRY_ID],
        sqlTransactionId: constants.SQL_TRANSACTION_ID
      })
      expect(db.insertPromotionLedgerEntry).not.toHaveBeenCalled()
    })

    it('should handle FedNow payment with promotion', async () => {
      const idObj = await executeStandardPTOperations({
        userPurchaseInformation: fedNowUserPurchaseInformation,
        promotionInformation,
        sqlTransactionId: constants.SQL_TRANSACTION_ID
      })

      // Assertions for FedNow payment with promotion
      expect(idObj).toEqual({
        primaryPaymentID: constants.PAYMENT_ID,
        primaryFedNowPaymentID: constants.FED_NOW_PAYMENT_ID,
        customerLedgerEntryID: constants.LEDGER_ENTRY_ID,
        promotionLedgerEntryID: constants.PROMOTION_LEDGER_ENTRY_ID,
        pursTransactionID: constants.TRANSACTION_RECORD_ID
      })
      expect(db.insertPayment).toHaveBeenCalledWith({
        amount: 100,
        developerId: constants.DEVELOPER_ID,
        interactionTypeId: 1,
        payeeId: constants.PAYEE_ID,
        payerId: constants.PAYER_ID,
        paymentMethod: PaymentMethod.FedNow,
        sqlTransactionId: constants.SQL_TRANSACTION_ID
      })
      expect(db.insertFedNowPayment).toHaveBeenCalledWith({
        paymentId: constants.PAYMENT_ID,
        payerAccountId: constants.PAYER_ACCOUNT_ID,
        payeeAccountId: constants.PAYEE_ACCOUNT_ID,
        sqlTransactionId: constants.SQL_TRANSACTION_ID
      })
      expect(db.insertLedgerEntry).toHaveBeenCalledWith({
        amount: 100,
        developerId: constants.DEVELOPER_ID,
        interactionTypeId: 1,
        payeeId: constants.PAYEE_ID,
        payerId: constants.PAYER_ID,
        sqlTransactionId: constants.SQL_TRANSACTION_ID
      })
      expect(db.insertPromotionLedgerEntry).toHaveBeenCalledWith({
        developerId: constants.DEVELOPER_ID,
        payeeId: constants.PAYEE_ID,
        payerId: constants.PAYER_ID,
        promoAmount: promotionInformation.promoAmount,
        interactionTypeId: 1,
        sqlTransactionId: constants.SQL_TRANSACTION_ID
      })
      expect(db.insertTransactionRecord).toHaveBeenCalledWith({
        ledgerEntries: [
          constants.LEDGER_ENTRY_ID,
          constants.PROMOTION_LEDGER_ENTRY_ID
        ],
        sqlTransactionId: constants.SQL_TRANSACTION_ID
      })
    })
  })
})
