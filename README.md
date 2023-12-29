# Code Refactor Exercise

## Requirements
Refactor a Node.js function named `executeStandardPTOperations` (PT stands for "Purs transaction"), and write unit tests for it. The function interacts with an RDS database to record transactions.

### Key Points:
- The original code was functional; unexpected bugs are a possibility.
- Undefined variables like `insertfedNowPaymentSQL` can be mocked or defined as needed.
- RDS calls should be mocked for local testing.
- Focus on enhancing readability, maintainability, testability, and understandability.
- Consider latency optimization.
- Refactoring can be done in Node.js, Golang, or any JS framework.
- Document assumptions clearly.
- Use any unit testing framework; aim for comprehensive test coverage.
- Unit tests should reflect significant logic changes.

## Assumptions
- **Language Flexibility**: TypeScript is an acceptable choice and type safety is a good thing™️
- **Runtime Environment**: The function will be executed in a Node.js environment.
- **Database Knowledge**: Specifics of the database schema are not crucial for this task. SQL commands are placeholders.
- **Transactional Context**: `executeStatement` and `batchExecuteStatement` are assumed to operate within a transaction managed externally.
- **Testing Focus**: Testing aims to validate the behavior of the `executeStandardPTOperations` function rather than its internal implementation details.

## Code
```javascript
const AWS = require('aws-sdk')
const RDS = new AWS.RDSDataService()

/**
 * creates everything necessary to record a transaction bundle in RDS database
 *
 * A PTB (Purs Transaction Bundle) is a bundle of database records that are created as part of a Purs Transaction.
 * A single Transaction may include a promotion, it may include a Payment, it may include a fedNowPayment, but it always includes at least one LedgerEntry
 * @param {Object} userPurchaseInformation
 * @param {string} userPurchaseInformation.payor the id of the entity paying
 * @param {string} userPurchaseInformation.payee the id of the entity getting paid
 * @param {string} userPurchaseInformation.payorBankAccountID the bank account id of the entity paying
 * @param {string} userPurchaseInformation.payeeBankAccountID the bank account id of the entity getting paid
 * @param {string} userPurchaseInformation.dev the id of the developer
 * @param {integer} userPurchaseInformation.amount the amount being paid
 * @param {integer} userPurchaseInformation.interactionType 0 is mobile
 * @param {integer} userPurchaseInformation.paymentMethod 0 is fedNow 1 is card
 *
 * @param {Object}  promotionInformation
 * @param {integer}  promotionInformation.promoAmount if there is a promotion put an amount here
 * @param {string} sqlTransactionID the id of the sql transaction
 * @returns an array with the ledger entry id and the payment id
 */
const executeStandardPTOperations = async (userPurchaseInformation, promotionInformation, sqlTransactionID) => {
  const {
    payor,
    payee,
    payorBankAccountID,
    payeeBankAccountID,
    dev,
    amount,
    interactionType,
    paymentMethod,
  } = userPurchaseInformation

  const { promoAmount } = promotionInformation

  const ledgeEntries = []
  const paymentID = generateRandomBinary(32)
  let ledgerEntryID = generateRandomBinary(32)

  const idObj = {
    primaryPaymentID: paymentID,
    customerLedgerEntryID: ledgerEntryID,
  }

  ledgeEntries.push(ledgerEntryID)

  const params = {
    database: process.env.DATABASE,
    secretArn: process.env.SECRET_ARN,
    resourceArn: process.env.CLUSTER_ARN,
    transactionId: sqlTransactionID,
  }

  params.parameters = [
    {
      name: 'payerId',
      value: {
        blobValue: Buffer.from(payor, 'hex'),
      },
    },
    {
      name: 'payeeId',
      value: {
        blobValue: Buffer.from(payee, 'hex'),
      },
    },
    {
      name: 'paymentAmount',
      value: {
        doubleValue: amount,
      },
    },
    {
      name: 'interactionTypeId',
      value: {
        doubleValue: interactionType,
      },
    },
    {
      name: 'paymentId',
      value: {
        blobValue: Buffer.from(paymentID, 'hex'),
      },
    },
    {
      name: 'datePaid',
      value: {
        stringValue: paymentMethod === 0 && amount > 0 ? null : new Date().toISOString().slice(0, 19).replace('T', ' '),
        isNull: paymentMethod === 0 && amount > 0,
      },
    },
    {
      name: 'ledgerId',
      value: {
        blobValue: Buffer.from(ledgerEntryID, 'hex'),
      },
    },
    {
      name: 'developerId',
      value: {
        blobValue: Buffer.from(dev, 'hex'),
      },
    },
    {
      name: 'paymentMethod',
      value: {
        doubleValue: paymentMethod,
      },
    },
    {
      name: 'paymentStatus',
      value: {
        // the status is set to "completed" if the payment is a card or if the amount is 0; otherwise the status is set to pending(ie. fedNow)
        doubleValue: paymentMethod !== 0 || amount === 0 ? 4 : 5,
      },
    },
  ]

  params.parameters = [...params.parameters]
  params.sql = insertPaymentSQL
  await RDS.executeStatement({ ...params }).promise()

  // this is an additional step for processing fedNow payments
  if (paymentMethod === 0 && amount > 0) {
    const fedNowPaymentID = generateRandomBinary(32)

    params.parameters = [...params.parameters]
    params.parameters.push(
      {
        name: 'fedNowPaymentId',
        value: {
          blobValue: Buffer.from(fedNowPaymentID, 'hex'),
        },
      },
      {
        name: 'payerAccountId',
        value: {
          stringValue: payorBankAccountID
        }
      },
      {
        name: 'payeeAccountId',
        value: {
          stringValue: payeeBankAccountID
        }
      }
    )

    params.sql = insertFedNowPaymentSQL
    await RDS.executeStatement({ ...params }).promise()

    idObj.primaryFedNowPaymentID = fedNowPaymentID
  }

  params.sql = insertLedgerEntrySQL
  await RDS.executeStatement({ ...params }).promise()

  if (promoAmount > 0) {
    ledgerEntryID = generateRandomBinary(32)
    ledgeEntries.push(ledgerEntryID)
    params.parameters = [
      {
        name: 'payerId',
        value: {
          blobValue: Buffer.from(dev, 'hex'),
        },
      },
      {
        name: 'payeeId',
        value: {
          blobValue: Buffer.from(payee, 'hex'),
        },
      },
      {
        name: 'amount',
        value: {
          doubleValue: promoAmount,
        },
      },
      {
        name: 'interactionTypeId',
        value: {
          doubleValue: interactionType,
        },
      },
      {
        name: 'ledgerId',
        value: {
          blobValue: Buffer.from(ledgerEntryID, 'hex'),
        },
      },
      {
        name: 'developerId',
        value: {
          blobValue: Buffer.from(dev, 'hex'),
        },
      },
    ]
    params.sql = insertPromoLedgerEntrySQL
    await RDS.executeStatement({ ...params }).promise()

    idObj.promotionLedgerEntryID = ledgerEntryID
  }

  const pursTransactionID = generateRandomBinary(32)

  params.parameterSets = ledgeEntries.map((pursPayment) => [{
    name: 'transactionId',
    value: {
      blobValue: Buffer.from(pursTransactionID, 'hex'),
    },
  }, {
    name: 'ledgerId',
    value: {
      blobValue: Buffer.from(pursPayment, 'hex'),
    },
  }])

  delete params.parameters
  params.sql = insertTransaction

  await RDS.batchExecuteStatement({ ...params }).promise()

  idObj.pursTransactionID = pursTransactionID

  return idObj
}
```
## Approach

