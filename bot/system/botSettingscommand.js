/**
 * Settings
 * Direct command entry point (one-step, no wizard)
 */
function handleSettingsCommand(ctx) {
    const chatID = ctx.from.id;

    // Access control
    if (!isUserAllowed(chatID)) {
        ctx.reply(MSG_REJECT);
        return;
    }

    const name =
        ctx.from.first_name ||
        ctx.from.username ||
        'user';

    const message = `ok ${name}, what would you like to adjust?`;

    ctx.replyWithMarkdown(message, {
        reply_markup: {
            keyboard: KB_SETTINGS_MENU,
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    });
}
