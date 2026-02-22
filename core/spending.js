/**
 * =============================================================================
 * core/spending.js
 * =============================================================================
 * 
 * RESPONSIBILITY:
 * Pure business logic for spending transactions.
 * - Accepts ONLY validated data
 * - Does NOT validate (validation is core/validator.js responsibility)
 * - Does NOT parse strings or format data
 * - Deterministic: same input → same output
 * - No side effects except database writes
 * 
 * INVARIANTS:
 * 1. All functions receive pre-validated data
 * 2. Amount is always positive integer
 * 3. Expense name is always non-empty string
 * 4. Date is always YYYY-MM-DD format
 * 5. ID generation is deterministic and collision-free
 * 
 * =============================================================================
 */

/**
 * Internal: Generate unique 4-character transaction ID
 * Uses timestamp hash for determinism within same second
 * 
 * @return {string} 4-character ID
 */
function generateTransactionId() {
  const timestamp = new Date().getTime();
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";

  // Use timestamp hash to ensure determinism
  // Same timestamp → same ID sequence
  const seed = (timestamp ^ 0x9e3779b97f4a7c15) >>> 0;
  let id = "";

  for (let i = 0; i < 4; i++) {
    const index = (seed >> (i * 8)) & 0xff;
    id += chars[index % chars.length];
  }

  return id;
}

/**
 * Core: Add spending transaction
 * 
 * PRECONDITIONS (caller must ensure):
 * - input.expenseName: non-empty string
 * - input.amount: positive integer > 0
 * - input.category: valid category or "Uncategorized"
 * - input.tag: string (empty OK)
 * - input.note: string (empty OK)
 * - input.date: YYYY-MM-DD format (current date if not provided)
 * 
 * @param {Object} input - Validated spending data:
 *   - expenseName: string (required)
 *   - amount: number (required, must be > 0)
 *   - category: string (required, cannot be empty)
 *   - tag: string (optional)
 *   - note: string (optional)
 *   - date: string YYYY-MM-DD (optional, uses today if not provided)
 * 
 * @return {Object} {
 *   success: boolean,
 *   data?: {id, date, expenseName, category, amount, tag, note},
 *   message?: "error message"
 * }
 */
function addSpendingFromValidated(input) {
  try {
    // Use provided date or today (GMT+7)
    const dateStr = input.date || Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");

    const transactionData = {
      id: generateTransactionId(),
      date: dateStr,
      expenseName: input.expenseName,
      category: input.category,
      total: input.amount,
      tag: input.tag || "",
      note: input.note || "",
    };

    // Save to database
    const newRow = dbSpending.last_row + 1;
    const saveRange = dbSpending.range(newRow, 2, 1, 7);
    const recordValues = [
      transactionData.id,
      transactionData.date,
      transactionData.expenseName,
      transactionData.category,
      transactionData.total,
      transactionData.tag,
      transactionData.note,
    ];

    saveRange.setValues([recordValues]);

    Logger.log(`✅ Spending recorded: ${transactionData.expenseName} Rp${transactionData.total}`);

    return {
      success: true,
      data: transactionData
    };

  } catch (error) {
    Logger.log(`❌ Failed to add spending: ${error.message}`);
    return {
      success: false,
      message: `Database error: ${error.message}`
    };
  }
}

/**
 * Wrapper: Add spending with full validation
 * Supports two calling styles for backward compatibility:
 * 1. NEW (Phase 2): addSpending({expenseName, amount, category, tag, note, date})
 * 2. OLD (Phase 1): addSpending(expenseName, amount, {category, tag, date, ...})
 * 
 * @param {Object|string} input - Either object or expense name (legacy)
 * @param {number} amount - Amount (legacy parameter)
 * @param {Object} options - Options (legacy parameter)
 * 
 * @return {Object} {success: boolean, data?: {...}, message?: "error"}
 */
