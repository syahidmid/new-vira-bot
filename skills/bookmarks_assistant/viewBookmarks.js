
/**
 * Handle menu button: Show Bookmarks
 */
function handleMenuShowBookmarks(ctx) {
    const chatID = ctx.from.id;

    // Access control
    if (!isUserAllowed(chatID)) {
        ctx.reply(MSG_REJECT);
        return;
    }

    try {
        const bookmarks = getLatestBookmarks(10);

        if (bookmarks.length === 0) {
            ctx.reply("📭 Belum ada bookmark yang tersimpan.");
            return;
        }

        let response = "📚 *10 Bookmark Terbaru:*\n\n";

        bookmarks.forEach((item, index) => {
            response += `*${index + 1}. ${item.name}* (@${item.username})\n`;
            response += `[🔗 ${item.url}](${item.url})\n`;
            response += `📅 ${item.date.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
            })}\n\n`;
        });

        const keyboard = [
            [button.text("🔄 Back to Start", "start")]
        ];

        ctx.replyWithMarkdown(response, {
            disable_web_page_preview: true,
            reply_markup: markup.inlineKeyboard(keyboard),
        });
    } catch (err) {
        ctx.reply("❌ Terjadi kesalahan saat mengambil data bookmark.");
    }
}