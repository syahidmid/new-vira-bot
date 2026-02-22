function debugMode() {
    // Re-init bot di dalam fungsi, bukan top-level
    var token = PropertiesService.getScriptProperties().getProperty('TELEGRAM_ID') || '';
    var botDebug = new lumpia.init(token);

    initWizardStage(botDebug);
    setupMessageRouters(botDebug);

    var update = {
        update_id: 257382396,
        message: {
            message_id: 84157,
            from: {
                id: 925867562,
                is_bot: false,
                first_name: "Syahid",
                last_name: "Muhammad",
                username: "syahidmid",
                language_code: "en",
            },
            chat: {
                id: 925867562,
                first_name: "Syahid",
                last_name: "Muhammad",
                username: "syahidmid",
                type: "private",
            },
            date: 1668514366,
            text: "#Spending Sampoerna Mild 2000",
            entities: [{ offset: 0, length: 6, type: "bot_command" }],
        },
    };

    botDebug.handleUpdate(update);
}