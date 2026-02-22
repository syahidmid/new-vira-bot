/**
 * Handle /start command
 */
function handleStartCommand(ctx) {
    var chatId = ctx.from.id.toString();
    var nama = ctx.from.first_name || 'Kamu';

    // Kalau sudah terdaftar → welcome normal
    if (isUserAllowed(chatId)) {
        ctx.reply(
            '👋 Halo, *' + nama + '*!\n\n' +
            'Selamat datang di *Vira Bot* 🤖\n' +
            'Bot pencatat pengeluaran & pemasukan pribadimu.\n\n' +
            '📋 *Perintah tersedia:*\n' +
            '/start — Tampilkan pesan ini\n' +
            '/bantuan — Panduan lengkap\n\n' +
            '_Bot siap digunakan!_',
            { parse_mode: 'Markdown' }
        );
        return;
    }

    // Belum terdaftar → kasih tau Chat ID mereka
    ctx.reply(
        '👋 Halo, *' + nama + '*!\n\n' +
        '🔒 Kamu belum terdaftar di bot ini.\n\n' +
        'Berikan Chat ID berikut ke admin:\n' +
        '`' + chatId + '`\n\n' +
        '_Admin akan menambahkanmu via panel pengaturan._',
        { parse_mode: 'Markdown' }
    );
}

/**
 * Handle /help command
 */
function handleHelpCommand(ctx) {
    const chatID = ctx.from.id;

    // Access control
    if (!isUserAllowed(chatID)) {
        ctx.reply(MSG_REJECT);
        return;
    }

    ctx.replyWithHTML(MSG_HELP);
}