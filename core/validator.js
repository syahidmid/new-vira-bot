/**
 * =============================================================================
 * core/validator.js
 * =============================================================================
 * 
 * RESPONSIBILITY:
 * Centralized validation for all spending transactions and business data.
 * All validation must happen BEFORE data reaches database or business logic.
 * Validates, but does NOT execute or modify data.
 * 
 * VALIDATION RULES:
 * 1. Amount must be positive number
 * 2. Expense name must be non-empty string
 * 3. Category must match allowed list (if provided)
 * 4. Date must be valid YYYY-MM-DD format
 * 5. Tag/Note optional but must be strings if provided
 * 
 * RETURN FORMAT:
 * All validation functions return:
 * {
 *   valid: boolean,
 *   data?: {sanitized and formatted data},
 *   message?: "error message if invalid"
 * }
 * 
 * GUARANTEES:
 * - Pure functions (no side effects)
 * - No database access
 * - No randomness
 * - Deterministic output
 * 
 * =============================================================================
 */

/**
 * Valid spending categories (from existing data)
 * Must match what's used in database and core logic
 */
const VALID_CATEGORIES = [
    "Accounts Receivable",
    "Body Care",
    "Cigarette",
    "Clothing",
    "Donation",
    "Emergency Fund",
    "Dana Darurat",
    "Famliy",  // Note: typo preserved for DB compatibility
    "Food and Drink",
    "Healthcare",
    "Housing",
    "Instalment",
    "Lifestyle",
    "Savings",
    "Self Improvements",
    "Stock Investment",
    "Supplies",
    "Tax",
    "Transportation",
    "Debt",
    "Utilities"
];

/**
 * Validate spending amount
 * @param {number|string} amount - Amount in Rupiah
 * @return {Object} {valid: boolean, data?: number, message?: string}
 */
function validateAmount(amount) {
    // Convert to number if string
    const num = typeof amount === 'string' ? parseInt(amount, 10) : amount;

    // Check if valid number
    if (Number.isNaN(num)) {
        return {
            valid: false,
            message: "Amount must be a valid number"
        };
    }

    // Check if positive
    if (num <= 0) {
        return {
            valid: false,
            message: "Amount must be greater than 0"
        };
    }

    // Check if reasonable (less than 1 billion)
    if (num > 1000000000) {
        return {
            valid: false,
            message: "Amount exceeds maximum allowed value"
        };
    }

    return {
        valid: true,
        data: num
    };
}

/**
 * Validate expense/income name
 * @param {string} name - Expense or income name
 * @return {Object} {valid: boolean, data?: string, message?: string}
 */
function validateExpenseName(name) {
    // Must be string
    if (typeof name !== 'string') {
        return {
            valid: false,
            message: "Expense name must be a string"
        };
    }

    // Must not be empty after trim
    const trimmed = name.trim();
    if (trimmed.length === 0) {
        return {
            valid: false,
            message: "Expense name cannot be empty"
        };
    }

    // Max length 255 characters
    if (trimmed.length > 255) {
        return {
            valid: false,
            message: "Expense name too long (max 255 characters)"
        };
    }

    return {
        valid: true,
        data: trimmed
    };
}

/**
 * Validate category
 * @param {string} category - Category name
 * @return {Object} {valid: boolean, data?: string, message?: string}
 */
function validateCategory(category) {
    // If not provided, that's OK (will use "Uncategorized")
    if (!category) {
        return {
            valid: true,
            data: "Uncategorized"
        };
    }

    // Must be string
    if (typeof category !== 'string') {
        return {
            valid: false,
            message: "Category must be a string"
        };
    }

    const trimmed = category.trim();

    // Check against allowed categories
    if (!VALID_CATEGORIES.includes(trimmed)) {
        return {
            valid: false,
            message: `Invalid category. Allowed: ${VALID_CATEGORIES.join(", ")}`
        };
    }

    return {
        valid: true,
        data: trimmed
    };
}

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @return {Object} {valid: boolean, data?: string, message?: string}
 */
function validateDateFormat(dateStr) {
    // Must be string
    if (typeof dateStr !== 'string') {
        return {
            valid: false,
            message: "Date must be a string in YYYY-MM-DD format"
        };
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
        return {
            valid: false,
            message: "Date must be in YYYY-MM-DD format"
        };
    }

    // Verify it's actually a valid date
    const date = new Date(dateStr + 'T00:00:00Z');
    if (Number.isNaN(date.getTime())) {
        return {
            valid: false,
            message: "Invalid date value"
        };
    }

    return {
        valid: true,
        data: dateStr
    };
}

/**
 * Validate tag (optional)
 * @param {string} tag - Tag string
 * @return {Object} {valid: boolean, data?: string, message?: string}
 */
