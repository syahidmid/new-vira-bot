/**
 * =============================================================================
 * bot/handler.gs
 * =============================================================================
 *
 * ROLE:
 * This file acts as the SINGLE MESSAGE ROUTER.
 * Its only responsibility is to REGISTER and ROUTE incoming Telegram updates
 * to the appropriate handler, skill, or wizard.
 *
 * IMPORTANT:
 * - This file MUST NOT contain business logic.
 * - This file MUST NOT perform data processing or validation.
 *
 * WHAT THIS FILE DOES:
 * 1) Registers slash commands (e.g. /start, /help, /whoiam, /botstatus)
 * 2) Registers hashtag shortcuts (e.g. #Spending, #Income, #Delete)
 * 3) Routes photo messages to OCR pipeline
 * 4) Routes natural language messages to AI handler
 *
 * WHERE THE LOGIC LIVES:
 * - Skills (single capability logic):
 *   → bot/skills/*.skill.gs
 *
 * - Wizards (multi-step user interaction):
 *   → bot/wizard/*.wizard.gs
 *
 * - AI interpretation & response:
 *   → bot/aiMessageHandler.gs
 *
 * - OCR processing:
 *   → bot/ocrHandler.gs
 *
 * ENTRY POINT:
 * This router is invoked from code.js → doPost()
 * after Telegram webhook receives an update.
 *
 * ROUTING RULES:
 * - Slash commands        → Execute skill handlers directly (NO AI)
 * - Hashtag shortcuts     → Execute skill handlers directly (NO AI)
 * - Photo messages        → OCR pipeline → AI handler
 * - Natural language      → AI handler
 * - Catch-all             → Handle gracefully without breaking flow
 *
 * UI LAYER USAGE:
 * - Text responses should be defined in bot/ui/message.js
 * - Keyboard layouts should be defined in bot/ui/keyboard.js
 *
 * PHOTO MESSAGE FLOW (PHASE 2.5):
 * user sends photo
 *   ↓
 * handler.js (this file) registers & routes the message
 *   ↓
 * handlePhotoMessageRouter()
 *   ↓
 * bot/ocrHandler.js
 *   ↓
 * performOCR()
 *   ↓
 * bot/aiMessageHandler.js
 *   ↓
 * OCR text treated as normal user input
 *
 * STRICT RULES — DO NOT:
 * - Implement business logic here
 * - Access or modify spreadsheets
 * - Perform save/update/delete operations
 * - Add validation or decision-making logic
 * - Use AI for slash commands or hashtag shortcuts
 * - Modify AI prompt logic
 *
 * If you need to add new behavior:
 * - Create or update a SKILL (bot/skills/)
 * - Then REGISTER it here
 *
 * =============================================================================
 */


/**
 * Register all message handlers with the bot instance
 * @param {Object} bot - lumpia bot instance
 */
