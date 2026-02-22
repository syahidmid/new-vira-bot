/**
 * The Sphinx's Challenge
 * Flow:
 * 1. Sphinx appears with accept/decline buttons
 * 2. If accepted, show riddle with "Give Up" button
 * 3. Check answer (with hints if wrong)
 * 4. Either grant passage or give another chance
 * 5. Final judgment and welcome/banishment
 */

function createWizardtest(Scene) {
    const riddles = [
        {
            question: '🦁 *RIDDLE ME THIS, MORTAL:*\n\n' +
                'I speak without a mouth and hear without ears.\n' +
                'I have no body, but come alive with wind.\n\n' +
                'What am I? 🤔',
            answers: ['echo', 'an echo', 'gema'],
            hint: '💨 Think about sounds bouncing back...'
        },
        {
            question: '🦁 *ANSWER MY RIDDLE:*\n\n' +
                'The more you take, the more you leave behind.\n\n' +
                'What are they? 🤔',
            answers: ['footsteps', 'steps', 'langkah', 'jejak kaki', 'footstep'],
            hint: '👣 You make them when you walk...'
        },
        {
            question: '🦁 *SOLVE THIS MYSTERY:*\n\n' +
                'I have cities, but no houses.\n' +
                'I have mountains, but no trees.\n' +
                'I have water, but no fish.\n\n' +
                'What am I? 🤔',
            answers: ['map', 'a map', 'peta'],
            hint: '🗺 You use me to find your way...'
        },
        {
            question: '🦁 *HEAR MY RIDDLE:*\n\n' +
                'What has keys but no locks,\n' +
                'space but no room,\n' +
                'and you can enter but not go inside? 🤔',
            answers: ['keyboard', 'a keyboard', 'papan ketik'],
            hint: '⌨️ You use it to type...'
        }
    ];

    const KB_ACCEPT_DECLINE = [
        ['✅ I Accept the Challenge!', '❌ No Thanks']
    ];

    const KB_GIVE_UP = [
        ['🏳️ I Give Up']
    ];

    return new Scene(
        'wizardTest',

        // STEP 0 - The Sphinx Appears with Choice
        (ctx) => {
            const riddle = riddles[Math.floor(Math.random() * riddles.length)];
            ctx.data = {
                riddle: riddle,
                attempts: 0,
                maxAttempts: 2
            };

            ctx.replyWithMarkdown(
                '🏛️ *A WILD SPHINX BLOCKS YOUR PATH!* 🦁\n\n' +
                '⚡️ "HALT, TRAVELER!"\n\n' +
                'Before you may enter this sacred realm,\n' +
                'you must answer my ancient riddle!\n\n' +
                '💀 Answer wrong, and you shall be... mildly inconvenienced!\n' +
                '✨ Answer correctly, and glory awaits!\n\n' +
                '━━━━━━━━━━━━━━━━\n\n' +
                'Do you DARE to face the Sphinx\'s challenge?',
                {
                    reply_markup: {
                        keyboard: KB_ACCEPT_DECLINE,
                        resize_keyboard: true,
                        one_time_keyboard: true
                    }
                }
            );

            return ctx.wizard.next();
        },

        // STEP 1 - Handle Accept/Decline
        (ctx) => {
            const response = ctx.message?.text?.trim();

            if (response === '❌ No Thanks' || (response && response.toLowerCase().includes('no'))) {
                ctx.replyWithMarkdown(
                    '🦁 "COWARD! You flee from the Sphinx!"\n\n' +
                    '🏃‍♂️💨 The Sphinx watches you run away in disappointment...\n\n' +
                    '😏 "Return when you find your courage, mortal!"',
                    {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    }
                );
                return ctx.wizard.leave();
            }

            if (response === '✅ I Accept the Challenge!' || (response && (response.toLowerCase().includes('accept') || response.toLowerCase().includes('yes')))) {
                ctx.replyWithMarkdown(
                    '🦁 "EXCELLENT! Your bravery is noted!"\n\n' +
                    '⚡️ Prepare yourself...\n\n' +
                    '━━━━━━━━━━━━━━━━\n\n' +
                    ctx.data.riddle.question,
                    {
                        reply_markup: {
                            keyboard: KB_GIVE_UP,
                            resize_keyboard: true,
                            one_time_keyboard: false
                        }
                    }
                );
                return ctx.wizard.next();
            }

            ctx.replyWithMarkdown(
                '🦁 "Choose wisely, mortal! Accept or decline?"',
                {
                    reply_markup: {
                        keyboard: KB_ACCEPT_DECLINE,
                        resize_keyboard: true,
                        one_time_keyboard: true
                    }
                }
            );
        },

        // STEP 2 - Check Answer or Give Up
        (ctx) => {
            const answer = ctx.message?.text?.trim();

            if (!answer) {
                ctx.reply('🦁 SPEAK YOUR ANSWER, MORTAL! (Or type something at least 😅)');
                return;
            }

            // Check if user gave up
            if (answer === '🏳️ I Give Up' || answer.toLowerCase().includes('give up')) {
                ctx.replyWithMarkdown(
                    '🦁 *"YOU SURRENDER?!"* 🏳️\n\n' +
                    '😤 The Sphinx shakes its mighty head...\n\n' +
                    '"I have seen many brave souls face me,\n' +
                    'but YOU... you quit before even trying!"\n\n' +
                    '💭 *The answer was: ' + ctx.data.riddle.answers[0].toUpperCase() + '*\n\n' +
                    '🎭 "Go now, and remember this moment of weakness.\n' +
                    'Perhaps one day you\'ll return... braver."\n\n' +
                    '👋 *The Sphinx dismisses you with a wave of disappointment*',
                    {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    }
                );
                return ctx.wizard.leave();
            }

            const isCorrect = ctx.data.riddle.answers.some(function (a) {
                return answer.toLowerCase().includes(a.toLowerCase());
            });

            if (isCorrect) {
                ctx.data.success = true;
                ctx.replyWithMarkdown(
                    '⚡️ *CORRECT!* ⚡️\n\n' +
                    '🦁 "IMPRESSIVE, MORTAL!\n' +
                    'Your wisdom rivals that of Oedipus himself!\n' +
                    '(Well, maybe not THAT wise, but still good!)\n\n' +
                    '✨ You have proven yourself worthy!\n\n' +
                    'Now... tell me your NAME, brave one!"',
                    {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    }
                );
                return ctx.wizard.next();
            }

            ctx.data.attempts++;

            if (ctx.data.attempts >= ctx.data.maxAttempts) {
                ctx.replyWithMarkdown(
                    '❌ *WRONG AGAIN!*\n\n' +
                    '🦁 "The answer was: *' + ctx.data.riddle.answers[0].toUpperCase() + '*"\n\n' +
                    '😤 "You have FAILED the Sphinx\'s test!"\n\n' +
                    '...but I\'m feeling generous today. 😊\n\n' +
                    '💫 Tell me your NAME anyway, and I shall grant you passage!\n' +
                    '(The riddle was just for fun, lol)',
                    {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    }
                );
                ctx.data.success = false;
                return ctx.wizard.next();
            }

            ctx.replyWithMarkdown(
                '❌ *INCORRECT!*\n\n' +
                '🦁 "Think harder, mortal! You have ' + (ctx.data.maxAttempts - ctx.data.attempts) + ' attempt(s) remaining!"\n\n' +
                '💡 HINT: ' + ctx.data.riddle.hint + '\n\n' +
                'Try again! 🤔',
                {
                    reply_markup: {
                        keyboard: KB_GIVE_UP,
                        resize_keyboard: true,
                        one_time_keyboard: false
                    }
                }
            );
        },

        // STEP 3 - Get Name and Grand Finale
        (ctx) => {
            const name = ctx.message?.text?.trim();

            if (!name) {
                ctx.reply('🦁 A NAME, mortal! Give me a NAME! 😤');
                return;
            }

            if (ctx.data.success) {
                const epicWelcomes = [
                    '🏆 *' + name.toUpperCase() + ', THE RIDDLE MASTER!* 🏆\n\n' +
                    '🦁 "The Sphinx bows before your intellect!"\n\n' +
                    '✨ You are hereby granted the title:\n' +
                    '*' + name + ', Solver of Mysteries, Breaker of Riddles!*\n\n' +
                    '🏛️ The gates of wisdom open for you!\n\n' +
                    '🎉 WELCOME TO THE REALM, CHAMPION! 🎉',

                    '👑 *BEHOLD! ' + name.toUpperCase() + ' HAS ARRIVED!* 👑\n\n' +
                    '🦁 "Never have I seen such brilliance!"\n\n' +
                    '💫 The ancient scrolls shall record this day:\n' +
                    '"On this date, ' + name + ' outwitted the legendary Sphinx!"\n\n' +
                    '🎭 Your legend begins NOW! Welcome! 🎊',

                    '⚡️ *' + name.toUpperCase() + ', MASTER OF RIDDLES!* ⚡️\n\n' +
                    '🦁 "The prophecy is fulfilled!"\n\n' +
                    '🌟 ' + name + ', you have proven yourself worthy!\n\n' +
                    'The Sphinx shall guard your name in the halls of fame!\n\n' +
                    '🎪 ENTER AND BE CELEBRATED! 🎉'
                ];

                const welcome = epicWelcomes[Math.floor(Math.random() * epicWelcomes.length)];
                ctx.replyWithMarkdown(welcome);
            } else {
                ctx.replyWithMarkdown(
                    '🦁 *' + name + '*, huh?\n\n' +
                    '😏 "You may not have solved my riddle,\n' +
                    'but I appreciate your courage (and honesty)!"\n\n' +
                    '💫 Welcome anyway, ' + name + '!\n\n' +
                    'The Sphinx shows mercy today! 🎉\n' +
                    '(But practice your riddles for next time! 📚)'
                );
            }

            return ctx.wizard.leave();
        }
    );
}