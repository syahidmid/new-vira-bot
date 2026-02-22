function inputDeepSeekToken() {
  var scriptProperties = PropertiesService.getScriptProperties();
  var deepSeekToken = Browser.inputBox("Masukkan DeepSeek API Key:");
  scriptProperties.setProperty("DEEPSEEK_API_KEY", deepSeekToken);
}

function callDeepSeekAPI(userText) {
  var deepSeekToken = PropertiesService.getScriptProperties().getProperty("DEEPSEEK_API_KEY");
  var url = "https://api.deepseek.com/v1/chat/completions";

  var payload = {
    "model": "deepseek-chat",
    "messages": [{ "role": "user", "content": userText }]
  };

  var options = {
    "method": "post",
    "headers": {
      "Authorization": "Bearer " + deepSeekToken,
      "Content-Type": "application/json"
    },
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true  // Mencegah error Apps Script crash saat HTTP error
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    var statusCode = response.getResponseCode();
    var jsonResponse = JSON.parse(response.getContentText());

    if (statusCode >= 200 && statusCode < 300) {
      return jsonResponse.choices[0].message.content;
    } else {
      return `⚠️ Error ${statusCode}: ${jsonResponse.error?.message || "Terjadi kesalahan pada API DeepSeek."}`;
    }
  } catch (e) {
    return `⚠️ Error: ${e.message}`;
  }
}

function inputOpenAIToken() {
  var scriptProperties = PropertiesService.getScriptProperties();
  var openAiToken = Browser.inputBox("Masukkan OpenAI API Key:");
  scriptProperties.setProperty("OPENAI_API_KEY", openAiToken);
}


function callOpenAIAPI(userText) {
  var openAiToken = PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY");
  var url = "https://api.openai.com/v1/chat/completions";

  var payload = {
    "model": "gpt-3.5-turbo",  // Bisa diganti dengan "gpt-4" jika punya akses
    "messages": [{ "role": "user", "content": userText }]
  };

  var options = {
    "method": "post",
    "headers": {
      "Authorization": "Bearer " + openAiToken,
      "Content-Type": "application/json"
    },
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    var statusCode = response.getResponseCode();
    var jsonResponse = JSON.parse(response.getContentText());

    if (statusCode >= 200 && statusCode < 300) {
      return jsonResponse.choices[0].message.content;
    } else {
      return `⚠️ Error ${statusCode}: ${jsonResponse.error?.message || "Terjadi kesalahan pada API OpenAI."}`;
    }
  } catch (e) {
    return `⚠️ Error: ${e.message}`;
  }
}


function testFindCat() {
  const hasil1 = findcatTransactionWithAI("Nasi Lengko");
  Logger.log(hasil1);
  // contoh hasil: { category: "Food & Beverage", tag: "Daily" }

  const hasil2 = findcatTransactionWithAI("Bayar Spotify");
  Logger.log(hasil2);
  // contoh hasil: { category: "Entertainment", tag: "Subscription" }
}

function findcatTransactionWithAI(transactionName) {
  const prompt = `
You are a financial transaction categorization system.
Use **only** the following categories (do not create new ones):


${VALID_CATEGORIES.join(", ")}

Special rules:

* If the transaction involves giving food, drinks, or money to someone else, categorize it as **"Donation"** even if it sounds like **"Food and Drink"**.
* If the transaction mentions **"for Atika, Affan, Dad, or Mom"**, always assign the category **"Family"**.
* If the category is food-related, consider adding tags such as **"Lunch"**, **"Breakfast"**, **"Snack"**, etc. Estimate based on the type of food.


Transaction: "${transactionName}"

Respond only in valid JSON, without using \`\`\`:
{
  "category": "...",
  "tag": "..."
}
`;

  try {
    const apiKey = PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY");
    const url = "https://api.openai.com/v1/chat/completions";

    const payload = {
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    };

    const options = {
      method: "post",
      contentType: "application/json",
      headers: { Authorization: "Bearer " + apiKey },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    };

    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());

    let aiAnswer = json.choices[0].message.content.trim();
    aiAnswer = aiAnswer.replace(/```json/i, "").replace(/```/g, "").trim();

    const parsed = JSON.parse(aiAnswer);

    // Validasi kategori
    if (!VALID_CATEGORIES.includes(parsed.category)) {
      parsed.category = "Not Found";
    }

    return {
      category: parsed.category || "AI Not Found",
      tag: parsed.tag || "AI Not Found",
    };
  } catch (e) {
    Logger.log("AI categorization error: " + e);
    return { category: "AI Not Found", tag: "AI Not Found" };
  }
}

// NOTE: VALID_CATEGORIES is declared in core/validator.js (canonical location)
// AI layer references it via global scope - do NOT redeclare here

