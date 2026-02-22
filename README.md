# Vira Bot - Telegram Personal Finance Manager

A **Google Apps Script-based Telegram bot** for tracking personal spending and income with AI-assisted natural language processing and receipt OCR recognition.

## Project Overview

**Vira** is a personal finance management bot that runs on Google Apps Script and integrates with Telegram. It allows users to:

- 💰 Log spending/income transactions via text commands, hashtag shortcuts, or natural language
- 📸 Extract receipt data from photos using OpenAI Vision OCR
- 📊 View spending reports by date ranges or categories
- 🤖 Use AI-powered natural language interpretation (powered by OpenAI GPT-4o-mini)
- 🔖 Bookmark URLs and manage transaction metadata
- ✏️ Update or delete transactions after creation

All data is persisted in a **Google Spreadsheet** using the **miniSheetDB2** library for abstracted database access.

---

## Architecture Overview

### Message Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      TELEGRAM USER MESSAGE                              │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │   code.js::doPost()│  ◄── Webhook entry point
                    └────────┬───────────┘
                             │
        ┌────────────────────┼────────────────────┬─────────────────┐
        │                    │                    │                 │
        ▼                    ▼                    ▼                 ▼
   ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐  ┌──────────┐
   │ SLASH COMMANDS  │  │ HASHTAG SHORTCUTS│ │PHOTO MESSAGE  │  │ NATURAL  │
   │                 │  │                 │  │ (OCR)         │  │LANGUAGE  │
   │ /start, /help  │  │ #Spending ...   │  │               │  │          │
   │ /quote, /update │  │ #Income ...     │  │               │  │          │
   │ /report         │  │ #Delete ...     │  │               │  │          │
   └────────┬────────┘  └────────┬────────┘  └───────┬───────┘  └────┬─────┘
            │                    │                    │              │
            │ DIRECT EXECUTION   │ DIRECT EXECUTION   │ OCR → AI    │ AI
            │                    │                    │              │
            └────────────────────┴────────────────────┴──────┬───────┘
                                                              │
                                                   ┌──────────▼─────────────┐
                                                   │  ai/openAi.js          │
                                                   │  parseUserMessage()    │
                                                   │  Returns: {intent,     │
                                                   │           payload}     │
                                                   └──────────┬─────────────┘
                                                              │
                                                   ┌──────────▼─────────────┐
                                                   │ ai/intentMapper.js     │
                                                   │ executeIntent()        │
                                                   │ Routes to core/ logic  │
                                                   └──────────┬─────────────┘
                                                              │
                                   ┌──────────────────┬───────┼───────┬──────────────┐
                                   │                  │               │              │
                                   ▼                  ▼               ▼              ▼
                          ┌────────────────┐ ┌──────────────┐ ┌────────────┐ ┌───────────┐
                          │ core/spending  │ │ core/dbH-    │ │ core/va-   │ │ core/     │
                          │ .js            │ │ andlers.js   │ │ lidator.js │ │ setup.js  │
                          │                │ │              │ │            │ │           │
                          │ Business Logic │ │ DB Queries & │ │ Validation │ │ Init DB   │
                          │                │ │ Formatting   │ │ Rules      │ │ & Config  │
                          └────────┬───────┘ └──────┬───────┘ └────────────┘ └───────────┘
                                   │                │
                                   └────────┬───────┘
                                            │
                                   ┌────────▼───────────┐
                                   │ core/dbInit.js     │
                                   │                    │
                                   │ miniSheetDB2       │
                                   │ - dbSpending       │
                                   │ - dbIncome         │
                                   │ - dbReport         │
                                   │ - dbBookmarks      │
                                   │ - dbUserlog        │
                                   └────────┬───────────┘
                                            │
                                   ┌────────▼───────────┐
                                   │ Google Spreadsheet │
                                   │ (SSID_MONEY_MGT)   │
                                   └────────────────────┘
