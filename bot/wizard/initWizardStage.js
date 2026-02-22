function initWizardStage(bot) {
    const { Scene, Stage } = WizardDua;  // ← tambah ini

    const wizardTest = createWizardtest(Scene);
    const viewSpendingWizard = createViewSpendingWizard(Scene);
    const saveSpendingWizard = createSaveSpendingWizard(Scene);
    const addDefaultCategoryWizard = createAddDefaultCategoryWizard(Scene);
    const inputIncomeWizard = createInputIncomeWizard(Scene);

    stage = new Stage([
        wizardTest,
        viewSpendingWizard,
        saveSpendingWizard,
        addDefaultCategoryWizard,
        inputIncomeWizard
    ]);

    bot.use(stage.middleware());
}