/**
 * =============================================================================
 * bot/ui/message.js
 * =============================================================================
 * 
 * RESPONSIBILITY:
 * Centralize all bot UI text responses (no logic, no conditionals)
 * 
 * RULES:
 * - Message templates ONLY (no functions with logic)
 * - Simple template strings with placeholders (using %s or ${})
 * - No if/else statements
 * - No database access
 * - No API calls
 * 
 * NAMING CONVENTION:
 * - All message exports MUST be prefixed with MSG_ (message)
 * - Example: MSG_START, MSG_HELP, MSG_REJECT
 * 
 * TEMPLATES:
 * - Strings with %s → Use String.replace('%s', value) or similar
 * - Strings with ${} → Wrap in function if dynamic
 * - Fixed strings → Export as-is
 * 
 * =============================================================================
 */

/**
 * MSG_START: Welcome message displayed on /start
 * Placeholder: %s = firstName
 * Example: "😀 Hi Syahid! Aku Vira, asisten virtualmu..."
 */
const MSG_START = `😀 Hi %s! Aku Vira, asisten virtualmu. Siap membantu kamu mengelola keuangan.`;

/**
 * MSG_HELP: Help/command list (HTML formatted)
 * Displays all available commands and their usage
 */
const MSG_HELP = `
    🤖 <b>List of Commands:</b>

    /start - Start interacting with the bot.

    💳 <b>Credit Command:</b>
    To log spending: #Credit Spending Name Total
    e.g. #Credit Ice Cream 20000

    📉 <b>Debit Command:</b>
    To log expenses: #Debit Expenses Name Total
    e.g. #Debit November Salary 20000000

    🗑️ <b>Delete Transaction:</b>
    To delete a transaction: #Delete TransactionID
    e.g. #Delete kbtf

    🔄 <b>Update Transaction Category:</b>
    To update transaction category: #Update TransactionID -cat "New Category"
    e.g. #Update kbtf -cat "Groceries"

    🔄 <b>Update Transaction Tag:</b>
    To update transaction tag: #Update TransactionID -tag "New Tag"
    e.g. #Update kbtf -tag "Food"

    📅 <b>Transaction History:</b>
    To view transactions for the last N days: #Transactions N
    e.g. #Transactions 5

    Feel free to explore and use these commands. If you have any questions, I'm here to help! 😊
  `;

/**
 * MSG_REJECT: Access denied message
 * Displayed when unauthorized user tries to access bot
 */
const MSG_REJECT = `⛔ Akses ditolak. Kamu tidak memiliki izin untuk menggunakan bot ini.`;

/**
 * MSG_UPDATE_COMMANDS: List of update command formats
 * Reference for user on how to update transaction fields
 */
const MSG_UPDATE_COMMANDS = `
#Update ID -cat "New Category"
#Update ID -tag "New Tag"
#Update ID -amount "New Amount"
#Update ID -note "New Note"
#Update ID -expensesname "New Name"
`;

/**
 * Helper function: Build spending input instruction message
 * 
 * @param {string} firstName - User's first name
 * @return {string} - Formatted instruction message
 */
function buildMsgInputSpending(firstName) {
    return `
😀 Oke *${firstName}*, silakan input pengeluaranmu dengan format berikut ini, ya!

\`\`\`
#Spending Nama Pengeluaran Nominal 
\`\`\`

Contoh:
#Spending Kopi Kenangan 25000
`;
}

/**
 * Helper function: Build income input instruction message
 * 
 * @param {string} firstName - User's first name
 * @return {string} - Formatted instruction message
 */
function buildMsgInputIncome(firstName) {
    return `
😀 Oke *${firstName}*, silakan input pemasukanmu dengan format berikut ini, ya!

\`\`\`
#Income Nama Pemasukan Nominal 
\`\`\`

Contoh:
#Income Gaji Bulan Mei 8000000
`;
}

/**
 * ===== CATEGORY WIZARD MESSAGES =====
 */

/**
 * MSG_WIZARD_CATEGORY_ASK_NAME: First step - ask for spending name
 */
const MSG_WIZARD_CATEGORY_ASK_NAME = `
📝 Mari kita tambahkan kategori default untuk pengeluaranmu!

Silakan masukkan nama pengeluaran yang ingin kamu simpan.

Contoh: "Nasi uduk", "Kopi Kenangan", "Bensin", dll.

Atau kirim /cancel untuk membatalkan.
`;

/**
 * MSG_WIZARD_CATEGORY_ASK_CATEGORY: Second step - ask for category
 * Placeholder: %s = spendingName (user input from step 1)
 */
const MSG_WIZARD_CATEGORY_ASK_CATEGORY = `
📂 Baik, untuk pengeluaran "*%s*"...

Sekarang silakan masukkan kategori yang sesuai untuk pengeluaran ini.

Contoh kategori: "Food and Drink", "Transportation", "Healthcare", "Entertainment", dll.

Atau kirim /cancel untuk membatalkan.
`;

/**
 * MSG_WIZARD_CATEGORY_CONFIRM: Third step - confirmation
 * Placeholder: %spendingName = spending name, %category = category
 */
const MSG_WIZARD_CATEGORY_CONFIRM = `
✅ *Konfirmasi Kategori Default*

Pengeluaran: *%spendingName*
Kategori: *%category*

Apakah data di atas sudah benar?

Silakan jawab "*Ya*" atau "*Tidak*".
`;

/**
 * MSG_WIZARD_CATEGORY_SUCCESS: Success message after confirmation
 */
const MSG_WIZARD_CATEGORY_SUCCESS = `
✅ Berhasil! Kategori default untuk pengeluaranmu telah disimpan.

Setiap kali kamu mencatat pengeluaran dengan nama ini, bot akan otomatis menerapkan kategori yang sama.

Kembali ke menu utama.
`;

/**
 * MSG_WIZARD_CATEGORY_CANCELLED: Cancellation message
 */
const MSG_WIZARD_CATEGORY_CANCELLED = `
❌ Dibatalkan. Kategori default tidak disimpan.

Kembali ke menu utama.
`;