```

### Key Components

| Component | File | Purpose |
|-----------|------|---------|
| **Entry Point** | `code.js` | Apps Script webhook receiver; initializes bot instance; delegates to handlers |
| **Message Router** | `bot/handler.js` | Routes incoming Telegram messages to appropriate handlers (commands, hashtags, AI, OCR) |
| **AI Layer** | `ai/openAi.js` | Calls OpenAI API to interpret natural language → structured intent + payload |
| **Intent Mapper** | `ai/intentMapper.js` | Translates AI-interpreted intents into core function calls |
| **Business Logic** | `core/spending.js` | Core transaction operations (add, delete, update); no validation or DB access |
| **Validation** | `core/validator.js` | Pre-processing validation for all inputs before business logic |
| **DB Handlers** | `core/dbHandlers.js` | Query and formatting logic; reads from DB, structures response messages |
| **DB Initialization** | `core/dbInit.js` | Initializes miniSheetDB2 instances for all tables |
| **OCR Handler** | `bot/ocrHandler.js` | Extracts receipt data from Telegram photos via OpenAI Vision |
| **Webhook Config** | `bot/webhook.js` | Bot setup functions (token input, webhook registration, status checks) |
| **UI Templates** | `bot/ui/message.js`, `bot/ui/keyboard.js` | All Telegram message responses and keyboard layouts |
| **Debug Utils** | `utils/debug.js` | Development testing utilities (safe for production) |

---

## Folder & File Structure

```
virabot/
├── code.js                          # [ENTRY POINT] Apps Script webhook receiver
├── webhook.js                       # [STUB] Backward compatibility only
├── debug.js                         # [ROOT WRAPPER] Delegates to utils/debug.js
├── openAi.js                        # [ROOT WRAPPER] Delegates to ai/openAi.js
├── appsscript.json                 # Google Apps Script manifest (dependencies, config)
├── Sidebar.html                     # Sidebar UI for bot configuration
├── README.md                        # This file
│
├── ai/
│   ├── openAi.js                   # Parse natural language → {intent, payload}
│   └── intentMapper.js             # Execute intent → call core functions
│
├── bot/
│   ├── handler.js                  # [CORE] Message router; registers all handlers
│   ├── aiMessageHandler.js         # Bridge between handler & AI layer
│   ├── ocrHandler.js               # Photo → OCR → text extraction
│   ├── webhook.js                  # Bot configuration (token, webhook setup)
│   └── ui/
│       ├── message.js              # All MSG_* text templates
│       └── keyboard.js             # All KB_* keyboard layouts
│
├── core/
│   ├── spending.js                 # Business logic for transactions
│   ├── dbHandlers.js               # DB queries & message formatting
│   ├── validator.js                # Input validation rules
│   ├── setup.js                    # User onboarding & config
│   ├── dbInit.js                   # miniSheetDB2 instance initialization
│   └── spending.js                 # Spending-specific business logic
│
├── utils/
│   └── debug.js                    # Development utilities
│
└── _archive/
    ├── keyboard.js.bak             # Legacy keyboard code
    └── message.js.bak              # Legacy message code
```

### Important Entry Points

1. **`code.js::doPost(e)`** - Webhook receiver from Telegram (main entry point)
2. **`code.js::onOpen(e)`** - Apps Script UI menu initialization
3. **`bot/handler.js::setupMessageRouters(bot)`** - Registers all message routes
4. **`bot/webhook.js`** - Configuration functions (accessible from Apps Script menu)
5. **`core/dbInit.js`** - Initializes database connections on load

---

## Key Features

### 1. Slash Commands (No AI Required)

Direct execution with no interpretation:

```
/start       → Welcome message + main menu
/help        → Show command reference
/quote       → Random motivational quote
/update      → Show update syntax documentation
/report      → Generate spending report
```

**Handler:** `bot/handler.js::handleStartCommand()`, `handleHelpCommand()`, etc.

### 2. Hashtag Shortcuts

Quick transaction entry with direct parsing:

```
#Spending {name} {amount}           → Log expense
#Income {name} {amount}             → Log income
#Delete {transactionID}             → Delete by ID
#Update {ID} -cat "Category"        → Update category
#Update {ID} -tag "Tag"             → Update tag
#Transactions {days}                → View last N days
```

**Handler:** `bot/handler.js::handleHashtagSpending()`, etc.

### 3. Natural Language AI Processing

Flexible, conversational input interpreted by OpenAI:

```
User:  "Beli kopi tadi pagi 15000"
AI:    {intent: "ADD_SPENDING", payload: {expenseName: "kopi", amount: 15000}}

