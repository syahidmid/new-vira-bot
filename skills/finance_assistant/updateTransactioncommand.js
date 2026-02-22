
/**
 * Handle #Update TRANSACTION_ID with flags like -cat, -tag, -amount, -note, -expensesname
 * Direct execution - no AI needed
 */
function handleHashtagUpdate(ctx) {
    const chatID = ctx.from.id;

    // Access control
    if (!isUserAllowed(chatID)) {
        ctx.reply(MSG_REJECT);
        return;
    }

    const id = ctx.match[1];
    let pesan = `🤖 Transaction with ID ${id} has been updated:\n\n`;

    const text = ctx.message.text;

    if (text.includes("-cat")) {
        const catRegex = /-cat "([^"]+)"/;
        const newCategory = text.match(catRegex)[1];
        updateCat(id, newCategory);
        pesan += printspendingTransaction(id);
    } else if (text.includes("-tag")) {
        const tagRegex = /-tag "([^"]+)"/;
        const newTag = text.match(tagRegex)[1];
        updateTag(id, newTag);
        pesan += printspendingTransaction(id);
    } else if (text.includes("-amount")) {
        const amountRegex = /-amount "([^"]+)"/;
        const newAmount = text.match(amountRegex)[1];
        updateAmount(id, newAmount);
        pesan += printspendingTransaction(id);
    } else if (text.includes("-note")) {
        const noteRegex = /-note "([^"]+)"/;
        const newNote = text.match(noteRegex)[1];
        updateNote(id, newNote);
        pesan += printspendingTransaction(id);
    } else if (text.includes("-expensesname")) {
        const expensesnameRegex = /-expensesname "([^"]+)"/;
        const newExpansename = text.match(expensesnameRegex)[1];
        updateExpansename(id, newExpansename);
        pesan += printspendingTransaction(id);
    } else {
        pesan = `🤖 Invalid input. Please provide valid update commands.\n${MSG_UPDATE_COMMANDS}`;
    }

    ctx.replyWithMarkdown(pesan);
}


function updateExpansename(id, expenseName) {
    const record = dbSpending.search(id);

    if (record) {
        const rowIndex = record.row;
        const currentData = dbSpending.range(rowIndex, 2, 1, 7).getValues()[0];
        currentData[2] = expenseName; // Update expenseName di indeks 2
        dbSpending.range(rowIndex, 2, 1, 7).setValues([currentData]);
    }
}

function updateCat(id, newCategory) {
    const record = dbSpending.key(id);

    if (record) {
        const rowIndex = record.row;
        const currentData = dbSpending.range(rowIndex, 2, 1, 7).getValues()[0];
        currentData[3] = newCategory;
        dbSpending.range(rowIndex, 2, 1, 7).setValues([currentData]);
    }
}

function updateAmount(id, newAmount) {
    const record = dbSpending.key(id);

    if (record) {
        const rowIndex = record.row;
        const currentData = dbSpending.range(rowIndex, 2, 1, 7).getValues()[0];
        currentData[4] = newAmount; // Update the Amount
        dbSpending.range(rowIndex, 2, 1, 7).setValues([currentData]);
    }
}

function updateTag(id, newTag) {
    const record = dbSpending.key(id);

    if (record) {
        const rowIndex = record.row;
        const currentData = dbSpending.range(rowIndex, 2, 1, 7).getValues()[0];
        currentData[5] = newTag;
        dbSpending.range(rowIndex, 2, 1, 7).setValues([currentData]);
    }
}

function updateNote(id, note) {
    const record = dbSpending.key(id);

    if (record) {
        const rowIndex = record.row;
        const currentData = dbSpending.range(rowIndex, 2, 1, 7).getValues()[0];
        currentData[6] = note;
        dbSpending.range(rowIndex, 2, 1, 7).setValues([currentData]);
    }
}
