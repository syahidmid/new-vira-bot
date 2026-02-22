
/**
 * Handle #Transactions N
 * Show last N transactions
 */
function handleHashtagTransactions(ctx) {
    const chatID = ctx.from.id;

    // Access control
    if (!isUserAllowed(chatID)) {
        ctx.reply(MSG_REJECT);
        return;
    }

    const rowCount = parseInt(ctx.match[1]) || 10;
    const response = getRecentSpending(rowCount);

    ctx.replyWithMarkdown(response, {
        reply_markup: {
            keyboard: KB_TRANSACTION_MENU,
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    });
}