/**
 * Handle menu button: Input Income
 */
function handleMenuInputIncome(ctx) {
    const chatID = ctx.from.id;

    // Access control
    if (!isUserAllowed(chatID)) {
        ctx.reply(MSG_REJECT);
        return;
    }
    return stage.enter('input_income');
}

/**
 * Wizard: Input Income (Draft First, No Edit)
 * STEP 1: Ask income description
 * STEP 2: Ask total
 * STEP 3: Show draft with category prediction
 * STEP 4: Saved or Cancel → EXIT
 */

function createInputIncomeWizard(Scene) {

    function isCancelInput(raw) {
        return raw === 'cancel' || raw.includes('❌');
    }

    function validateTotal(n) {
        if (!Number.isFinite(n) || n <= 0) {
            return { valid: false, message: 'Amount must be a positive number.' };
        }
        return { valid: true, data: n };
    }

    function renderDraft(ctx) {
        const draftMessage =
            `🧾 *Income Draft*\n\n` +
            `Alright 👍 here’s the income I’m about to record.\n` +
            `Please take a quick look 👇\n\n` +
            `• 🏷️ *Description*: ${ctx.data.description}\n` +
            `• 💰 *Total*: ${ctx.data.total}\n` +
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
        'input_income',

        // ======================
        // STEP 1 — Ask income description
        // ======================
        (ctx) => {
            ctx.data = {};

            ctx.reply(
                'Income from what? 💼\n\n' +
                'Example: Salary, Bonus, Refund, Freelance\n' +
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
        // STEP 2 — Ask total
        // ======================
        (ctx) => {
            const raw = (ctx.message?.text || '').trim();

            if (!raw) {
                ctx.reply('Please enter the income description or tap Cancel 🙂');
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

            // kalau kamu punya validator sendiri, boleh dipakai.
            // Di spending kamu pakai validateExpenseName(raw).
            // Untuk income, aku amanin: pakai raw apa adanya.
            ctx.data.description = raw;

            ctx.reply(
                'How much was it? 💰\n\n' +
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

            const totalNum = Number(match[1]);
            const validation = validateTotal(totalNum);
            if (!validation.valid) {
                ctx.reply(validation.message, {
                    reply_markup: {
                        keyboard: KB_MAIN_MENU,
                        resize_keyboard: true
                    }
                });
                return ctx.wizard.leave();
            }

            ctx.data.total = validation.data;

            // 🔮 Category prediction (NOT saved yet)
            // Pake pola yang sama kaya spending.
            // Pastikan fungsi ini memang ada dan return { category, tag }
            const prediction = findcatTransactionFromDbOnly(ctx.data.description);
            ctx.data.category = prediction.category || 'Uncategorized';
            ctx.data.tag = prediction.tag || '';

            renderDraft(ctx);
            return ctx.wizard.next();
        },

        // ======================
        // STEP 4 — Saved or Cancel
        // ======================
        (ctx) => {
            const raw = (ctx.message?.text || '').toLowerCase();

            // Cancel
            if (isCancelInput(raw)) {
                ctx.reply('❌ Okay, the income was not recorded.', {
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
                        Description: ctx.data.description,
                        Category: ctx.data.category,
                        Total: ctx.data.total,
                        Tag: ctx.data.tag || '',
                        Note: ''
                    };

                    appendSheets(dbIncome, payload);
                    const incomeCards = printincomeTransaction(payload.ID);

                    ctx.replyWithMarkdown(`✅ All set! Your income has been saved.\n\n${incomeCards}`, {
                        reply_markup: {
                            keyboard: KB_MAIN_MENU,
                            resize_keyboard: true
                        }
                    });
                    ctx.replyWithMarkdown(incomeCards);

                } catch (err) {
                    Logger.log('❌ InputIncome error: ' + err.message);
                    ctx.reply('❌ Failed to save your income.', {
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
