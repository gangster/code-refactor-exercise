import { ExecuteStandardPTOperationsParamsSchema } from './schemas'
import type { DB } from './db/types'

import {
  type IdObject, PaymentMethod,
  type ExecuteStandardPTOperationsParams
} from './types'

// Dependencies required for executing standard PT operations.
interface Dependencies {
  db: DB
}

/**
 * Executes standard payment transaction operations.
 * @param {Dependencies} dependencies - The database dependencies required for the operation.
 * @returns A function that takes `ExecuteStandardPTOperationsParams` and returns a promise that resolves to an `IdObject`.
 */
export default ({
  db: {
    insertPayment,
    insertFedNowPayment,
    insertLedgerEntry,
    insertPromotionLedgerEntry,
    insertTransactionRecord
  }
}: Dependencies) =>
  async (params: ExecuteStandardPTOperationsParams) => {
    ExecuteStandardPTOperationsParamsSchema.parse(params)
    const {
      userPurchaseInformation: {
        payeeId,
        payerId,
        payerAccountId,
        payeeAccountId,
        developerId,
        amount,
        interactionTypeId,
        paymentMethod
      },
      promotionInformation: { promoAmount },
      sqlTransactionId
    } = params

    const ledgerEntries: string[] = []

    // Initialize the ID object to store various transaction IDs.
    const idObj: IdObject = {
      primaryPaymentID: null,
      customerLedgerEntryID: null,
      pursTransactionID: null // To be set after transaction record insertion.
    }

    // Insert a payment record and update the ID object.
    const paymentId = await insertPayment({
      payerId,
      payeeId,
      developerId,
      amount,
      interactionTypeId,
      paymentMethod,
      sqlTransactionId
    })
    idObj.primaryPaymentID = paymentId

    // Handle FedNow payment method.
    if (
      paymentMethod === PaymentMethod.FedNow &&
      amount > 0 &&
      (payerAccountId != null) &&
      (payeeAccountId != null)
    ) {
      const fedNowPaymentId = await insertFedNowPayment({
        paymentId,
        payerAccountId,
        payeeAccountId,
        sqlTransactionId
      })
      idObj.primaryFedNowPaymentID = fedNowPaymentId
    }

    // Insert a ledger entry and update the ID object.
    const ledgerId = await insertLedgerEntry({
      payerId,
      payeeId,
      developerId,
      amount,
      interactionTypeId,
      sqlTransactionId
    })
    idObj.customerLedgerEntryID = ledgerId
    ledgerEntries.push(ledgerId)

    // Handle promotion ledger entry if a promo amount is present.
    if ((promoAmount != null) && promoAmount > 0) {
      const promotionLedgerId = await insertPromotionLedgerEntry({
        developerId,
        payeeId,
        payerId,
        promoAmount,
        interactionTypeId,
        sqlTransactionId
      })
      ledgerEntries.push(promotionLedgerId)
      idObj.promotionLedgerEntryID = promotionLedgerId
    }

    // Insert a transaction record and finalize the ID object.
    const pursTransactionId = await insertTransactionRecord({
      ledgerEntries: ledgerEntries as [string, ...string[]],
      sqlTransactionId
    })
    idObj.pursTransactionID = pursTransactionId

    return idObj
  }
