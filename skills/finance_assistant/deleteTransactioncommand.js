/**
 * Handle #Delete TRANSACTION_ID
 * Direct execution - no AI needed
 */

function handleHashtagDelete(ctx) {
    const chatID = ctx.from.id;

    // Access control
    if (!isUserAllowed(chatID)) {
        ctx.reply(MSG_REJECT);
        return;
    }

    const targetTransactionID = ctx.match[1];
    const result = dbSpending.key(targetTransactionID);

    if (!result) {
        ctx.reply(`🚮 Data with Transaction ID ${targetTransactionID} was not found.`);
        return;
    }

    try {
        // ===== DEBUG: Log deletion target =====
        const sheet = dbSpending.sheet;
        const ssId = sheet.getParent().getId();
        const sheetName = sheet.getName();
        const rowToDelete = result.row;
        const lastRow = sheet.getLastRow();

        Logger.log("=== HASHTAG DELETE DEBUG ===");
        Logger.log("Spreadsheet ID: " + ssId);
        Logger.log("Sheet Name: " + sheetName);
        Logger.log("Row to delete: " + rowToDelete);
        Logger.log("Last row: " + lastRow);
        Logger.log("Transaction ID: " + targetTransactionID);

        // Validate row boundaries
        if (rowToDelete < 2 || rowToDelete > lastRow) {
            Logger.log("❌ VALIDATION FAILED: Row out of bounds");
            ctx.reply(`🚮 Invalid row number. Cannot delete.`);
            return;
        }

        // Delete from spreadsheet
        sheet.deleteRow(rowToDelete);

        // CRITICAL: Flush changes to ensure deletion is persisted
        SpreadsheetApp.flush();

        // Verify deletion was successful
        const verifyLastRow = sheet.getLastRow();
        Logger.log("Last row after deletion: " + verifyLastRow);

        if (verifyLastRow === lastRow) {
            Logger.log("⚠️ WARNING: Last row unchanged after deleteRow()");
            ctx.reply(`🚮 Failed to delete transaction. Row may be protected.`);
            return;
        }

        // Verify transaction no longer exists
        const verifyResult = dbSpending.key(targetTransactionID);
        if (verifyResult) {
            Logger.log("❌ VERIFICATION FAILED: Transaction still exists after deletion");
            ctx.reply(`🚮 Transaction was not actually deleted.`);
            return;
        }

        Logger.log("✅ DELETION SUCCESSFUL: Transaction " + targetTransactionID);
        ctx.reply(`🗑️ Data with Transaction ID ${targetTransactionID} has been successfully deleted.`);

    } catch (error) {
        Logger.log("❌ ERROR in handleHashtagDelete: " + error.message);
        ctx.reply(`🚮 Error deleting transaction: ${error.message}`);
    }
}