function setupMessageRouters(bot) {
    // ===== SLASH COMMANDS (No AI needed) =====

    // /start command
    bot.start(handleStartCommand); // Done refactor - moved logic to separate function in the same file

    // Emergency exit command
    bot.command('exit', (ctx) => {
        ctx.scene.leave();
        ctx.reply('✅ Scene exited successfully!');
    });

    bot.hears(/view\s*spending/i, (ctx) => {
        return stage.enter('view_spending');
    });

    bot.command('wizardtest', (ctx) => {
        return stage.enter('wizardTest');
    });

    // /help command
    bot.command('help', handleHelpCommand);

    // /ping command (connection test)
    bot.command('ping', handlePingCommand);

    // /whoiam command
    bot.command('whoiam', handleWhoIAmCommand);


    // /quote command
    bot.command('quote', handleQuoteCommand);

    // /update command (info about update syntax)
    bot.command('update', handleUpdateInfoCommand);

    // ===== HASHTAG SHORTCUTS (Direct execution, no AI) =====

    // #Spending: Log expense with shortcut format
    bot.hears(/#Spending (.+) (\d+)/, handleHashtagSpending); // done refactor - moved logic to separate function in the same file

    // #Income: Log income with shortcut format
    bot.hears(/#Income (.+) (\d+)/, handleHashtagIncome); // done refactor - moved logic to separate function in the same file

    // #Delete: Delete transaction by ID
    bot.hears(/#Delete ([0-9A-Za-z]{4})/, handleHashtagDelete);

    // #Update: Update transaction fields
    bot.hears(/#Update (\w+)/, handleHashtagUpdate);

    // #Transactions: List recent transactions
    bot.hears(/#Transactions (\d+)/, handleHashtagTransactions);


    // ===== UI SHORTCUTS (Menu buttons, no AI) =====
    // Menu button: Input Pemasukan (Income)
    bot.hears(/Add Income/i, handleMenuInputIncome);
    // Menu button: Input Pengeluaran (Expense)
    bot.hears(/Add Spending/i, handleMenuInputExpense);

    // Menu button: Lihat Pengeluaran (View Expenses)

    // Menu button: Show Bookmarks    bot.hears(/.*Lihat Pengeluaran.*|^(\d+)\s+Pengeluaran\s+Terakhir$/i, handleMenuViewExpenses);

    bot.hears("Show Bookmarks", handleMenuShowBookmarks);

    // Menu button: Delete Last Transaction
    bot.hears(/Delete This|Last Transaction/i, handleDeleteLastTransaction);

    // ===== SETTINGS MENU =====
    bot.hears(/^[^\w]*settings$/i, handleSettingsCommand);
    bot.hears(/Add Default Category/i, handleAddCategoryWizard);


    // ===== URL BOOKMARKING (Direct execution, no AI) =====

    // URLs: Save bookmarks
    bot.hears(/^https?:\/\/\S+/, handleURLBookmark);

    // ===== PHOTO MESSAGES (OCR processing - PHASE 2.5) =====
    // Photo messages: Extract text via OCR
    bot.on("photo", handlePhotoMessageRouter);

    // ===== NATURAL LANGUAGE (AI-assisted) =====
    // Catch-all for unmatched messages → Pass to AI router
    bot.hears(/^(?!\/).+/, handleNaturalLanguage);
}




/**
 * Handle /quote command
 */
function handleQuoteCommand(ctx) {
    const chatID = ctx.from.id;

    // Access control
    if (!isUserAllowed(chatID)) {
        ctx.reply(MSG_REJECT);
        return;
    }

    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    const quoteMessage = `<i>"${randomQuote.quote}"</i>\n\n- <b>${randomQuote.author}</b>`;
    ctx.replyWithHTML(quoteMessage);
}

/**
 * Handle /update command (shows update syntax info)
 */
function handleUpdateInfoCommand(ctx) {
    const chatID = ctx.from.id;

    // Access control
    if (!isUserAllowed(chatID)) {
        ctx.reply(MSG_REJECT);
        return;
    }

    ctx.replyWithMarkdown(`🤖 Here are the valid update commands:\n${MSG_UPDATE_COMMANDS}`);
}

/**
 * Handle #Spending EXPENSE_NAME AMOUNT
 * Direct execution - no AI needed
 */
function handleHashtagSpending(ctx) {
    const chatID = ctx.from.id;

    Logger.log(`[handleHashtagSpending] Pesan diterima dari chatID: ${chatID}`);

    // Access control
    if (!isUserAllowed(chatID)) {
        ctx.reply(MSG_REJECT);
        return;
    }

    const firstName = ctx.from.first_name;
    const date = new Date();
    let savedDate = Utilities.formatDate(date, "GMT+7", "dd MMMM yyyy");

    let expenseName = ctx.match[1];
    const amount = parseInt(ctx.match[2]);
    const transactionID = generateUniqueTransactionID();

    Logger.log(`[handleHashtagSpending] Memproses transaksi — expense: "${expenseName}", amount: ${amount}, transactionID: ${transactionID}`);

    // Check for Backdate flag
    if (/Backdate/i.test(expenseName)) {
        savedDate = backDate(date);
        expenseName = expenseName.replace(/Backdate/i, "").trim();
        Logger.log(`[handleHashtagSpending] Backdate terdeteksi, savedDate: ${savedDate}`);
    }

    const { category, tag } = findcatTransaction(expenseName);
    const account = "";
    const note = "";

    const dbTransactions = getDbTransactions();
    const newRow = dbTransactions.last_row + 1;
    const saveRecord = dbTransactions.range(newRow, 1, 1, 9);
    const recordValues = [
        transactionID,
        savedDate,
        expenseName,
        "spending",
        category,
        amount,
        tag,
        account,
        note,
    ];

    saveRecord.setValues([recordValues]);
    Logger.log(`[handleHashtagSpending] Transaksi berhasil disimpan — row: ${newRow}, category: "${category}", tag: "${tag}"`);

    const pesan = printTransaction(transactionID);

    ctx.replyWithMarkdown(`🤖 Alright ${firstName}, I have recorded your expense in the Spreadsheets.\n\n${pesan}`, {
        reply_markup: {
            keyboard: KB_TRANSACTION_ENTRY,
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    });
}
/**
 * Handle #Income INCOME_NAME AMOUNT
 * Direct execution - no AI needed
 */

function handleHashtagIncome(ctx) {
    const chatID = ctx.from.id;

    if (!isUserAllowed(chatID)) {
        ctx.reply(MSG_REJECT);
        return;
    }

    const firstName = ctx.from.first_name;
    const date = new Date();
    let savedDate = Utilities.formatDate(date, "GMT+7", "dd MMMM yyyy");

    let incomeName = ctx.match[1];
    const amount = parseInt(ctx.match[2]);
    const transactionID = generateUniqueTransactionID();

    if (/Backdate/i.test(incomeName)) {
        savedDate = backDate(date);
        incomeName = incomeName.replace(/Backdate/i, "").trim();
    }

    const { category, tag } = findcatTransaction(incomeName);
    const note = "";

    const dbTransactions = getDbTransactions(); // 👈 assign sekali di sini

    const newRow = dbTransactions.last_row + 1;
    const saveRecord = dbTransactions.range(newRow, 1, 1, 9);
    const recordValues = [
        transactionID,
        savedDate,
        incomeName,
        "income",
        category,
        amount,
        tag,
        "",
        note,
    ];

    saveRecord.setValues([recordValues]);
    const pesan = printTransaction(transactionID);

    ctx.replyWithMarkdown(`🤖 Alright ${firstName}, I have recorded your income in the Spreadsheets.\n\n${pesan}`, {
        reply_markup: {
            keyboard: KB_TRANSACTION_ENTRY,
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    });
}


/**
 * Handle menu button: Input Pemasukan (Income)
 */
function handleMenuInputIncome(ctx) {
    const chatID = ctx.from.id;

    // Access control
    if (!isUserAllowed(chatID)) {
        ctx.reply(MSG_REJECT);
        return;
    }

    const firstName = ctx.from.first_name;
    ctx.replyWithMarkdown(buildMsgInputIncome(firstName), {
        reply_markup: {
            keyboard: KB_MAIN_MENU,
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    });
}

/**
 * Handle menu button: Lihat Pengeluaran (View Expenses)
 */
function handleMenuViewExpenses(ctx) {
    const chatID = ctx.from.id;

    // Access control
    if (!isUserAllowed(chatID)) {
        ctx.reply(MSG_REJECT);
        return;
    }

    const text = ctx.message.text.toLowerCase();
    let rowCount = 10; // default

    const match = text.match(/^(\d+)\s+pengeluaran\s+terakhir$/i);
    if (match) {
        rowCount = parseInt(match[1]);
    }

    const response = getRecentSpending(rowCount);

    ctx.replyWithMarkdown(response, {
        reply_markup: {
            keyboard: KB_TRANSACTION_MENU,
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    });
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
        // Get the last row in the spreadsheet
        const lastRow = dbSpending.last_row;

        // Validate that there is at least one transaction
        if (lastRow < 2) {
            ctx.reply("🗑️ No transactions to delete.");
            return;
        }

        // Fetch the transaction ID from the last row (column 2, index 0 in miniSheetDB2)
        const lastRowData = dbSpending.range(lastRow, 2, 1, 1).getValues()[0];
        const lastTransactionID = lastRowData[0];

        // Validate transaction ID exists
        if (!lastTransactionID || lastTransactionID.toString().trim() === "") {
            ctx.reply("🗑️ Could not retrieve transaction ID from last row.");
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

/**
 * ===== PHOTO MESSAGE HANDLER (PHASE 2.5 - OCR) =====
 */

/**
 * Handle photo messages
 * Routes to OCR handler in bot/ocrHandler.js
 * 
 * Photo message structure from Telegram:
 * ctx.message.photo = array of photo sizes
 * We take the highest resolution (last element)
 */
function handlePhotoMessageRouter(ctx) {
    const chatID = ctx.from.id;

    // Access control
    if (!isUserAllowed(chatID)) {
        ctx.reply(MSG_REJECT);
        return;
    }

    try {
        // Extract photo file_id from Telegram message
        // ctx.message.photo is an array of photo objects with different resolutions
        // Take the last (highest resolution) photo
        const photoArray = ctx.message.photo;

        if (!photoArray || photoArray.length === 0) {
            Logger.log("⚠️ Photo message received but photo array is empty");
            ctx.reply("❌ Gagal membaca foto");
            return;
        }

        // Get the highest resolution photo (last in array)
        const photoFileId = photoArray[photoArray.length - 1].file_id;

        Logger.log(`📸 Photo message received from ${chatID}`);

        // Pass to OCR handler
        handlePhotoMessage(ctx, photoFileId);

    } catch (error) {
        Logger.log(`❌ Error in photo router: ${error.message}`);
        ctx.reply("❌ Gagal membaca foto");
    }
}

/**
 * ===== NATURAL LANGUAGE HANDLER =====
 */

/**
 * Handle natural language messages
 * Routes to AI interpretation layer via aiMessageHandler
 */
function handleNaturalLanguage(ctx) {
    const chatID = ctx.from.id;

    // Access control
    if (!isUserAllowed(chatID)) {
        ctx.reply(MSG_REJECT);
        return;
    }

    const userPrompt = ctx.message.text.trim();

    // Pass to AI handler
    try {
        aiMessageHandler(ctx, userPrompt);
    } catch (error) {
        Logger.log("Error in natural language handler: " + error.message);
        ctx.reply("🤖 An error occurred while processing your request. Please try again.");
    }
}

