/**
 * =============================================================================
 * ai/intentMapper.gs
 * =============================================================================
 * 
 * RESPONSIBILITY: 
 * Translate AI-interpreted intent → core function calls
 * Acts as the gate between AI output and business logic
 * 
 * WORKFLOW:
 * 1. Receive {intent, payload} from ai/openAi.gs
 * 2. Validate payload and user access
 * 3. Call appropriate core function
 * 4. Return {success: boolean, message: string}
 * 
 * INTENT MAPPING:
 * - ADD_SPENDING → addSpending() from core/spending.js
 * - ADD_INCOME → addIncome() from core/spending.js
 * - GET_REPORT → getSpendingReport() + formatReportMessage()
 * - DELETE_TRANSACTION → deleteTransaction() from core/spending.js
 * - UPDATE_TRANSACTION → updateTransaction() from core/spending.js
 * 
 * DO NOT:
 * - Add new business logic
 * - Modify core function behavior
 * - Make decisions beyond mapping
 * 
 * =============================================================================
 */

/**
 * Execute an intent returned by AI interpretation
 * @param {Number} chatID - User's Telegram chat ID for access control
 * @param {String} intent - Intent type (ADD_SPENDING, GET_REPORT, etc)
 * @param {Object} payload - Parameters for the intent
 * @return {Object} {success: boolean, message: string}
 */
function executeIntent(chatID, intent, payload) {
    try {
        // Access control should already be checked in handler, but double-check
        if (!isUserAllowed(chatID)) {
            return {
                success: false,
                message: "❌ Access denied."
            };
        }

        // Route to appropriate handler based on intent
        switch (intent) {
            case "ADD_SPENDING":
                return handleAddSpending(payload);

            case "ADD_INCOME":
                return handleAddIncome(payload);

            case "GET_REPORT":
                return handleGetReport(payload);

            case "DELETE_TRANSACTION":
                return handleDeleteTransaction(payload);

            case "UPDATE_TRANSACTION":
                return handleUpdateTransaction(payload);

            default:
                return {
                    success: false,
                    message: "❌ Intent not recognized: " + intent
                };
        }

    } catch (error) {
        Logger.log("❌ Error executing intent: " + error.message);
        return {
            success: false,
            message: "❌ An error occurred: " + error.message
        };
    }
}

/**
 * Handle ADD_SPENDING intent
 * @param {Object} payload - {expenseName, amount, category?, tag?, dateOffset?}
 * @return {Object} {success, message}
 */
function handleAddSpending(payload) {
    try {
        const { expenseName, amount, category, tag, dateOffset } = payload;

        // Validate required fields
        if (!expenseName || !amount) {
            return {
                success: false,
                message: "❌ Missing required fields: expenseName and amount"
            };
        }

        // Build options object
        const options = {};

        if (category) options.category = category;
        if (tag) options.tag = tag;

        // Handle date offset
        if (dateOffset && dateOffset !== 0) {
            const baseDate = new Date();
            baseDate.setDate(baseDate.getDate() + dateOffset);
            options.date = baseDate;
        }

        // Call core business logic
        const result = addSpending(expenseName, amount, options);

        // Format success message
        const message = `✅ Recorded expense: *${expenseName}*
Amount: Rp${amount.toLocaleString('id-ID')}
Category: ${result.category || 'Uncategorized'}
Tag: ${result.tag || '-'}
ID: ${result.id}`;

        return {
            success: true,
            message: message
        };

    } catch (error) {
        Logger.log("Error in handleAddSpending: " + error.message);
        return {
            success: false,
            message: "❌ Failed to add spending: " + error.message
        };
    }
}

/**
 * Handle ADD_INCOME intent
 * @param {Object} payload - {incomeName, amount, category?, tag?, dateOffset?}
 * @return {Object} {success, message}
 */
function handleAddIncome(payload) {
    try {
        const { incomeName, amount, category, tag, dateOffset } = payload;

        // Validate required fields
        if (!incomeName || !amount) {
            return {
                success: false,
                message: "❌ Missing required fields: incomeName and amount"
            };
        }

        // Build options object
        const options = {};

        if (category) options.category = category;
        if (tag) options.tag = tag;

        // Handle date offset
        if (dateOffset && dateOffset !== 0) {
            const baseDate = new Date();
            baseDate.setDate(baseDate.getDate() + dateOffset);
            options.date = baseDate;
        }

        // Call core business logic
        const result = addIncome(incomeName, amount, options);

        // Format success message
        const message = `✅ Recorded income: *${incomeName}*
Amount: Rp${amount.toLocaleString('id-ID')}
Category: ${result.category || 'Uncategorized'}
Tag: ${result.tag || '-'}
ID: ${result.id}`;

        return {
            success: true,
            message: message
        };

    } catch (error) {
        Logger.log("Error in handleAddIncome: " + error.message);
        return {
            success: false,
            message: "❌ Failed to add income: " + error.message
        };
    }
}

/**
 * Handle GET_REPORT intent
 * @param {Object} payload - {startDate, endDate, reportMessage?}
 * @return {Object} {success, message}
 */
function handleGetReport(payload) {
    try {
        const { startDate, endDate, reportMessage } = payload;

        // Validate dates
        if (!startDate || !endDate) {
            return {
                success: false,
                message: "❌ Missing required fields: startDate and endDate"
            };
        }

        // Call core business logic to get report
        const result = processSpendingByCustomDateRange(startDate, endDate);

        if (result.error) {
            // No data for the date range
            const emptyMessage = formatEmptyReportMessage({
                isToday: startDate === endDate,
                startDate: startDate,
                endDate: endDate,
                locale: 'id'
            });
            return {
                success: true,
                message: emptyMessage
            };
        }

        // Combine AI message with report
        const finalMessage = reportMessage
            ? `${reportMessage}\n\n${result.response}`
            : result.response;

        return {
            success: true,
            message: finalMessage
        };

    } catch (error) {
        Logger.log("Error in handleGetReport: " + error.message);
        return {
            success: false,
            message: "❌ Failed to generate report: " + error.message
        };
    }
}

