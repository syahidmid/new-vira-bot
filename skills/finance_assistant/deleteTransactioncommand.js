/**
 * Handle #Delete TRANSACTION_ID
 * Direct execution - no AI needed
 */

function handleHashtagDelete(ctx) {
    const chatID = ctx.from.id;

    if (!isUserAllowed(chatID)) {
        ctx.reply(MSG_REJECT);
        return;
    }

    const targetTransactionID = ctx.match[1];
    const result = getDbTransactions().key(targetTransactionID);

    if (!result) {
        ctx.reply(`🚮 Transaksi dengan ID \`${targetTransactionID}\` tidak ditemukan.`);
        return;
    }

    const expensesname = result.data[2];

    try {
        const sheet = getDbTransactions().sheet;
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

        if (rowToDelete < 2 || rowToDelete > lastRow) {
            Logger.log("❌ VALIDATION FAILED: Row out of bounds");
            ctx.reply(`🚮 Baris tidak valid. Tidak dapat menghapus.`);
            return;
        }

        sheet.deleteRow(rowToDelete);
        SpreadsheetApp.flush();

        const verifyLastRow = sheet.getLastRow();
        Logger.log("Last row after deletion: " + verifyLastRow);

        if (verifyLastRow === lastRow) {
            Logger.log("⚠️ WARNING: Last row unchanged after deleteRow()");
            ctx.reply(`🚮 Gagal menghapus *${expensesname}* (ID: \`${targetTransactionID}\`). Baris mungkin diproteksi.`);
            return;
        }

        var verifyAfterDelete = null;
        if (sheet.getLastRow() >= 2) {
            verifyAfterDelete = getDbTransactions().key(targetTransactionID);
        }

        if (verifyAfterDelete) {
            Logger.log("❌ VERIFICATION FAILED: Transaction still exists after deletion");
            ctx.reply(`🚮 *${expensesname}* (ID: \`${targetTransactionID}\`) gagal dihapus.`);
            return;
        }

        Logger.log("✅ DELETION SUCCESSFUL: Transaction " + targetTransactionID);
        ctx.replyWithMarkdown(`🗑️ Transaksi *${expensesname}* dengan ID \`${targetTransactionID}\` berhasil dihapus.`);

    } catch (error) {
        Logger.log("❌ ERROR in handleHashtagDelete: " + error.message);
        ctx.reply(`🚮 Error menghapus transaksi: ${error.message}`);
    }
}

/**
 * Handle "Delete Last Transaction" button / natural language
 * Validates user, fetches last transaction ID, injects into ctx.match, delegates to handleHashtagDelete
 */
function handleDeleteLastTransaction(ctx) {
    const chatID = ctx.from.id;

    // Access control
    if (!isUserAllowed(chatID)) {
        ctx.reply(MSG_REJECT);
        return;
    }

    try {
        const lastRow = getDbTransactions().last_row;

        // Validate that there is at least one transaction
        if (lastRow < 2) {
            ctx.reply("🗑️ Tidak ada transaksi untuk dihapus.");
            return;
        }

        // Fetch the transaction ID from the last row (column 1, index 0 in miniSheetDB2)
        const lastRowData = getDbTransactions().range(lastRow, 1, 1, 1).getValues()[0];
        const lastTransactionID = lastRowData[0];

        // Validate transaction ID exists
        if (!lastTransactionID || lastTransactionID.toString().trim() === "") {
            ctx.reply("🗑️ Tidak dapat mengambil ID transaksi dari baris terakhir.");
            return;
        }

        // Inject the transaction ID into ctx.match as expected by handleHashtagDelete
        ctx.match = [null, lastTransactionID.toString().trim()];

        // Delegate deletion to existing handler (no logic duplication)
        handleHashtagDelete(ctx);

    } catch (error) {
        Logger.log("❌ ERROR in handleDeleteLastTransaction: " + error.message);
        ctx.reply(`🗑️ Error deleting last transaction: ${error.message}`);
    }
}