User:  "Show my spending last 7 days"
AI:    {intent: "GET_REPORT", payload: {startDate: "2026-01-16", endDate: "2026-01-23"}}

User:  "Delete transaction a1b2"
AI:    {intent: "DELETE_TRANSACTION", payload: {transactionId: "a1b2"}}
```

**Flow:**
1. User message → `bot/handler.js::handleNaturalLanguage()`
2. → `ai/openAi.js::parseUserMessage()` calls OpenAI
3. → `ai/intentMapper.js::executeIntent()` executes the intent
4. → Core functions perform business logic
5. Response sent back to user

### 4. Receipt OCR (Photo Processing)

Extract merchant and amount from receipt photos:

```
User sends photo
   ↓
bot/handler.js::handlePhotoMessageRouter()
   ↓
bot/ocrHandler.js::handlePhotoMessage()
   → Downloads image via Telegram API
   → Converts to base64
   → Sends to OpenAI Vision API with receipt parsing prompt
   → Extracts structured data
   ↓
Treated as natural language → AI processing
   ↓
Result returned to user
```

**Files:** `bot/ocrHandler.js` (lines 1-213)

### 5. Database Abstraction (miniSheetDB2)

All spreadsheet access via `miniSheetDB2` library (v5):

```javascript
// Initialization (core/dbInit.js)
var dbSpending = new miniSheetDB2.init(ssidMoneyManagement, "Spending", {
  col_length: 8,
  row_start: 2,
  col_start: 2,
  json: true,
});

// Usage in core/spending.js
const newRow = dbSpending.last_row + 1;
const saveRange = dbSpending.range(newRow, 2, 1, 7);
saveRange.setValues([recordValues]);
```

**Database Tables:**
- `Spending` - All expense transactions
- `Income` - All income transactions
- `Summary` - Reports and aggregated data
- `🐈‍⬛ Cat and Tag` - Category/tag metadata
- `⚙️Setting` - Bot configuration
- `Log` - User activity log
- `Bookmark` - Saved URLs

### 6. Validation Layer

All inputs validated in `core/validator.js` BEFORE reaching business logic:

```javascript
validateAmount(amount)        → Check positive number
validateExpenseName(name)     → Check non-empty string
validateCategory(category)    → Check against VALID_CATEGORIES list
validateDate(dateStr)         → Check YYYY-MM-DD format
```

**Returns:** `{valid: boolean, data?: sanitized, message?: error}`

### 7. Error Handling & Logging

- Try-catch blocks in all handlers
- Logger.log() for debugging (visible in Apps Script editor)
- User-facing error messages (emojis: ❌, ⚠️, 📸, ✅)
- Stack traces captured for critical errors

---

## Setup & Configuration

### Required Environment Variables

Store in **Google Apps Script Project Properties**:

| Property | Description | Example |
|----------|-------------|---------|
| `TOKEN_BOT` | Telegram Bot API token | `1234567890:ABCDEFghij-KLMNopqrst` |
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o-mini | `sk-...` |
| `ALLOWED_CHAT_IDS` | Comma-separated Telegram user IDs | `123456,789012,345678` |
| `TELEGRAM_ID` | (Legacy) Telegram user ID | `123456` |
| `DEPLOYMENT_ID` | Google Apps Script deployment ID | (auto-set) |
| `BOT_PASSWORD` | (Legacy) Bot password | (optional) |
| `SSID_MONEY_MANAGEMENT` | Spreadsheet ID for data storage | (auto-detected from active sheet) |

### External Services

1. **Telegram Bot API**
   - Create bot via [@BotFather](https://t.me/botfather)
   - Obtain `TOKEN_BOT`

2. **OpenAI API**
   - Create account at [OpenAI](https://openai.com)
   - Generate API key
   - Models used:
     - `gpt-4o-mini` - Natural language interpretation + receipt OCR

3. **Google Apps Script**
   - Projects automatically inherit spreadsheet context
   - Deployment type: **Web app** (Apps Script → New Deployment)
   - Execute as: User deploying script
   - Access: Anyone (anonymous)
   - Webhook URL: `https://script.google.com/macros/d/{DEPLOYMENT_ID}/userweb`