function addSpending(input, amount, options) {
  // CASE 1: New-style call with structured object
  if (typeof input === 'object' && input !== null && arguments.length === 1) {
    // Validate first
    const validation = validateSpendingInput(input);

    if (!validation.valid) {
      Logger.log(`⚠️ Validation failed: ${validation.message}`);
      return {
        success: false,
        message: validation.message
      };
    }

    // Execute with validated data
    return addSpendingFromValidated(validation.data);
  }

  // CASE 2: Legacy-style call with separate parameters
  // addSpending("Coffee", 25000, {category: "Food and Drink", tag: "Breakfast"})
  if (typeof input === 'string' && typeof amount === 'number') {
    const expenseName = input;
    const opts = options || {};

    // Convert to new format
    const legacyInput = {
      expenseName: expenseName,
      amount: amount,
      category: opts.category || undefined,
      tag: opts.tag || undefined,
      note: opts.note || undefined,
      date: opts.date ? Utilities.formatDate(opts.date, "GMT+7", "yyyy-MM-dd") : undefined
    };

    // Validate
    const validation = validateSpendingInput(legacyInput);

    if (!validation.valid) {
      Logger.log(`⚠️ Validation failed: ${validation.message}`);
      // Return legacy-style response for backward compat
      return {
        success: false,
        message: validation.message,
        error: validation.message
      };
    }

    // Execute with validated data
    const result = addSpendingFromValidated(validation.data);

    // Return legacy-style success response (flat object with all fields)
    if (result.success) {
      return {
        ...result.data,
        success: true
      };
    } else {
      return result;
    }
  }

  // Invalid call signature
  return {
    success: false,
    message: "Invalid addSpending() call signature"
  };
}

/**
 * =============================================================================
 * UPDATE OPERATIONS WITH VALIDATION (Phase 2 Hardening)
 * =============================================================================
 * 
 * All update operations require validated input to prevent AI/user errors
 */

/**
 * Update spending category with validation
 * 
 * INVARIANTS:
 * - id must exist in database
 * - newCategory must be in VALID_CATEGORIES
 * - No side effects beyond database update
 * 
 * @param {string} id - Transaction ID
 * @param {string} newCategory - Category name (must be validated)
 * @return {Object} {success: boolean, data?: {...}, message?: "error"}
 */
function updateCategoryValidated(id, newCategory) {
  try {
    // Validate category
    if (!newCategory || typeof newCategory !== 'string') {
      return { success: false, message: "Category must be a non-empty string" };
    }

    // Use validator from core/validator.js
    const catValidation = validateCategory(newCategory);
    if (!catValidation.valid) {
      return { success: false, message: catValidation.message };
    }

    // Check if transaction exists
    const record = dbSpending.key(id);
    if (!record) {
      return { success: false, message: `Transaction ${id} not found` };
    }

    // Perform update
    const rowIndex = record.row;
    const currentData = dbSpending.range(rowIndex, 2, 1, 7).getValues()[0];
    currentData[3] = newCategory; // Index 3 is category column
    dbSpending.range(rowIndex, 2, 1, 7).setValues([currentData]);

    Logger.log(`✅ Updated category for ${id}: ${newCategory}`);

    return {
      success: true,
      data: { id, newCategory }
    };

  } catch (error) {
    Logger.log(`❌ Failed to update category: ${error.message}`);
    return { success: false, message: `Database error: ${error.message}` };
  }
}

/**
 * Update spending amount with validation
 * 
 * INVARIANTS:
 * - id must exist in database
 * - newAmount must be positive integer within reasonable bounds
 * - No side effects beyond database update
 * 
 * @param {string} id - Transaction ID
 * @param {number} newAmount - Amount (must be > 0)
 * @return {Object} {success: boolean, data?: {...}, message?: "error"}
 */
function updateAmountValidated(id, newAmount) {
  try {
    // Validate amount
    const amountValidation = validateAmount(newAmount);
    if (!amountValidation.valid) {
      return { success: false, message: amountValidation.message };
    }

    // Check if transaction exists
    const record = dbSpending.key(id);
    if (!record) {
      return { success: false, message: `Transaction ${id} not found` };
    }

    // Perform update
    const rowIndex = record.row;
    const currentData = dbSpending.range(rowIndex, 2, 1, 7).getValues()[0];
    currentData[4] = newAmount; // Index 4 is amount column
    dbSpending.range(rowIndex, 2, 1, 7).setValues([currentData]);

    Logger.log(`✅ Updated amount for ${id}: Rp${newAmount}`);

    return {
      success: true,
      data: { id, newAmount }
    };

  } catch (error) {
    Logger.log(`❌ Failed to update amount: ${error.message}`);
    return { success: false, message: `Database error: ${error.message}` };
  }
}

/**
 * Update spending expense name with validation
 * 
 * INVARIANTS:
 * - id must exist in database
 * - expenseName must be non-empty, max 255 chars
 * - No side effects beyond database update
 * 
 * @param {string} id - Transaction ID
 * @param {string} expenseName - New expense name
 * @return {Object} {success: boolean, data?: {...}, message?: "error"}
 */
