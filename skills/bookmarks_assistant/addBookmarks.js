
/**
 * Handle URL messages: Save bookmarks
 */
function handleURLBookmark(ctx) {
    const chatID = ctx.from.id;

    // Access control
    if (!isUserAllowed(chatID)) {
        ctx.reply(MSG_REJECT);
        return;
    }

    const userFirstName = ctx.from.first_name;
    const userLastName = ctx.from.last_name || '';
    const fullName = `${userFirstName} ${userLastName}`;
    const username = ctx.update.message.chat.username;
    const message = ctx.message.text;
    const date = new Date();
    const savedDate = Utilities.formatDate(date, "GMT+7", "dd MMMM yyyy");

    const urlRegex = /(https?:\/\/\S+)/;
    const url = message.match(urlRegex)[1];

    // Save URL to the spreadsheet
    const newRow = dbBookmarks.last_row + 1;
    const saveBookmark = dbBookmarks.range(newRow, 1, 1, 5);
    const recordValues = [chatId, fullName, username, url, savedDate];
    saveBookmark.setValues([recordValues]);

    const response = `📚 Bookmark added successfully!\n\nURL: ${url}\nDate: ${savedDate}`;

    const bookmarksKeyboard = [
        ["Show Bookmarks"],
        ["Back to Start"]
    ];

    ctx.replyWithMarkdown(response, {
        reply_markup: {
            keyboard: bookmarksKeyboard,
            resize_keyboard: true,
            one_time_keyboard: true,
        }
    });
}