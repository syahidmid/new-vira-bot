// Hapus semua inisialisasi top-level

function doPost(e) {
  var tokenBot = PropertiesService.getScriptProperties().getProperty('TELEGRAM_ID') || "";
  Logger.log('Token: ' + tokenBot); // cek token terbaca

  var bot = new lumpia.init(tokenBot);

  initWizardStage(bot);
  setupMessageRouters(bot);
  bot.doPost(e);
}