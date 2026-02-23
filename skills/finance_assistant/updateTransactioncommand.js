
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
        "-cat": { regex: /-cat "([^"]+)"/, fn: updateCategoryValidated, label: "Kategori" },
        "-tag": { regex: /-tag "([^"]+)"/, fn: updateTagValidated, label: "Tag" },
        "-amount": { regex: /-amount "([^"]+)"/, fn: updateAmountValidated, label: "Nominal" },
        "-note": { regex: /-note "([^"]+)"/, fn: updateNoteValidated, label: "Catatan" },
        "-expensesname": { regex: /-expensesname "([^"]+)"/, fn: updateExpenseNameValidated, label: "Nama transaksi" },
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