### Typescript

The choice to use TypeScript for this refactoring task was driven by several key considerations, primarily around type safety and enhanced developer experience:

1. **Type Safety**: TypeScript's static type system is a major advantage, particularly for critical business logic like payment processing. This system allows for early detection of type-related errors during development, reducing the likelihood of runtime errors. It ensures that data structures are used correctly, parameters are passed with the right types, and return types are as expected.

2. **Improved Developer Experience**: TypeScript enhances the development experience by offering better tooling support, such as autocompletion, code navigation, and more informative error messages. This leads to increased productivity and a smoother development process.

3. **Code Readability and Maintainability**: TypeScript's explicit type annotations make the code more readable and easier to understand. This clarity is particularly beneficial for new developers or when returning to the code after a period. It aids in maintaining and scaling the application, as the purpose and structure of data are clear.

4. **Robustness in Business Logic**: For a payment processing system, ensuring data integrity and consistency is paramount. TypeScript's strict typing helps enforce these qualities in the code, making the business logic more robust and less prone to subtle bugs.

5. **Enhanced Refactoring Capabilities**: TypeScript’s static analysis tools make refactoring more reliable. When making changes, the developer receives immediate feedback if a change breaks the existing code, thus reducing the risk of introducing errors during the refactoring process.

6. **Integration with Modern Toolchains**: TypeScript integrates well with modern development toolchains and frameworks, making it a suitable choice for both backend and frontend development. This integration helps maintain consistency across different parts of the application.