4. **Google Spreadsheet**
   - Create a new spreadsheet
   - Share it with Apps Script project
   - Spreadsheet ID automatically captured on first run

### Configuration Workflow

1. **Deploy Apps Script:**
   - Save all files
   - Apps Script → New deployment → Web app
   - Copy deployment URL

2. **Set Token:**
   - Open connected spreadsheet
   - Menu: `Telegram Bot` → `Settings` → `Input Token Bot`
   - Paste Telegram token

3. **Set OpenAI Key:**
   - Go to Apps Script Project Settings
   - Add `OPENAI_API_KEY` to Project Properties

4. **Register Webhook:**
   - Menu: `Telegram Bot` → `Settings` → `Set Webhook`
   - Verifies connection by calling Telegram API

5. **Add Authorized Users:**
   - Menu: `Telegram Bot` → `Settings` → `Add User`
   - Enter Telegram chat ID (get via `/start` in bot)

---

## How It Works

### Text Message Flow (Natural Language)

```
1. User: "Beli teh 10000"
   ↓
2. bot/handler.js::handleNaturalLanguage(ctx, "Beli teh 10000")
   - Access control check: isUserAllowed(ctx.from.id)
   ↓
3. ai/openAi.js::parseUserMessage("Beli teh 10000")
   - Build systemPrompt with today's date, rules, valid intents
   - Call OpenAI API (gpt-4o-mini)
   - Parse JSON response
   - Returns: {intent: "ADD_SPENDING", payload: {expenseName: "teh", amount: 10000}}
   ↓
4. ai/intentMapper.js::executeIntent(chatID, "ADD_SPENDING", payload)
   - Validate payload
   - Call core/spending.js::handleAddSpending(payload)
   ↓
5. core/validator.js::validateSpendingInput(payload)
   - Validate amount > 0
   - Validate expenseName non-empty
   - Validate category exists
   - Returns: {valid: true, data: sanitized}
   ↓
6. core/spending.js::addSpendingFromValidated(validData)
   - Generate 4-char transaction ID
   - Create transaction record
   - Write to dbSpending via miniSheetDB2
   - Returns: {success: true, data: {...}}
   ↓
7. bot/handler.js sends response to user:
   ✅ Pengeluaran dicatat: Teh - IDR 10.000
```

### Photo / Receipt OCR Flow

```
1. User sends photo
   ↓
2. bot/handler.js::handlePhotoMessageRouter(ctx)
   - Extract photo file_id from Telegram message
   ↓
3. bot/ocrHandler.js::handlePhotoMessage(ctx, photoFileId)
   - Send feedback: "📸 Foto diterima. Sedang dianalisis struk..."
   ↓
4. bot/ocrHandler.js::askOpenAIReceiptToTextCommand(photoFileId)
   - Get file path from Telegram: /getFile/{file_id}
   - Download image bytes via Telegram API
   - Detect MIME type (JPEG, PNG, etc)
   - Convert to base64
   - Send to OpenAI Vision with prompt:
     "Extract merchant name and amount from this receipt. 
      Return as command: #Spending {merchant} {amount}"
   - Parse response
   - Returns: {text: "#Spending KFC 45000", confidence: 0.95}
   ↓
5. bot/handler.js::handleUpdate(result.text)
   - Treats OCR text as if user typed it
   - Routes through hashtag parser OR natural language
   ↓
6. Result sent to user: ✅ Struk diterima. Sedang dicatat.
```

