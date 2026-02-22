/**
 * Handler: Add Default Category
 */
function handleAddCategoryWizard(ctx) {
    const chatID = ctx.from.id;

    // Access control
    if (!isUserAllowed(chatID)) {
        ctx.reply(MSG_REJECT);
        return;
    }

    return stage.enter('add_default_category');
}

/**
 * Wizard: Add Default Category
 * STEP 1: Ask expense query
 * STEP 2: Ask category
 * STEP 3: Save → EXIT
 */
function createAddDefaultCategoryWizard(Scene) {

    function isCancelInput(raw) {
        return raw === 'cancel' || raw.includes('❌');
    }

    return new Scene(
        'add_default_category',

        // ======================
        // STEP 1 — Ask expense name
        // ======================
        (ctx) => {
            ctx.data = {};

            ctx.reply(
                'Masukkan *nama pengeluaran* 📝\n\n' +
                'Contoh: Kopi, Nasi Kuning\n' +
                'Atau tap *Cancel*.',
                {
                    parse_mode: 'Markdown',
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
        // STEP 2 — Ask category
        // ======================
        (ctx) => {
            const raw = (ctx.message?.text || '').trim();

            if (!raw) {
                ctx.reply('Masukkan nama pengeluaran 🙂');
                return;
            }

            if (isCancelInput(raw.toLowerCase())) {
                ctx.reply('❌ Dibatalkan.', {
                    reply_markup: {
                        keyboard: KB_MAIN_MENU,
                        resize_keyboard: true
                    }
                });
                return ctx.wizard.leave();
            }

            ctx.data.Query = raw;

            ctx.reply(
                'Masukkan *category* 📂\n\n' +
                'Contoh: Food and Drink',
                {
                    parse_mode: 'Markdown',
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
        // STEP 3 — Save
        // ======================
        (ctx) => {
            const raw = (ctx.message?.text || '').trim();

            if (!raw || isCancelInput(raw.toLowerCase())) {
                ctx.reply('❌ Dibatalkan.', {
                    reply_markup: {
                        keyboard: KB_MAIN_MENU,
                        resize_keyboard: true
                    }
                });
                ctx.data = {};
                return ctx.wizard.leave();
            }

            ctx.data.Cat = raw;

            // 🔹 Payload sesuai debug contoh
            const payload = {
                Query: ctx.data.Query,
                Cat: ctx.data.Cat,
                Tag: ''
            };

            try {
                appendSheets(dbcatandTag, payload);

                ctx.reply(
                    '✅ Default category berhasil disimpan:\n\n' +
                    `• Query: ${payload.Query}\n` +
                    `• Category: ${payload.Cat}`,
                    {
                        reply_markup: {
                            keyboard: KB_MAIN_MENU,
                            resize_keyboard: true
                        }
                    }
                );

            } catch (err) {
                Logger.log('❌ AddDefaultCategory error: ' + err.message);
                ctx.reply('❌ Gagal menyimpan default category.', {
                    reply_markup: {
                        keyboard: KB_MAIN_MENU,
                        resize_keyboard: true
                    }
                });
            }

            ctx.data = {};
            return ctx.wizard.leave();
        }
    );
}
