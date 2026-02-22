/**
 * Handle /ping command (connection test)
 */
function handlePingCommand(ctx) {
    const chatID = ctx.from.id;

    // Access control
    if (!isUserAllowed(chatID)) {
        ctx.reply(MSG_REJECT);
        return;
    }

    ctx.reply('pong! 🏓');
}

/**
 * /whoiam
 * Show basic identity information from Telegram context
 */
function handleWhoIAmCommand(ctx) {
    var from = ctx.from || {};
    var chat = ctx.chat || {};

    var userId = from.id || '-';
    var username = from.username ? '@' + from.username : '-';
    var channel = chat.type || 'telegram';

    var message =
        '🧭 *Identity*\n' +
        'Channel: ' + channel + '\n' +
        'User id: ' + userId + '\n' +
        'Username: ' + username + '\n' +
        'AllowFrom: ' + userId;

    ctx.replyWithMarkdown(message);
}
