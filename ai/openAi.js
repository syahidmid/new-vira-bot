/**
 * =============================================================================
 * ai/openAi.gs
 * =============================================================================
 * 
 * RESPONSIBILITY: 
 * SINGLE FUNCTION: parseUserMessage(userText) → {intent, payload}
 * 
 * AI SCOPE:
 * - ONLY interprets natural language user messages into structured JSON
 * - Returns intent (what user wants to do) + payload (parameters)
 * - Does NOT access spreadsheets
 * - Does NOT call business logic
 * - Does NOT know internal function names or core details
 * 
 * AI CANNOT:
 * - Make decisions about saving/deleting
 * - Validate data
 * - Know spreadsheet structure
 * - Call database functions
 * - Call core business logic
 * 
 * VALID INTENTS:
 * - ADD_SPENDING
 * - ADD_INCOME
 * - GET_REPORT
 * - DELETE_TRANSACTION
 * - UPDATE_TRANSACTION
 * - UNKNOWN (when interpretation fails)
 * 
 * EXAMPLE OUTPUT:
 * {
 *   "intent": "ADD_SPENDING",
 *   "payload": {
 *     "expenseName": "Kopi Kenangan",
 *     "amount": 25000,
 *     "category": "Food and Drink",
 *     "tag": "Coffee",
 *     "dateOffset": 0
 *   }
 * }
 * 
 * =============================================================================
 */

/**
 * Main entry point: Parse natural language user message into structured intent + payload
 * @param {String} userText - Natural language message from user
 * @return {Object} {intent: string, payload: object} or {intent: "UNKNOWN"}
 */
function parseUserMessage(userText) {
    if (!userText || userText.trim() === "") {
        return { intent: "UNKNOWN", payload: {} };
    }

    const apiKey = PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY");
    if (!apiKey) {
        Logger.log("⚠️ OPENAI_API_KEY not configured");
        return { intent: "UNKNOWN", payload: {} };
    }

    try {
        // Get today's date to help AI understand relative dates
        const TZ = "GMT+7";
        const today = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd");

        const systemPrompt = `You are a financial message interpreter for a Telegram bot.
Your ONLY job is to understand what the user wants and translate it to JSON.

Today's date is ${today} (GMT+7).
Rules for date interpretation:
- "today" = today
- "yesterday" = today - 1 day
- "last N days" = start N days ago, end today
- Only respond in valid JSON, no markdown or code blocks.

Respond with ONE of these intents:

1. ADD_SPENDING: User wants to record an expense
   {
     "intent": "ADD_SPENDING",
     "payload": {
       "expenseName": "string (required)",
       "amount": number (required),
       "category": "string (optional)",
       "tag": "string (optional)",
       "dateOffset": number (0 for today, -1 for yesterday, etc)
     }
   }

2. ADD_INCOME: User wants to record income
   {
     "intent": "ADD_INCOME",
     "payload": {
       "incomeName": "string (required)",
       "amount": number (required),
       "category": "string (optional)",
       "tag": "string (optional)",
       "dateOffset": number (0 for today, -1 for yesterday, etc)
     }
   }

3. GET_REPORT: User wants to see transaction history
   {
     "intent": "GET_REPORT",
     "payload": {
       "startDate": "yyyy-MM-dd",
       "endDate": "yyyy-MM-dd",
       "reportMessage": "short greeting message"
     }
   }

4. DELETE_TRANSACTION: User wants to delete a transaction
   {
     "intent": "DELETE_TRANSACTION",
     "payload": {
       "transactionId": "string (4-char ID)"
     }
   }

5. UPDATE_TRANSACTION: User wants to update a transaction
   {
     "intent": "UPDATE_TRANSACTION",
     "payload": {
       "transactionId": "string (4-char ID)",
       "field": "category|tag|amount|note|expenseName",
       "newValue": "string or number"
     }
   }

6. UNKNOWN: If you cannot determine the intent
   {
     "intent": "UNKNOWN",
     "payload": {}
   }

Examples:
- User: "Nasi lengko 18000" → ADD_SPENDING with expenseName="Nasi lengko", amount=18000
- User: "Spending yesterday coffee 30000" → ADD_SPENDING, amount=30000, dateOffset=-1
- User: "Show last 7 days" → GET_REPORT with start=(today-6 days), end=today
- User: "Delete a1b2" → DELETE_TRANSACTION with transactionId="a1b2"
`;

        const payload = {
            model: "gpt-4o-mini",
            temperature: 0.2,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userText }
            ]
        };

        const options = {
            method: "post",
            contentType: "application/json",
            headers: { Authorization: "Bearer " + apiKey },
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
        };

        const response = UrlFetchApp.fetch("https://api.openai.com/v1/chat/completions", options);
        const statusCode = response.getResponseCode();

        if (statusCode !== 200) {
            Logger.log("⚠️ OpenAI API error: " + statusCode);
            return { intent: "UNKNOWN", payload: {} };
        }

        const json = JSON.parse(response.getContentText());
        let aiAnswer = json.choices[0].message.content.trim();

        // Clean up markdown code blocks if present
        aiAnswer = aiAnswer.replace(/```json/gi, "").replace(/```/g, "").trim();

        const parsed = JSON.parse(aiAnswer);

        Logger.log("🧠 AI Interpretation: " + JSON.stringify(parsed, null, 2));

        // Validate response structure
        if (!parsed.intent) {
            return { intent: "UNKNOWN", payload: {} };
        }

        return parsed;

    } catch (error) {
        Logger.log("❌ Error parsing user message: " + error.message);
        return { intent: "UNKNOWN", payload: {} };
    }
}

/**
 * Test function: Verify AI message parsing works
 * Run this in Apps Script editor to test
 */
function testParseUserMessage() {
    const testCases = [
        "Catat kopi 18000",
        "Show spending last 7 days",
        "Delete transaction a1b2",
        "Income from client 5000000",
        "Update a1b2 category groceries"
    ];

    testCases.forEach(testMessage => {
        Logger.log("\n--- Testing: " + testMessage);
        const result = parseUserMessage(testMessage);
        Logger.log("Result: " + JSON.stringify(result, null, 2));
    });
}
