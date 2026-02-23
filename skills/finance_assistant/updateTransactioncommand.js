
/**
 * Handle #Update TRANSACTION_ID with flags like -cat, -tag, -amount, -note, -expensesname
 * Direct execution - no AI needed
 */

function handleHashtagUpdate(ctx) {
    const chatID = ctx.from.id;
    if (!isUserAllowed(chatID)) {
        ctx.reply(MSG_REJECT);
        return;
    }

    const id = ctx.match[1];
    const text = ctx.message.text;
    const transaction = getDbTransactions().key(id);
    const expensesname = transaction.data[2];

    const flagPatterns = {
        "-cat": { regex: /-cat "([^"]+)"/, fn: updateCategoryValidated, label: "Kategori" }, // done
        "-tag": { regex: /-tag "([^"]+)"/, fn: updateTagValidated, label: "Tag" },
        "-amount": { regex: /-amount "([^"]+)"/, fn: updateAmountValidated, label: "Nominal" },
        "-note": { regex: /-note "([^"]+)"/, fn: updateNoteValidated, label: "Catatan" },
        "-expensesname": { regex: /-expensesname "([^"]+)"/, fn: updateExpenseNameValidated, label: "Nama transaksi" },
        "account": { regex: /-account "([^"]+)"/, fn: updateAccountValidated, label: "Akun" },
    };

    let pesan = '';
    let handled = false;

    for (const [flag, { regex, fn, label }] of Object.entries(flagPatterns)) {
        if (text.includes(flag)) {
            const match = text.match(regex);
            if (!match) {
                pesan = `⚠️ Format salah untuk flag \`${flag}\`.\nContoh: \`${flag} "nilai"\``;
            } else {
                fn(id, match[1]);
                pesan = `✅ *${label}* untuk *${expensesname}* (ID: \`${id}\`) diperbarui menjadi: *${match[1]}*`;
            }
            handled = true;
            break;
        }
    }

    if (!handled) {
        pesan = `🤖 Input tidak valid. Mohon ulangi dengan format yang benar.\n${MSG_UPDATE_COMMANDS}`;
    }

    ctx.replyWithMarkdown(pesan);
}


/**
 * Update spending category with validation
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
        const record = getDbTransactions().key(id);
        if (!record) {
            return { success: false, message: `Transaction ${id} not found` };
        }

        // Perform update
        const rowIndex = record.row;
        const currentData = getDbTransactions().range(rowIndex, 2, 1, 7).getValues()[0];
        currentData[3] = newCategory; // Index 3 is category column
        getDbTransactions().range(rowIndex, 2, 1, 7).setValues([currentData]);

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
        const record = getDbTransactions().key(id);
        if (!record) {
            return { success: false, message: `Transaction ${id} not found` };
        }

        // Perform update
        const rowIndex = record.row;
        const currentData = getDbTransactions().range(rowIndex, 2, 1, 7).getValues()[0];
        currentData[4] = newAmount; // Index 4 is amount column
        getDbTransactions().range(rowIndex, 2, 1, 7).setValues([currentData]);
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
        const record = getDbTransactions().key(id);
        if (!record) {
            return { success: false, message: `Transaction ${id} not found` };
        }

        // Perform update
        const rowIndex = record.row;
        const currentData = getDbTransactions().range(rowIndex, 2, 1, 7).getValues()[0];
        currentData[2] = expenseName; // Index 2 is expenseName column
        getDbTransactions().range(rowIndex, 2, 1, 7).setValues([currentData]);
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
        const record = getDbTransactions().key(id);
        if (!record) {
            return { success: false, message: `Transaction ${id} not found` };
        }

        // Perform update
        const rowIndex = record.row;
        const currentData = getDbTransactions().range(rowIndex, 2, 1, 7).getValues()[0];
        currentData[5] = tag || ""; // Index 5 is tag column
        getDbTransactions().range(rowIndex, 2, 1, 7).setValues([currentData]);

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
        const record = getDbTransactions().key(id);
        if (!record) {
            return { success: false, message: `Transaction ${id} not found` };
        }

        // Perform update
        const rowIndex = record.row;
        const currentData = getDbTransactions().range(rowIndex, 2, 1, 7).getValues()[0];
        currentData[6] = note || ""; // Index 6 is note column
        getDbTransactions().range(rowIndex, 2, 1, 7).setValues([currentData]);

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

function updateAccountValidated(id, account) {
    try {
        // Validate account
        const accountValidation = validateAccount(account);
        if (!accountValidation.valid) {
            return { success: false, message: accountValidation.message };
        }

        // Check if transaction exists
        const record = getDbTransactions().key(id);
        if (!record) {
            return { success: false, message: `Transaction ${id} not found` };
        }

        // Perform update
        const rowIndex = record.row;
        const currentData = getDbTransactions().range(rowIndex, 2, 1, 8).getValues()[0];
        currentData[7] = account; // Index 7 is account column
        getDbTransactions().range(rowIndex, 2, 1, 8).setValues([currentData]);
        Logger.log(`✅ Updated account for ${id}: ${account}`);

        return {
            success: true,
            data: { id, account }
        };

    } catch (error) {
        Logger.log(`❌ Failed to update account: ${error.message}`);
        return { success: false, message: `Database error: ${error.message}` };
    }
}