function validateTag(tag) {
    // If not provided, return empty string
    if (!tag) {
        return {
            valid: true,
            data: ""
        };
    }

    // Must be string
    if (typeof tag !== 'string') {
        return {
            valid: false,
            message: "Tag must be a string"
        };
    }

    const trimmed = tag.trim();

    // Max length 100 characters
    if (trimmed.length > 100) {
        return {
            valid: false,
            message: "Tag too long (max 100 characters)"
        };
    }

    return {
        valid: true,
        data: trimmed
    };
}

/**
 * Validate note (optional)
 * @param {string} note - Note string
 * @return {Object} {valid: boolean, data?: string, message?: string}
 */
function validateNote(note) {
    // If not provided, return empty string
    if (!note) {
        return {
            valid: true,
            data: ""
        };
    }

    // Must be string
    if (typeof note !== 'string') {
        return {
            valid: false,
            message: "Note must be a string"
        };
    }

    const trimmed = note.trim();

    // Max length 500 characters
    if (trimmed.length > 500) {
        return {
            valid: false,
            message: "Note too long (max 500 characters)"
        };
    }

    return {
        valid: true,
        data: trimmed
    };
}

function validateAccount(account) {
    // If not provided, return empty string
    if (!account) {
        return {
            valid: true,
            data: ""
        };
    }

    // Must be string
    if (typeof account !== 'string') {
        return {
            valid: false,
            message: "Account must be a string"
        };
    }

    const trimmed = account.trim();

    // Max length 100 characters
    if (trimmed.length > 100) {
        return {
            valid: false,
            message: "Account name too long (max 100 characters)"
        };
    }

    return {
        valid: true,
        data: trimmed
    };
}

/**
 * Master validation function for spending data
 * Validates all fields and returns fully sanitized data or error
 * 
 * @param {Object} input - Input object with fields:
 *   - expenseName: string (required)
 *   - amount: number (required)
 *   - category: string (optional)
 *   - tag: string (optional)
 *   - note: string (optional)
 *   - date: string YYYY-MM-DD (optional, defaults to today)
 * 
 * @return {Object} {
 *   valid: boolean,
 *   data?: {sanitized and validated data},
 *   message?: "error message if invalid"
 * }
 */
function validateSpendingInput(input) {
    if (!input || typeof input !== 'object') {
        return {
            valid: false,
            message: "Input must be an object"
        };
    }

    // Validate required fields
    const nameValidation = validateExpenseName(input.expenseName);
    if (!nameValidation.valid) {
        return nameValidation;
    }

    const amountValidation = validateAmount(input.amount);
    if (!amountValidation.valid) {
        return amountValidation;
    }

    // Validate optional fields
    const categoryValidation = validateCategory(input.category);
    if (!categoryValidation.valid) {
        return categoryValidation;
    }

    const tagValidation = validateTag(input.tag);
    if (!tagValidation.valid) {
        return tagValidation;
    }

    const noteValidation = validateNote(input.note);
    if (!noteValidation.valid) {
        return noteValidation;
    }

    // Validate date if provided
    let dateStr = null;
    if (input.date) {
        const dateValidation = validateDateFormat(input.date);
        if (!dateValidation.valid) {
            return dateValidation;
        }
        dateStr = dateValidation.data;
    }

    // Return fully validated and sanitized data
    return {
        valid: true,
        data: {
            expenseName: nameValidation.data,
            amount: amountValidation.data,
            category: categoryValidation.data,
            tag: tagValidation.data,
            note: noteValidation.data,
            date: dateStr  // null if not provided
        }
    };
}

/**
 * Test function for validator
 * Run in Apps Script console to verify validation works
 */
function testValidator() {
    Logger.log("=== Testing Validator ===");

    // Test valid input
    const validTest = validateSpendingInput({
        expenseName: "Coffee",
        amount: 25000,
        category: "Food and Drink",
        tag: "Breakfast",
        note: "Espresso at cafe",
        date: "2025-01-17"
    });
    Logger.log("Valid input: " + JSON.stringify(validTest, null, 2));

    // Test invalid amount
    const invalidAmount = validateSpendingInput({
        expenseName: "Coffee",
        amount: -100
    });
    Logger.log("Invalid amount: " + JSON.stringify(invalidAmount, null, 2));

    // Test missing name
    const missingName = validateSpendingInput({
        expenseName: "",
        amount: 25000
    });
    Logger.log("Missing name: " + JSON.stringify(missingName, null, 2));

    // Test invalid category
    const invalidCat = validateSpendingInput({
        expenseName: "Coffee",
        amount: 25000,
        category: "InvalidCategory"
    });
    Logger.log("Invalid category: " + JSON.stringify(invalidCat, null, 2));
}
