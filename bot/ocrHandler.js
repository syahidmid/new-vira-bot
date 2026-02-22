/**
 * =============================================================================
 * bot/ocrHandler.js (PHASE 2.6 - OpenAI Vision OCR - Receipt Parsing)
 * =============================================================================
 * 
 * RESPONSIBILITY: 
 * Handle photo messages and extract text via OCR
 * Uses OpenAI Vision to extract receipt data
 * 
 * WORKFLOW:
 * 1. Receive photo message from handler.js
 * 2. Extract photo file_id from Telegram
 * 3. Download image file via Telegram API
 * 4. Convert to base64 and detect MIME type
 * 5. Send to OpenAI Vision (gpt-4o-mini) with receipt parsing prompt
 * 6. Extract command text and confidence score
 * 7. Return structured result for AI handler
 * 
 * SCOPE:
 * - Receipt OCR and parsing
 * - Extracts merchant name and amount
 * - Returns JSON with text command and confidence score
 * - Integrates with AI command pipeline
 * 
 * INTEGRATION:
 * Called from: bot/handler.js → handlePhotoMessage()
 * Sends to: handleUpdate() via AI pipeline
 * 
 * =============================================================================
 */

/**
 * Handle photo message and extract receipt data via OCR
 */
function handlePhotoMessage(ctx, photoFileId) {
    const chatID = ctx.from?.id;

    if (!isUserAllowed(chatID)) {
        ctx.reply(rejectMessage);
        return;
    }

    try {
        if (!photoFileId) {
            ctx.reply("❌ Foto tidak terdeteksi. Coba kirim ulang ya.");
            return;
        }

        // Send immediate feedback
        ctx.reply("📸 Foto diterima. Sedang dianalisis struk...");
        Logger.log(`📸 Photo OCR started for user ${chatID}, file_id: ${photoFileId}`);

        // Parse receipt and get command
        const result = askOpenAIReceiptToTextCommand(photoFileId);

        Logger.log("===== RECEIPT COMMAND (AI) =====");
        Logger.log("file_id: " + photoFileId);
        Logger.log("confidence: " + result.confidence);
        Logger.log("text: " + result.text);

        // Send to command handler
        handleUpdate(result.text);

        // Confirm to user
        ctx.reply("✅ Struk diterima. Sedang dicatat.");

    } catch (e) {
        Logger.log("❌ Error photo->OCR: " + e.message);
        Logger.log("   Stack: " + e.stack);
        ctx.reply("❌ Gagal memproses struk. Coba kirim ulang foto yang lebih jelas.");
    }
}

/**
 * Convert Telegram file_id to base64 with MIME type detection
 */
function telegramFileIdToBase64(fileId) {
    const tokenBot = PropertiesService.getScriptProperties().getProperty("TELEGRAM_BOT_TOKEN");

    if (!tokenBot) {
        throw new Error("TELEGRAM_BOT_TOKEN not configured");
    }

    // 1) Get file_path from Telegram
    const getFileUrl = `https://api.telegram.org/bot${tokenBot}/getFile?file_id=${encodeURIComponent(fileId)}`;
    const getRes = UrlFetchApp.fetch(getFileUrl);
    const getJson = JSON.parse(getRes.getContentText());

    if (!getJson.ok) {
        throw new Error("Telegram getFile failed: " + getRes.getContentText());
    }

    // 2) Download file
    const filePath = getJson.result.file_path || "";
    const downloadUrl = `https://api.telegram.org/file/bot${tokenBot}/${filePath}`;
    const blob = UrlFetchApp.fetch(downloadUrl).getBlob();

    // 3) Convert bytes to base64
    const base64 = Utilities.base64Encode(blob.getBytes());

    // 4) Detect MIME type from file extension
    let mimeType = "image/jpeg"; // Default: Telegram photos are usually jpg
    const lower = filePath.toLowerCase();
    if (lower.endsWith(".png")) mimeType = "image/png";
    else if (lower.endsWith(".webp")) mimeType = "image/webp";
    else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) mimeType = "image/jpeg";

    Logger.log("Telegram file_path: " + filePath);
    Logger.log("Blob size: " + blob.getBytes().length + " bytes");
    Logger.log("Detected mimeType: " + mimeType);

    return { base64, mimeType, filePath };
}

/**
 * Ask OpenAI to parse receipt image and return command
 */
function askOpenAIReceiptToTextCommand(fileId) {
    const apiKey = PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY");

    if (!apiKey) {
        throw new Error("OPENAI_API_KEY not configured");
    }

    const url = "https://api.openai.com/v1/chat/completions";

    const TZ = "GMT+7";
    const today = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd");

    const { base64, mimeType } = telegramFileIdToBase64(fileId);

    const systemPrompt = `
You generate a SINGLE text command for a Telegram finance bot from a receipt image.

Today's date is ${today} (GMT+7).

Return ONLY valid JSON:
{
  "text": "#Spending <expenseName> <amount>",
  "confidence": 0-1
}

Rules:
- text must be a single line.
- amount must be a number (no separators, no currency symbols).
- expenseName should be short (merchant name or description).
- If unsure, set confidence < 0.6 and still return a best-effort text.
- If cannot read receipt, return confidence 0 with placeholder text "#Spending Struk 0"
`;

    const payload = {
        model: "gpt-4o-mini",
        temperature: 0,
        messages: [
            { role: "system", content: systemPrompt },
            {
                role: "user",
                content: [
                    { type: "text", text: "Read this receipt image and output the command JSON." },
                    { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } }
                ]
            }
        ]
    };

    const res = UrlFetchApp.fetch(url, {
        method: "post",
        contentType: "application/json",
        headers: { Authorization: "Bearer " + apiKey },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
    });

    const code = res.getResponseCode();
    const body = res.getContentText();

    Logger.log("OpenAI API response code: " + code);

    if (code < 200 || code >= 300) {
        throw new Error("OpenAI error " + code + ": " + body);
    }

    const json = JSON.parse(body);
    let out = (json.choices?.[0]?.message?.content || "").trim();

    // Clean JSON formatting
    out = out.replace(/```json/i, "").replace(/```/g, "").trim();

    Logger.log("OpenAI raw response: " + out.substring(0, 200));

    const parsed = JSON.parse(out);
    parsed.confidence = Number(parsed.confidence || 0);

    // Fallback if model forgot format
    if (!parsed.text) {
        parsed.text = "#Spending Struk 0";
        parsed.confidence = 0;
    }

    Logger.log("Parsed receipt: text=" + parsed.text + ", confidence=" + parsed.confidence);

    return parsed;
}

/**
 * Test OCR handler with sample image
 * For debugging/development only
 */
function testOCRHandler() {
    Logger.log("=== OCR Handler Test ===");
    Logger.log("To test: Send a photo to the bot");
}
