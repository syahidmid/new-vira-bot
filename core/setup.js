function showSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('Connect to Telegram Bot')
    .setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);
}

function isUserAllowed(chatID) {
  var users = getUsers();
  if (!users || users.length === 0) return false;
  return users.some(function (u) {
    return u.chatId === chatID.toString();
  });
}


function saveSpreadsheetId() {
  const ssidMoneyManagement = SpreadsheetApp.getActiveSpreadsheet().getId();
  PropertiesService.getScriptProperties().setProperty('SSID_MONEY_MANAGEMENT', ssidMoneyManagement);
  SpreadsheetApp.getActiveSpreadsheet().toast('Spreadsheet ID telah disimpan', 'Status');
}

function saveChatId(chatId) {
  PropertiesService.getScriptProperties().setProperty('ALLOWED_CHAT_IDS', chatId);
  SpreadsheetApp.getActiveSpreadsheet().toast('Chat ID telah disimpan', 'Status');
}

function getChatId() {
  var scriptProperties = PropertiesService.getScriptProperties();
  var chatId = scriptProperties.getProperty('ALLOWED_CHAT_IDS');
  return chatId || '';
}