### Data Persistence Flow

```
User transaction (spending/income)
   ↓
core/spending.js::addSpendingFromValidated()
   ↓
Generate unique ID: generateTransactionId()
   ↓
Prepare record: {id, date, expenseName, category, amount, tag, note}
   ↓
Get dbSpending instance from core/dbInit.js
   ↓
dbSpending.range(newRow, 2, 1, 7).setValues([recordValues])
   ↓
miniSheetDB2 writes to Google Spreadsheet "Spending" sheet
   ↓
Database persisted (survives bot restart)
   ↓
When user requests report:
   core/dbHandlers.js::getDataByDateRange()
   → Reads from dbSpending
   → Filters by date
   → Formats response
   → Sends to user
```

---

## Known Limitations & TODOs

### Phase 2.5+ Notes (from code comments)

- **OCR Processing:** PHASE 2.5 currently active
  - Receipt extraction via OpenAI Vision functional
  - Confidence scoring returned but not used for validation
  - Could be improved with custom vision model training

- **Category Typo:** `"Famliy"` preserved in `VALID_CATEGORIES` for DB compatibility
  - Appears to be intentional legacy value
  - If fixed, old transactions won't match

### Known Issues & Edge Cases

1. **Date Handling:**
   - All dates assume GMT+7 timezone (hardcoded)
   - Daylight saving time not considered
   - Relative dates ("today", "yesterday") computed at request time, not storage time

2. **AI Interpretation:**
   - OpenAI API calls add ~1-2 second latency
   - No caching of AI responses
   - gpt-4o-mini sometimes misinterprets currency (IDR vs USD)
   - No validation of AI output before executing intent

3. **Transaction ID Generation:**
   - Uses timestamp hash (deterministic within same millisecond)
   - No guaranteed uniqueness if multiple rapid transactions created
   - Consider UUID or sequence number for production scale

4. **Access Control:**
   - Currently allows any user in `ALLOWED_CHAT_IDS` full access
   - No role-based permissions (admin, read-only, etc)
   - No rate limiting on API calls

5. **Photo Processing:**
   - Requires photo to be <5MB (Telegram limit)
   - Only JPG/PNG supported (not PDF)
   - Receipt parsing prompt not optimized for non-English receipts
   - No fallback if OCR fails

6. **Spreadsheet Structure:**
   - Assumes specific sheet names ("Spending", "Income", "Summary", etc)
   - No migration logic if structure changes
   - No data validation at spreadsheet level

7. **Backward Compatibility:**
   - Root-level `webhook.js` and `debug.js` are stubs for backward compatibility
   - Actual code lives in `bot/webhook.js` and `utils/debug.js`
   - Could be removed once all references updated

### Missing Validations

- No phone number / email format validation
- No duplicate transaction detection
- No amount ceiling/floor validation
- No category/tag whitelist enforcement at input time
- No transaction history audit trail

### Assumptions Made

1. Spreadsheet exists and is accessible to Apps Script
2. User has valid Telegram chat ID
3. OpenAI API key is valid and account has quota
4. All timestamps in spreadsheet are YYYY-MM-DD format
5. Sheet structure matches `dbInit.js` configuration (row_start, col_start, etc)
6. Only one user running bot (singleton bot instance in `code.js`)

---

## Development Notes

### Where to Add New Commands

**File:** `bot/handler.js`

```javascript
function setupMessageRouters(bot) {
    // Add new command here
    bot.command('newcommand', handleNewCommand);
}

// Define handler
function handleNewCommand(ctx) {
    const chatID = ctx.from.id;
    if (!isUserAllowed(chatID)) {
        ctx.reply(MSG_REJECT);
        return;
    }
    // Your logic here
}
```

**Guidelines:**
- Add access control check first (`isUserAllowed()`)
- Use `bot/ui/message.js` for text templates
- Use `bot/ui/keyboard.js` for keyboard layouts
- Never access database directly; use `core/` functions
- Return response via `ctx.reply()` or `ctx.replyWithMarkdown()`