### Separation of Concerns

The principle of Separation of Concerns (SoC) was a key focus in the refactoring of the `executeStandardPTOperations` function. This approach enhances code maintainability and scalability by dividing the software into distinct sections, each addressing a specific concern. Here are examples of how SoC was applied:

1. **Modular Structure**: 
   - **Example**: Database interactions were encapsulated in functions like `insertPayment` and `insertLedgerEntry`. Each function handles a specific aspect of the database interaction, making the main business logic more concise and focused.

1. **Database Interaction Abstraction**:
   - **Example**: The `DB` interface abstracts the details of executing SQL queries. Instead of constructing SQL queries in the business logic, the function calls `db.insertPayment(params)` with clearly defined parameters.

1. **Input Validation and Schemas**:
   - **Example**: Using Zod for schema validation, each input type (like `ExecuteStandardPTOperationsParams`) has a defined schema. This separates the validation logic from the main function, ensuring only valid data is processed.

1. **Configuration Management**:
   - **Example**: Environment variables (like `process.env.DATABASE`) are managed separately, allowing the main logic to operate independently of the deployment environment. This setup enables easy switches between different configurations without altering core logic.

1. **Testing**:
   - **Example**: Unit tests are written in separate files, focusing on testing individual components in isolation. For instance, the test for `insertPayment` mocks the database call and verifies the function's behavior without needing a real database.

1. **Type Definitions**:
   - **Example**: TypeScript types and interfaces, such as `ExecuteStandardPTOperationsParams` and `InsertPaymentParams`, are defined separately. These types ensure that functions receive and return data in the expected format, reducing runtime errors.

### Testability
In refactoring `executeStandardPTOperations`, significant emphasis was placed on enhancing the testability of the code. Testability refers to the ease with which software can be tested. Here are the key aspects that were considered to improve the testability:

1. **Modular Design**:
   - By breaking down the function into smaller, modular components, each piece of logic became more testable. Modular design allows for isolated testing of each component, leading to more effective and focused tests.

1. **Clear Input and Output**:
   - The function and its sub-components have well-defined inputs and outputs. This clarity makes it straightforward to write tests that verify whether each component is functioning as expected.

1. **Mocking External Dependencies**:
   - External dependencies, such as database connections, are abstracted and can be easily mocked in tests. This allows for testing the function's behavior without relying on external systems, leading to faster and more reliable tests.

1. **Error Handling Mechanisms**:
   - Robust error handling within the function allows for testing how the function behaves under various failure scenarios. This includes testing for expected exceptions and ensuring that errors are handled gracefully.

1. **Use of Pure Functions**:
   - Where possible, pure functions (functions that do not alter external state and return the same output for the same input) are used. These are inherently easier to test due to their predictable nature.

