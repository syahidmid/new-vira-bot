/**
 * Wizard: Save Spending (Draft First, No Edit)
 * STEP 1: Ask expense name
 * STEP 2: Ask amount
 * STEP 3: Show draft with category prediction
 * STEP 4: Saved or Cancel → EXIT
 */

/**
 * Handle menu button: Input Pengeluaran (Expense)
 */
function handleMenuInputExpense(ctx) {
    const chatID = ctx.from.id;

    // Access control
    if (!isUserAllowed(chatID)) {
        ctx.reply(MSG_REJECT);
        return;
    }

    return stage.enter('save_spending');
}

function createSaveSpendingWizard(Scene) {

    function isCancelInput(raw) {
        return raw === 'cancel' || raw.includes('❌');
    }

    function renderDraft(ctx) {
        const draftMessage =
            `🧾 *Spending Draft*\n\n` +
            `Alright 👍 here’s the spending I’m about to record.\n` +
            `Please take a quick look 👇\n\n` +
            `• 🏷️ *Name*: ${ctx.data.expenseName}\n` +
            `• 💰 *Amount*: ${ctx.data.amount}\n` +
            `• 📂 *Category*: ${ctx.data.category}\n\n` +
            `If everything looks good, tap *Saved*.\n` +
            `Otherwise, you can cancel.`;

        ctx.replyWithMarkdown(draftMessage, {
            reply_markup: {
                keyboard: [
                    ['✅ Saved'],
                    ['❌ Cancel']
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    }

    return new Scene(
        'save_spending',

        // ======================
        // STEP 1 — Ask expense name
        // ======================
        (ctx) => {
            ctx.data = {};

            ctx.reply(
                'What did you spend on? 🛒\n\n' +
                'Example: Coffee, Lunch, Gasoline\n' +
                'Or tap *Cancel*.',
                {
                    reply_markup: {
                        keyboard: [['❌ Cancel']],
                        resize_keyboard: true,
                        one_time_keyboard: true
                    }
                }
            );

            return ctx.wizard.next();
        },

        // ======================
        // STEP 2 — Ask amount
        // ======================
        (ctx) => {
            const raw = (ctx.message?.text || '').trim();

            if (!raw) {
                ctx.reply('Please enter the expense name or tap Cancel 🙂');
                return;
            }

            if (isCancelInput(raw.toLowerCase())) {
                ctx.reply('❌ Cancelled.', {
                    reply_markup: {
                        keyboard: KB_MAIN_MENU,
                        resize_keyboard: true
                    }
                });
                return ctx.wizard.leave();
            }

            const validation = validateExpenseName(raw);
            if (!validation.valid) {
                ctx.reply(validation.message);
                return;
            }

            ctx.data.expenseName = validation.data;

            ctx.reply(
                'How much did it cost? 💰\n\n' +
                'Example: 25000\n' +
                'Or tap *Cancel*.',
                {
                    reply_markup: {
                        keyboard: [['❌ Cancel']],
                        resize_keyboard: true,
                        one_time_keyboard: true
                    }
                }
            );

            return ctx.wizard.next();
        },

        // ======================
        // STEP 3 — Build draft (NO SAVE YET)
        // ======================
        (ctx) => {
            const raw = (ctx.message?.text || '').trim().toLowerCase();

            if (!raw || isCancelInput(raw)) {
                ctx.reply('❌ Cancelled.', {
                    reply_markup: {
                        keyboard: KB_MAIN_MENU,
                        resize_keyboard: true
                    }
                });
                return ctx.wizard.leave();
            }

            const match = raw.match(/(\d+)/);
            if (!match) {
                ctx.reply(
                    'I couldn’t find the amount 😅\n' +
                    'Example: 25000',
                    {
                        reply_markup: {
                            keyboard: KB_MAIN_MENU,
                            resize_keyboard: true
                        }
                    }
                );
                return ctx.wizard.leave();
            }

            const validation = validateAmount(Number(match[1]));
            if (!validation.valid) {
                ctx.reply(validation.message, {
                    reply_markup: {
                        keyboard: KB_MAIN_MENU,
                        resize_keyboard: true
                    }
                });
                return ctx.wizard.leave();
            }

            ctx.data.amount = validation.data;

            // 🔮 Category prediction (NOT saved yet)
            const prediction = findcatTransactionFromDbOnly(ctx.data.expenseName);
            ctx.data.category = prediction.category || 'Uncategorized';
            ctx.data.tag = prediction.tag || '';

            // Show draft only
            renderDraft(ctx);
            return ctx.wizard.next();
        },

        // ======================
        // STEP 4 — Saved or Cancel
        // ======================
        // ======================
        // STEP 4 — Saved or Cancel (REFACTORED)
        // ======================
        (ctx) => {
            const raw = (ctx.message?.text || '').toLowerCase();

            // Cancel
            if (isCancelInput(raw)) {
                ctx.reply('❌ Okay, the spending was not recorded.', {
                    reply_markup: {
                        keyboard: KB_MAIN_MENU,
                        resize_keyboard: true
                    }
                });
                ctx.data = {};
                return ctx.wizard.leave();
            }

            // Save confirmed
            if (raw.includes('saved')) {
                try {
                    const payload = {
                        ID: generateUniqueTransactionID(),
                        Date: Utilities.formatDate(
                            new Date(),
                            'GMT+7',
                            'dd MMMM yyyy'
                        ),
                        Name: ctx.data.expenseName,
                        Category: ctx.data.category,
                        Amount: ctx.data.amount,
                        Tag: ctx.data.tag || '',
                        Note: ''
                    };

                    appendSheets(dbSpending, payload);
                    const spendingCards = printspendingTransaction(payload.ID);

                    ctx.replyWithMarkdown(`✅ All set! Your spending has been saved.\n`, {
                        reply_markup: {
                            keyboard: KB_MAIN_MENU,
                            resize_keyboard: true
                        }
                    });
                    ctx.replyWithMarkdown('**Spending Card:**\n\n' + spendingCards, {
                    });

                } catch (err) {
                    Logger.log('❌ SaveSpending error: ' + err.message);
                    ctx.reply('❌ Failed to save your spending.', {
                        reply_markup: {
                            keyboard: KB_MAIN_MENU,
                            resize_keyboard: true
                        }
                    });
                }

                ctx.data = {};
                return ctx.wizard.leave();
            }

            ctx.reply('Please choose *Saved* or *Cancel* 🙂');
        }

    );
}