### Where to Modify OCR Logic

**File:** `bot/ocrHandler.js`

Key functions:
- `handlePhotoMessage()` - Entry point for photo handling
- `askOpenAIReceiptToTextCommand()` - OpenAI Vision call
- `telegramFileIdToBase64()` - Image download & encoding

To modify prompt:
```javascript
// In askOpenAIReceiptToTextCommand(), modify this string:
const systemPrompt = `
  [Your custom OCR prompt here]
  Ensure output is valid JSON: {text: "...", confidence: ...}
`;
```

### Where to Add Database Logic

**File:** `core/dbHandlers.js` (for queries) or `core/spending.js` (for transactions)

```javascript
// Query example (dbHandlers.js)
function getDataByDateRange(daysAgo) {
    const TZ = "GMT+7";
    let data = dbSpending.last_row; // Get all rows
    // Filter, format, return
}

// Business logic example (spending.js)
function addSpendingFromValidated(input) {
    const transactionData = { ... };
    dbSpending.range(...).setValues([recordValues]);
    return { success: true, data: transactionData };
}
```

**Separation of Concerns:**
- `core/spending.js` - Write operations, business logic
- `core/dbHandlers.js` - Read operations, formatting
- `core/validator.js` - Input validation (before DB access)
- `core/dbInit.js` - DB initialization only

### Where to Add AI Intents

**File:** `ai/intentMapper.js`

```javascript
function executeIntent(chatID, intent, payload) {
    switch (intent) {
        case "NEW_INTENT":
            return handleNewIntent(payload);
        // ...
    }
}

function handleNewIntent(payload) {
    // Validate payload
    // Call core function
    // Return { success, message }
}
```

**Also update:**
- `ai/openAi.js` - Add new intent to systemPrompt + examples
- `bot/ui/message.js` - Add response templates
- `core/` - Add business logic function if needed

### Where to Modify Validation Rules

**File:** `core/validator.js`

```javascript
const VALID_CATEGORIES = [
    "Accounts Receivable",
    // ... add new category
];

function validateAmount(amount) {
    // Modify rules here
    // Return { valid, data?, message? }
}
```

### How to Test Locally

**File:** `utils/debug.js`

```javascript
// Edit testAIMessageHandler() or debugMode()
// Run from Apps Script editor: Run → function name
// Output appears in Apps Script Logs
```

Or use `bot/webhook.js::processInput()` to manually test configuration.

### Debugging Tips

1. **Check Logs:** Apps Script editor → Executions → View logs
2. **Test Messages:** `utils/debug.js::debugMode()` → hardcode test message
3. **Check Database:** Open connected spreadsheet → inspect "Spending" sheet
4. **Verify Config:** `bot/webhook.js::getBotStatus()` → check webhook connection
5. **Monitor API Calls:** Logger.log() in `ai/openAi.js` and `bot/ocrHandler.js`

---

## Summary

| Aspect | Technology |
|--------|-----------|
| **Platform** | Google Apps Script (V8 runtime) |
| **Bot Framework** | lumpia (Telegram bot wrapper) |
| **Database** | Google Spreadsheet + miniSheetDB2 (v5) |
| **AI / NLP** | OpenAI GPT-4o-mini |
| **Vision / OCR** | OpenAI Vision |
| **Deployment** | Google Apps Script Web App (webhook) |
| **Language** | JavaScript (Apps Script dialect) |
| **Timezone** | GMT+7 (hardcoded) |

**Total Lines of Code:** ~3000+ across all modules

**Main Entry Point:** `code.js::doPost(e)` (receives Telegram webhooks)

**Maintenance:** Update in-place; Apps Script auto-deploys on save

---

## License & Credits

- **Framework:** lumpia (Telegram bot library)
- **Database:** miniSheetDB2 (v5)
- **Helper:** WizardDua (scene/stage management)
- **Author:** Syahid Muhammad
- **Timezone:** Asia/Jakarta (GMT+7)

For questions or issues, refer to code comments in respective files or check `utils/debug.js` for testing utilities.