/**
 * Handle DELETE_TRANSACTION intent
 * @param {Object} payload - {transactionId}
 * @return {Object} {success, message}
 */
function handleDeleteTransaction(payload) {
    try {
        const { transactionId } = payload;

        // Validate transaction ID format
        if (!transactionId || transactionId.length !== 4) {
            return {
                success: false,
                message: "❌ Invalid transaction ID. Must be 4 characters."
            };
        }

        // Check if transaction exists
        const result = dbSpending.key(transactionId);

        if (!result) {
            return {
                success: false,
                message: `❌ Transaction with ID '${transactionId}' not found.`
            };
        }

        // ===== DEBUG: Log deletion target =====
        const sheet = dbSpending.sheet;
        const ssId = sheet.getParent().getId();
        const sheetName = sheet.getName();
        const rowToDelete = result.row;
        const lastRow = sheet.getLastRow();

        Logger.log("=== DELETE TRANSACTION DEBUG ===");
        Logger.log("Spreadsheet ID: " + ssId);
        Logger.log("Sheet Name: " + sheetName);
        Logger.log("Row to delete: " + rowToDelete);
        Logger.log("Last row: " + lastRow);
        Logger.log("Transaction ID: " + transactionId);

        // Validate row boundaries
        if (rowToDelete < 2 || rowToDelete > lastRow) {
            Logger.log("❌ VALIDATION FAILED: Row out of bounds");
            return {
                success: false,
                message: `❌ Invalid row number: ${rowToDelete}. Must be between 2 and ${lastRow}.`
            };
        }

        // Get row data before deletion (for verification)
        const rowData = sheet.getRange(rowToDelete, 1, 1, sheet.getLastColumn()).getValues()[0];
        Logger.log("Row data before deletion: " + JSON.stringify(rowData));

        // Delete from spreadsheet
        sheet.deleteRow(rowToDelete);

        // CRITICAL: Flush changes to ensure deletion is persisted
        SpreadsheetApp.flush();

        // Verify deletion was successful
        const verifyLastRow = sheet.getLastRow();
        Logger.log("Last row after deletion: " + verifyLastRow);

        if (verifyLastRow === lastRow) {
            Logger.log("⚠️ WARNING: Last row unchanged after deleteRow(). Delete may have failed.");
            return {
                success: false,
                message: `❌ Failed to delete transaction. Row may be protected or locked.`
            };
        }

        // Verify transaction no longer exists
        const verifyResult = dbSpending.key(transactionId);
        if (verifyResult) {
            Logger.log("❌ VERIFICATION FAILED: Transaction still exists after deletion");
            return {
                success: false,
                message: `❌ Transaction was not actually deleted. Data integrity error.`
            };
        }

        Logger.log("✅ DELETION SUCCESSFUL: Transaction " + transactionId + " removed");

        return {
            success: true,
            message: `✅ Transaction '${transactionId}' deleted successfully.`
        };

    } catch (error) {
        Logger.log("❌ ERROR in handleDeleteTransaction: " + error.message);
        Logger.log("Stack trace: " + error.stack);
        return {
            success: false,
            message: "❌ Failed to delete transaction: " + error.message
        };
    }
}

/**
 * Handle UPDATE_TRANSACTION intent
 * @param {Object} payload - {transactionId, field, newValue}
 * @return {Object} {success, message}
 */
function handleUpdateTransaction(payload) {
    try {
        const { transactionId, field, newValue } = payload;

        // Validate inputs
        if (!transactionId || !field || newValue === undefined) {
            return {
                success: false,
                message: "❌ Missing required fields: transactionId, field, newValue"
            };
        }

        // Check if transaction exists
        const result = dbSpending.key(transactionId);

        if (!result) {
            return {
                success: false,
                message: `❌ Transaction with ID '${transactionId}' not found.`
            };
        }

        // Route to appropriate update function
        switch (field.toLowerCase()) {
            case "category":
                updateCat(transactionId, newValue);
                break;
            case "tag":
                updateTag(transactionId, newValue);
                break;
            case "amount":
                updateAmount(transactionId, newValue);
                break;
            case "note":
                updateNote(transactionId, newValue);
                break;
            case "expensename":
                updateExpansename(transactionId, newValue);
                break;
            default:
                return {
                    success: false,
                    message: `❌ Unknown field: ${field}. Allowed: category, tag, amount, note, expenseName`
                };
        }

        return {
            success: true,
            message: `✅ Transaction '${transactionId}' updated successfully.`
        };

    } catch (error) {
        Logger.log("Error in handleUpdateTransaction: " + error.message);
        return {
            success: false,
            message: "❌ Failed to update transaction: " + error.message
        };
    }
}

/**
 * Test function: Verify intent mapping works
 */
function testIntentMapper() {
    const testIntents = [
        {
            intent: "ADD_SPENDING",
            payload: { expenseName: "Kopi", amount: 25000 }
        },
        {
            intent: "GET_REPORT",
            payload: { startDate: "2025-01-17", endDate: "2025-01-17" }
        },
        {
            intent: "DELETE_TRANSACTION",
            payload: { transactionId: "a1b2" }
        }
    ];

    testIntents.forEach((test, idx) => {
        Logger.log("\n--- Test " + (idx + 1) + ": " + test.intent);
        const result = executeIntent(123456, test.intent, test.payload);
        Logger.log("Result: " + JSON.stringify(result, null, 2));
    });
}
