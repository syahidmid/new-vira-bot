function printspendingTransaction(id) {
    const record = getDbSpending().key(id);
    if (record) {
        const transactionID = id;
        const date = record.data[1];
        const formattedDate = Utilities.formatDate(date, "GMT+7", "E MMM dd yyyy");
        const expenseName = record.data[2];
        const amount = parseFloat(record.data[4] || 0); // Mengambil data amount sebagai angka
        const category = record.data[3] || " ";
        const tag = record.data[5] || " ";
        const note = record.data[6] || " ";

        const formattedAmount = new Intl.NumberFormat("en-US").format(amount); // Format amount sebagai ribuan

        const pesan = `📅 Record date: ${formattedDate}
🎲 Transaction ID: \`${transactionID}\`
🐳 Expenses Name: ${expenseName}
💰 Amount: Rp${formattedAmount}
😼 Category: ${category}
🔖 Tag: ${tag}
📝 Note: ${note}`;
        return pesan;
    } else {
        return `Transaction with ID ${id} not found.`;
    }
}

function printincomeTransaction(id) {
    const record = dbIncome.key(id);
    if (record) {
        const transactionID = id;
        const date = record.data[1];
        const formattedDate = Utilities.formatDate(date, "GMT+7", "E MMM dd yyyy");
        const incomeName = record.data[2];
        const amount = parseFloat(record.data[4] || 0);
        const category = record.data[3] || " ";
        const tag = record.data[5] || " ";
        const note = record.data[6] || " ";

        const formattedAmount = new Intl.NumberFormat("en-US").format(amount);

        const pesan = `📅 Record date: ${formattedDate}
🎲 Transaction ID: \`${transactionID}\`
📥 Income Name: ${incomeName}
💰 Amount: Rp${formattedAmount}
😼 Category: ${category}
🔖 Tag: ${tag}
📝 Note: ${note}`;

        return pesan;
    } else {
        return `Transaction with ID ${id} not found.`;
    }
}