/*
function askOpenAItoGenerateBotCommand(userPrompt) {
  const apiKey = PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY");
  const url = "https://api.openai.com/v1/chat/completions";

  // ===== Get today's date (in GMT+7) =====
  const TZ = "GMT+7";
  const today = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd");

  const systemPrompt = `
You are a command generator for a financial Telegram bot.
When a user says things like "today", "yesterday", "this week", or "last 7 days",
you must resolve them into explicit date ranges in YYYY-MM-DD format.

Today's date is ${today} (GMT+7, Western Indonesia Time). 
Assume user means local time, not UTC.

Respond ONLY in valid JSON:
{
  "function": "get_expenses_report",
  "args": {
    "start": "YYYY-MM-DD",
    "end": "YYYY-MM-DD",
    "message": "A short natural opening sentence to introduce the report."
  }
}

Rules:
- If the user says "today", set both start and end to today's date.
- If the user says "yesterday", use (today - 1 day).
- If the user says "last X days", start = (today - (X - 1) days), end = today.
- If only one date is mentioned, set start = end = that date.
- Dates must be in YYYY-MM-DD.
- Message should sound natural and short (e.g. "Here’s your ....").
`;

  const payload = {
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]
  };

  const options = {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + apiKey },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());
    let aiAnswer = json.choices[0].message.content.trim();
    aiAnswer = aiAnswer.replace(/```json/i, "").replace(/```/g, "").trim();

    const parsed = JSON.parse(aiAnswer);

    if (parsed.function === "get_expenses_report") {
      const { start, end, message } = parsed.args;
      const combined = combineMessageWithReport(message, start, end);
      Logger.log(combined);
      return combined;
    } else {
      return "No valid function detected.";
    }
  } catch (e) {
    Logger.log("Error generating bot command: " + e);
    return "Error generating command.";
  }
}

*/

function askOpenAItoGenerateBotCommand(userPrompt) {
  const apiKey = PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY");
  const url = "https://api.openai.com/v1/chat/completions";

  // ===== Get today's date (in GMT+7) =====
  const TZ = "GMT+7";
  const today = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd");

  const systemPrompt = `
You are a command generator for a financial Telegram bot.

Today's date is ${today} (GMT+7, Western Indonesia Time).
Assume user means local time, not UTC.

Your job:
Convert user messages into JSON commands the bot can execute.

Respond ONLY in valid JSON:
{
  "function": "add_spending" | "get_expenses_report",
  "args": {
    // for add_spending
    "expenseName": "string",
    "amount": number,
    "category": "optional string",
    "tag": "optional string",
    "note": "optional string",

    // for get_expenses_report
    "start": "YYYY-MM-DD",
    "end": "YYYY-MM-DD",
    "message": "short opening message"
  }
}

Rules:
- "today" = start=end=today
- "yesterday" = (today - 1 day)
- "last X days" = start=(today - (X-1) days), end=today
- Dates must be in YYYY-MM-DD
- Message should sound natural and short (e.g. "Here’s your report for today.")
- If user says something like "catat kopi 18000", interpret as add_spending
  with expenseName="kopi" and amount=18000.
`;

  const payload = {
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]
  };

  const options = {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + apiKey },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());
    let aiAnswer = json.choices[0].message.content.trim();
    aiAnswer = aiAnswer.replace(/```json/i, "").replace(/```/g, "").trim();

    const parsed = JSON.parse(aiAnswer);
    Logger.log("🧠 AI Parsed Response: " + JSON.stringify(parsed, null, 2));

    // ===== Handle recognized commands =====
    switch (parsed.function) {
      case "add_spending": {
        const { expenseName, amount, category, tag, note } = parsed.args;
        const result = addSpending(expenseName, amount, {
          category,
          tag,
          note
        });
        return `✅ ${expenseName} sebesar Rp${amount.toLocaleString()} berhasil dicatat.\n\n📂 Kategori: ${category || "Uncategorized"}\n🏷️ Tag: ${tag || "-"}\n📝 Catatan: ${note || "-"}`;
      }

      case "get_expenses_report": {
        const { start, end, message } = parsed.args;
        const combined = combineMessageWithReport(message, start, end);
        return combined;
      }

      default:
        return "⚠️ Tidak ada fungsi valid yang dikenali dari perintah ini.";
    }
  } catch (e) {
    Logger.log("❌ Error generating bot command: " + e);
    return "❌ Terjadi kesalahan saat memproses perintah.";
  }
}


/**
 * Combine AI message with spending report
 * Detects 'today' mode to format empty reports appropriately
 */
function combineMessageWithReport(message, startDateStr, endDateStr) {
  const TZ = "GMT+7";
  const todayYMD = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd");

  // Detect if this is a 'today' request (start == end == today)
  const isToday = (startDateStr === todayYMD && endDateStr === todayYMD);

  const result = processSpendingByCustomDateRange(startDateStr, endDateStr);

  if (result.error) {
    // Error (empty result) → use smart empty message
    const emptyMsg = formatEmptyReportMessage({
      isToday: isToday,
      startDate: startDateStr,
      endDate: endDateStr,
      locale: 'id'
    });

    // If 'today' and empty → only return the short message (no AI prefix)
    if (isToday) {
      return emptyMsg;
    }

    // For other ranges → combine with AI message prefix
    return `${message}\n\n${emptyMsg}`;
  }

  // Non-empty result → return as before
  return `${message}\n\n${result.response}`;
}



function debugAICommand() {
  const testPrompt = "Cek pengeluaran 25 oktober to October 18, 2025";
  const cmd = askOpenAItoGenerateBotCommand(testPrompt);
  Logger.log(cmd);
}




