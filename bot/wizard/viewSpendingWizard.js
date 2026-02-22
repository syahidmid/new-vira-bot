/**
 * Wizard: View Spending
 * STEP 1: Show last 10 expenses (table only)
 * STEP 2: Ask number of days OR cancel
 * - Safe against errors
 * - Cancel works everywhere
 * - No confirmation step
 */
function createViewSpendingWizard(Scene) {
    return new Scene(
        'view_spending',

        /**
         * STEP 1 — Show last 10 transactions
         * MUST NEVER FAIL
         */
        (ctx) => {
            ctx.data = {};

            try {
                const rowCount = 10;
                const table = getRecentSpending(rowCount); // should return string or ""

                if (table) {
                    ctx.replyWithMarkdown(
                        `Here are your last *${rowCount} expenses*:\n\n${table}`,
                        { parse_mode: 'Markdown' }
                    );
                } else {
                    ctx.reply(
                        `No expenses found yet.\n\nAdd a spending first to see your transactions.`
                    );
                }

            } catch (err) {
                // 🔴 CRITICAL: never let wizard die here
                Logger.log('❌ ViewSpending STEP1 error: ' + err.message);

                ctx.reply(
                    `⚠️ Couldn't load recent expenses.\nYou can still view by days.`
                );
            }

            // ALWAYS ask next question
            ctx.reply(
                `Want to view spending by days?\n\n` +
                `Type the number of days (example: 7)\n` +
                `or tap Cancel.`,
                {
                    reply_markup: {
                        keyboard: [
                            ['7 days', '30 days'],
                            ['❌ Cancel']
                        ],
                        resize_keyboard: true,
                        one_time_keyboard: true
                    }
                }
            );

            return ctx.wizard.next();
        },

        /**
         * STEP 2 — Handle days input or cancel
         */
        (ctx) => {
            const raw = (ctx.message?.text || '').trim().toLowerCase();

            // Empty input
            if (!raw) {
                ctx.reply('Please choose a number of days or tap Cancel.');
                return;
            }

            // Cancel works everywhere
            if (raw === 'cancel' || raw.includes('❌')) {
                ctx.reply('Cancelled.', {
                    reply_markup: {
                        keyboard: KB_MAIN_MENU,
                        resize_keyboard: true,
                        one_time_keyboard: true
                    }
                });
                return ctx.wizard.leave();
            }

            // Extract number (supports: "7", "7 days", "📅 7 days")
            const match = raw.match(/(\d+)/);
            if (!match) {
                ctx.reply('Please enter a valid number.\nExample: 7');
                return;
            }

            const daysAgo = Number(match[1]);
            if (!daysAgo || daysAgo <= 0) {
                ctx.reply('Please enter a number greater than 0.\nExample: 7');
                return;
            }

            // Save to wizard context
            ctx.data.daysAgo = daysAgo;

            try {
                // Call your existing report handler
                const result = processSpendingByDateRange(daysAgo);

                if (result?.error) {
                    ctx.reply(
                        `No expenses found for the last ${daysAgo} day(s).\n\n` +
                        `Try a larger range.`
                    );
                } else {
                    // result.response already formatted
                    ctx.replyWithMarkdown(
                        result.response,
                        {
                            parse_mode: 'Markdown',
                            reply_markup: {
                                keyboard: KB_MAIN_MENU,
                                resize_keyboard: true,
                                one_time_keyboard: true
                            }
                        }
                    );
                }

            } catch (err) {
                Logger.log('❌ ViewSpending STEP2 error: ' + err.message);
                ctx.reply('❌ Failed to load spending report.');
            }

            return ctx.wizard.leave();
        }
    );
}