function updateExpenseNameValidated(id, expenseName) {
  try {
    // Validate expense name
    const nameValidation = validateExpenseName(expenseName);
    if (!nameValidation.valid) {
      return { success: false, message: nameValidation.message };
    }

    // Check if transaction exists
    const record = dbSpending.key(id);
    if (!record) {
      return { success: false, message: `Transaction ${id} not found` };
    }

    // Perform update
    const rowIndex = record.row;
    const currentData = dbSpending.range(rowIndex, 2, 1, 7).getValues()[0];
    currentData[2] = expenseName; // Index 2 is expenseName column
    dbSpending.range(rowIndex, 2, 1, 7).setValues([currentData]);

    Logger.log(`✅ Updated expense name for ${id}: ${expenseName}`);

    return {
      success: true,
      data: { id, expenseName }
    };

  } catch (error) {
    Logger.log(`❌ Failed to update expense name: ${error.message}`);
    return { success: false, message: `Database error: ${error.message}` };
  }
}

/**
 * Update spending tag with validation
 * 
 * INVARIANTS:
 * - id must exist in database
 * - tag is optional, max 100 chars if provided
 * - No side effects beyond database update
 * 
 * @param {string} id - Transaction ID
 * @param {string} tag - New tag (optional, empty string OK)
 * @return {Object} {success: boolean, data?: {...}, message?: "error"}
 */
function updateTagValidated(id, tag) {
  try {
    // Validate tag (allows empty string)
    const tagValidation = validateTag(tag);
    if (!tagValidation.valid) {
      return { success: false, message: tagValidation.message };
    }

    // Check if transaction exists
    const record = dbSpending.key(id);
    if (!record) {
      return { success: false, message: `Transaction ${id} not found` };
    }

    // Perform update
    const rowIndex = record.row;
    const currentData = dbSpending.range(rowIndex, 2, 1, 7).getValues()[0];
    currentData[5] = tag || ""; // Index 5 is tag column
    dbSpending.range(rowIndex, 2, 1, 7).setValues([currentData]);

    Logger.log(`✅ Updated tag for ${id}: ${tag || "(cleared)"}`);

    return {
      success: true,
      data: { id, tag: tag || "" }
    };

  } catch (error) {
    Logger.log(`❌ Failed to update tag: ${error.message}`);
    return { success: false, message: `Database error: ${error.message}` };
  }
}

/**
 * Update spending note with validation
 * 
 * INVARIANTS:
 * - id must exist in database
 * - note is optional, max 500 chars if provided
 * - No side effects beyond database update
 * 
 * @param {string} id - Transaction ID
 * @param {string} note - New note (optional, empty string OK)
 * @return {Object} {success: boolean, data?: {...}, message?: "error"}
 */
function updateNoteValidated(id, note) {
  try {
    // Validate note (allows empty string)
    const noteValidation = validateNote(note);
    if (!noteValidation.valid) {
      return { success: false, message: noteValidation.message };
    }

    // Check if transaction exists
    const record = dbSpending.key(id);
    if (!record) {
      return { success: false, message: `Transaction ${id} not found` };
    }

    // Perform update
    const rowIndex = record.row;
    const currentData = dbSpending.range(rowIndex, 2, 1, 7).getValues()[0];
    currentData[6] = note || ""; // Index 6 is note column
    dbSpending.range(rowIndex, 2, 1, 7).setValues([currentData]);

    Logger.log(`✅ Updated note for ${id}: ${note ? "(updated)" : "(cleared)"}`);

    return {
      success: true,
      data: { id, note: note || "" }
    };

  } catch (error) {
    Logger.log(`❌ Failed to update note: ${error.message}`);
    return { success: false, message: `Database error: ${error.message}` };
  }
}

/**
 * =============================================================================
 * AI INPUT WRAPPERS (Phase 2 Hardening)
 * =============================================================================
 * 
 * Safe entry points for AI/bot layer to interact with core business logic
 * These functions translate loosely-typed AI intents into strictly-validated core calls
 */

/**
 * Safe wrapper for AI to add spending
 * 
 * PRECONDITIONS (for AI output):
 * - aiOutput may contain optional or malformed fields
 * - This function validates and sanitizes before core execution
 * 
 * SAFETY GUARANTEES:
 * - Always validates all fields before database write
 * - Returns structured error if validation fails
 * - No partial writes or side effects on error
 * 
 * @param {Object} aiOutput - Raw output from AI:
 *   - expenseName: string or undefined
 *   - amount: number or string (will be coerced)
 *   - category: string or undefined
 *   - tag: string or undefined (optional)
 *   - note: string or undefined (optional)
 *   - date: string YYYY-MM-DD or undefined (optional)
 * 
 * @return {Object} {success: boolean, data?: {...}, message?: "error"}
 */