1. **Statelessness**:
   - The function is designed to be stateless, meaning it doesn't rely on or alter shared state. This makes it much simpler to test, as tests do not need to set up or clean up state before and after each test.

1. **Integration with Testing Frameworks**:
   - The code is structured to integrate seamlessly with popular testing frameworks and tools. This integration facilitates a range of testing capabilities, from unit tests to more complex integration tests.

1. **Documentation and Code Comments**:
   - Comprehensive documentation and comments within the code assist in understanding the intended behavior of each component, which is crucial for writing effective tests.

1. **Observability**:
   - The function includes mechanisms for logging and monitoring, which are valuable for testing in production-like environments. Observability aids in quickly identifying and diagnosing issues that might not be caught in pre-deployment testing.

1. **Configurable Behavior**:
    - The function is designed to allow certain behaviors to be configured (like database connections). This configurability is helpful in setting up different scenarios for testing.

### Readability
1. **Descriptive Naming**: 
   - **Example**: Variables and functions were renamed to be more descriptive. For instance, `payor` was changed to `payerId`, clearly indicating its purpose as an identifier for the payer.

1. **Function Decomposition**:
   - **Example**: Complex logic was broken down into smaller, more manageable functions. Each function performs a specific task, making the overall codebase easier to navigate and understand.

1. **Consistent Coding Standards**:
   - **Example**: The code follows a consistent coding style and formatting. This uniformity, achieved through tools like ESLint and Prettier, makes the code more approachable and less cluttered.

1. **Type Annotations in TypeScript**:
   - **Example**: TypeScript's type annotations provide additional context and documentation. For example, the `UserPurchaseInformation` interface explicitly defines the structure of user purchase data, making it clear what kind of data the function expects.

1. **Use of Comments**:
   - **Example**: Where necessary, comments are used to explain complex logic or decisions that aren't immediately obvious from the code alone. These comments help future maintainers understand the rationale behind certain code segments.

1. **Error Handling and Logging**:
   - **Example**: Clear error handling and logging mechanisms are in place. This practice not only makes the code more robust but also easier to debug, as it provides a clear trace of operations and potential issues.

1. **Code Organization**:
   - **Example**: The code is organized logically, with related functions and types grouped together. This organization makes it easier to find relevant sections of the code when making changes or troubleshooting.

1. **Documentation**:
   - **Example**: Key functions and interfaces are documented with Typedoc comments, providing a clear overview of their purpose, parameters, and return types. This documentation acts as a quick reference guide for developers.

1. **Simplification of Complex Logic**:
   - **Example**: Complex conditional statements and loops were simplified or broken down into smaller parts. This simplification makes the logic more straightforward and easier to follow.

1. **Emphasis on Code Clarity over Cleverness**:
    - **Example**: The code avoids overly clever or concise expressions that can be hard to read and understand. Instead, it opts for clarity, even if it means a few extra lines of code.

### Test Coverage
```shell
-------------|---------|----------|---------|---------|-------------------
File         | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------|---------|----------|---------|---------|-------------------
All files    |     100 |      100 |     100 |     100 |                   
 src         |     100 |      100 |     100 |     100 |                   
  helpers.ts |     100 |      100 |     100 |     100 |                   
  index.ts   |     100 |      100 |     100 |     100 |                   
  schemas.ts |     100 |      100 |     100 |     100 |                   
 src/db      |     100 |      100 |     100 |     100 |                   
  index.ts   |     100 |      100 |     100 |     100 |                   
  schemas.ts |     100 |      100 |     100 |     100 |                   
 src/types   |     100 |      100 |     100 |     100 |                   
  index.ts   |     100 |      100 |     100 |     100 |                   
-------------|---------|----------|---------|---------|-------------------
Test Suites: 3 passed, 3 total
Tests:       25 passed, 25 total
Snapshots:   0 total
Time:        4.699 s, estimated 5 s
```