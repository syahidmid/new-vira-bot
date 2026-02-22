/**
 * =============================================================================
 * bot/aiMessageHandler.gs
 * =============================================================================
 * 
 * RESPONSIBILITY: 
 * Bridge between message router and AI interpretation layer
 * Receives natural language messages from bot/handler.gs
 * Calls ai/openAi.gs to interpret user intent
 * Translates AI output to core function calls via ai/intentMapper.gs
 * 
 * WORKFLOW:
 * 1. Receive user text from handleNaturalLanguage()
 * 2. Call ai/openAi.parseUserMessage() to get {intent, payload}
 * 3. Call ai/intentMapper.executeIntent() to map intent → core function
 * 4. Send result back to user
 * 
 * DO NOT:
 * - Access spreadsheets directly
 * - Call core business logic directly
 * - Make decisions about saving/deleting data
 * - Modify or know about internal function names
 * 
 * =============================================================================
 */

/**
 * Process natural language message via AI
 * @param {Object} ctx - Telegram context object
 * @param {String} userPrompt - Natural language message from user
 */
function aiMessageHandler(ctx, userPrompt) {
    const chatID = ctx.from.id;
    const firstName = ctx.from.first_name;

    try {
        // ===== Step 1: Parse user intent via AI =====
        const aiInterpretation = parseUserMessage(userPrompt);

        // Handle error or empty response from AI
        if (!aiInterpretation || aiInterpretation.intent === "UNKNOWN") {
            ctx.replyWithMarkdown(`Sorry ${firstName}, I couldn't understand your request. Please try rephrasing it or use the menu options.`, {
                reply_markup: {
                    keyboard: KB_MAIN_MENU,
                    resize_keyboard: true,
                    one_time_keyboard: true,
                },
            });
            return;

        }

        // ===== Step 2: Execute the interpreted intent =====
        const result = executeIntent(chatID, aiInterpretation.intent, aiInterpretation.payload);

        // ===== Step 3: Send result to user =====
        if (result.success) {
            ctx.replyWithMarkdown(result.message, {
                reply_markup: {
                    keyboard: KB_TRANSACTION_MENU,
                    resize_keyboard: true,
                    one_time_keyboard: true,
                },
            });
        } else {
            ctx.reply(`⚠️ ${result.message}`);
        }

    } catch (error) {
        Logger.log("Error in aiMessageHandler: " + error.message);
        ctx.reply("🤖 An error occurred while processing your request. Please try again.");
    }
}

/**
 * Test function for debugging AI interpretation
 * Remove or comment out in production
 */
function testAIMessageHandler() {
    // Simulate context object
    const mockCtx = {
        from: { id: 123456, first_name: "John" },
        message: { text: "How much did I spend last 7 days?" },
        reply: function (msg) { Logger.log("Reply: " + msg); },
        replyWithMarkdown: function (msg, opts) { Logger.log("Reply (MD): " + msg); }
    };

    // Test natural language interpretation
    const testPrompt = "Show me spending from last week";
    const result = parseUserMessage(testPrompt);
    Logger.log("AI Interpretation: " + JSON.stringify(result, null, 2));

    // Test intent execution
    const execResult = executeIntent(123456, result.intent, result.payload);
    Logger.log("Execution Result: " + JSON.stringify(execResult, null, 2));
}
