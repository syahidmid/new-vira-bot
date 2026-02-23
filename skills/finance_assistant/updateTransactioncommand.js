
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
    let pesan = `🤖 Transaction with ID ${id} has been updated:\n\n`;

    const flagPatterns = {
        "-cat": { regex: /-cat "([^"]+)"/, fn: updateCategoryValidated },
        "-tag": { regex: /-tag "([^"]+)"/, fn: updateTagValidated },
        "-amount": { regex: /-amount "([^"]+)"/, fn: updateAmountValidated },
        "-note": { regex: /-note "([^"]+)"/, fn: updateNoteValidated },
        "-expensesname": { regex: /-expensesname "([^"]+)"/, fn: updateExpenseNameValidated }, // fix typo juga
    };

    let handled = false;

    for (const [flag, { regex, fn }] of Object.entries(flagPatterns)) {
        if (text.includes(flag)) {
            const match = text.match(regex);
            if (!match) {
                pesan = `⚠️ Format salah untuk flag \`${flag}\`.\nContoh: \`${flag} "nilai"\``;
            } else {
                fn(id, match[1]);
                pesan += printTransaction(id);
            }
            handled = true;
            break;
        }
    }

    if (!handled) {
        pesan = `🤖 Invalid input. Please provide valid update commands.\n${MSG_UPDATE_COMMANDS}`;
    }

    ctx.replyWithMarkdown(pesan);
}