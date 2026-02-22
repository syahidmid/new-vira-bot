function printTransaction(id) {
    const record = getDbTransactions().key(id);
    if (record) {
        const date = record.data[1];
        const formattedDate = Utilities.formatDate(date, "GMT+7", "E MMM dd yyyy");
        const name = record.data[2];
        const type = record.data[3];
        const category = record.data[4] || " ";
        const amount = parseFloat(record.data[5] || 0);
        const tag = record.data[6] || " ";
        const account = record.data[7] || " ";
        const note = record.data[8] || " ";

        const formattedAmount = new Intl.NumberFormat("en-US").format(amount);
        const typeEmoji = type === "income" ? "🟢" : "🔴";

        const pesan = `*Record date:* ${formattedDate}
*Transaction ID:* \`${id}\`
*Type:* ${type}
*Name:* ${name}
*Amount:* Rp${formattedAmount}
*Category:* ${category}
*Tag:* ${tag}
*Account:* ${account}
*Note:* ${note}`;

        return pesan;
    } else {
        return `Transaction with ID ${id} not found.`;
    }
}


// Legacy code, will be refactored later
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
