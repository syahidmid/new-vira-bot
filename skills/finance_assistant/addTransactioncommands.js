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