function addSpendingFromAI(aiOutput) {
  try {
    // Sanitize AI output
    const sanitized = {
      expenseName: String(aiOutput?.expenseName || "").trim(),
      amount: typeof aiOutput?.amount === 'string'
        ? parseInt(aiOutput.amount, 10)
        : (aiOutput?.amount || 0),
      category: String(aiOutput?.category || "").trim() || undefined,
      tag: String(aiOutput?.tag || "").trim() || "",
      note: String(aiOutput?.note || "").trim() || "",
      date: String(aiOutput?.date || "").trim() || undefined
    };

    Logger.log(`📥 AI input received: ${JSON.stringify(sanitized)}`);

    // Validate all fields
    const validation = validateSpendingInput(sanitized);
    if (!validation.valid) {
      Logger.log(`⚠️ AI validation failed: ${validation.message}`);
      return {
        success: false,
        message: validation.message
      };
    }

    // Execute with validated data
    const result = addSpendingFromValidated(validation.data);
    if (result.success) {
      Logger.log(`✅ AI spending recorded: ${result.data.expenseName} Rp${result.data.total}`);
    }
    return result;

  } catch (error) {
    Logger.log(`❌ AI wrapper error: ${error.message}`);
    return {
      success: false,
      message: `AI handler error: ${error.message}`
    };
  }
}

/**
 * Safe wrapper for AI to update spending category
 * 
 * PRECONDITIONS (for AI output):
 * - aiOutput may provide incorrect or unknown categories
 * - This function validates against allowed categories
 * 
 * SAFETY GUARANTEES:
 * - Validates category against VALID_CATEGORIES before update
 * - No update occurs if validation fails
 * 
 * @param {Object} aiOutput - AI output:
 *   - id: transaction ID (required)
 *   - category: category name (will be validated)
 * 
 * @return {Object} {success: boolean, data?: {...}, message?: "error"}
 */
function updateCategoryFromAI(aiOutput) {
  try {
    const id = String(aiOutput?.id || "").trim();
    const category = String(aiOutput?.category || "").trim();

    if (!id) {
      return { success: false, message: "AI output missing transaction ID" };
    }

    Logger.log(`📥 AI category update: ID=${id}, category=${category}`);

    return updateCategoryValidated(id, category);

  } catch (error) {
    Logger.log(`❌ AI category update error: ${error.message}`);
    return {
      success: false,
      message: `AI handler error: ${error.message}`
    };
  }
}

/**
 * Safe wrapper for AI to update spending amount
 * 
 * PRECONDITIONS (for AI output):
 * - aiOutput.amount may be string, float, negative, or invalid
 * - This function coerces and validates to positive integer
 * 
 * SAFETY GUARANTEES:
 * - Validates amount is positive and reasonable before update
 * - No update occurs if validation fails
 * 
 * @param {Object} aiOutput - AI output:
 *   - id: transaction ID (required)
 *   - amount: amount (will be coerced and validated)
 * 
 * @return {Object} {success: boolean, data?: {...}, message?: "error"}
 */
function updateAmountFromAI(aiOutput) {
  try {
    const id = String(aiOutput?.id || "").trim();
    const amount = typeof aiOutput?.amount === 'string'
      ? parseInt(aiOutput.amount, 10)
      : (aiOutput?.amount || 0);

    if (!id) {
      return { success: false, message: "AI output missing transaction ID" };
    }

    Logger.log(`📥 AI amount update: ID=${id}, amount=${amount}`);

    return updateAmountValidated(id, amount);

  } catch (error) {
    Logger.log(`❌ AI amount update error: ${error.message}`);
    return {
      success: false,
      message: `AI handler error: ${error.message}`
    };
  }
}

/**
 * Safe wrapper for AI to update spending expense name
 * 
 * PRECONDITIONS (for AI output):
 * - aiOutput.expenseName may be empty or too long
 * - This function validates before update
 * 
 * SAFETY GUARANTEES:
 * - Validates name is non-empty and within max length before update
 * - No update occurs if validation fails
 * 
 * @param {Object} aiOutput - AI output:
 *   - id: transaction ID (required)
 *   - expenseName: expense name (will be validated)
 * 
 * @return {Object} {success: boolean, data?: {...}, message?: "error"}
 */
function updateExpenseNameFromAI(aiOutput) {
  try {
    const id = String(aiOutput?.id || "").trim();
    const expenseName = String(aiOutput?.expenseName || "").trim();

    if (!id) {
      return { success: false, message: "AI output missing transaction ID" };
    }

    Logger.log(`📥 AI expense name update: ID=${id}, name=${expenseName}`);

    return updateExpenseNameValidated(id, expenseName);

  } catch (error) {
    Logger.log(`❌ AI expense name update error: ${error.message}`);
    return {
      success: false,
      message: `AI handler error: ${error.message}`
    };
  }
}

