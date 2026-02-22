// ═══════════════════════════════════════════════
//  CONFIG SHEET UTILITIES
//  Semua data disimpan di sheet tersembunyi "_config"
//  supaya ikut ter-copy saat spreadsheet di-duplicate
// ═══════════════════════════════════════════════

var CONFIG_SHEET_NAME = '_config';

/**
 * Ambil atau buat sheet _config (hidden)
 */
function getConfigSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG_SHEET_NAME);
    sheet.hideSheet();
    // Header
    sheet.getRange(1, 1, 1, 2).setValues([['key', 'value']]);
    sheet.setColumnWidth(1, 200);
    sheet.setColumnWidth(2, 500);
  }
  return sheet;
}

/**
 * Simpan nilai berdasarkan key
 */
function saveToSheet(key, value) {
  var sheet = getConfigSheet();
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  // Key belum ada → tambah baris baru
  sheet.appendRow([key, value]);
}

/**
 * Ambil nilai berdasarkan key
 */
function getFromSheet(key) {
  var sheet = getConfigSheet();
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === key) return data[i][1] || '';
  }
  return '';
}

/**
 * Hapus key dari config sheet
 */
function deleteFromSheet(key) {
  var sheet = getConfigSheet();
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.deleteRow(i + 1);
      return;
    }
  }
}


// ═══════════════════════════════════════════════
//  SIDEBAR — dipanggil dari HTML
// ═══════════════════════════════════════════════

/** Simpan satu nilai config */
function saveValue(key, value) {
  saveToSheet(key, value);
}

/** Ambil satu nilai config */
function getValue(key) {
  return getFromSheet(key);
}

/** Load semua config untuk sidebar Connection tab */
function getBotAndDeploymentIds() {
  return {
    telegramId: getFromSheet('TELEGRAM_ID'),
    deploymentId: getFromSheet('DEPLOYMENT_ID')
  };
}

/** Cek status bot */
function getBotStatus() {
  var telegramId = getFromSheet('TELEGRAM_ID');
  var deploymentId = getFromSheet('DEPLOYMENT_ID');
  if (!telegramId || !deploymentId) return 'Disconnected';

  try {
    var url = 'https://api.telegram.org/bot' + telegramId + '/getWebhookInfo';
    var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    var json = JSON.parse(resp.getContentText());
    if (json.ok && json.result && json.result.url && json.result.url !== '') {
      return 'Connected';
    }
  } catch (e) { }
  return 'Disconnected';
}

/** Set webhook */
function setWebhook(telegramId, deploymentId) {
  var webhookUrl = 'https://script.google.com/macros/s/' + deploymentId + '/exec';
  var url = 'https://api.telegram.org/bot' + telegramId + '/setWebhook?url=' + encodeURIComponent(webhookUrl);
  try {
    var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    var json = JSON.parse(resp.getContentText());
    return json.ok ? '✅ Bot berhasil terhubung!' : '❌ Gagal: ' + json.description;
  } catch (e) {
    return '❌ Error: ' + e.message;
  }
}

/** Delete webhook */
function deleteWebhook() {
  var telegramId = getFromSheet('TELEGRAM_ID');
  if (!telegramId) return '⚠️ Token tidak ditemukan.';
  var url = 'https://api.telegram.org/bot' + telegramId + '/deleteWebhook';
  try {
    var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    var json = JSON.parse(resp.getContentText());
    return json.ok ? '🔌 Bot berhasil diputuskan.' : '❌ Gagal: ' + json.description;
  } catch (e) {
    return '❌ Error: ' + e.message;
  }
}


// ═══════════════════════════════════════════════
//  USER MANAGEMENT — disimpan di config sheet
//  key: ALLOWED_USERS → JSON array
// ═══════════════════════════════════════════════

/** Ambil semua user */
function getUsers() {
  var raw = getFromSheet('ALLOWED_USERS');
  try { return raw ? JSON.parse(raw) : []; } catch (e) { return []; }
}

/** Simpan semua user (replace) */
function saveUsers(usersArray) {
  saveToSheet('ALLOWED_USERS', JSON.stringify(usersArray));
}

/** Tambah satu user baru */
function addUser(name, chatId) {
  var users = getUsers();

  // Cek duplikat chat ID
  for (var i = 0; i < users.length; i++) {
    if (users[i].chatId === chatId) {
      return { success: false, message: '⚠️ Chat ID sudah terdaftar.' };
    }
  }

  users.push({ name: name, chatId: chatId });
  saveUsers(users);
  return { success: true, message: '✅ User "' + name + '" ditambahkan.' };
}

/** Hapus user berdasarkan chatId */
function removeUser(chatId) {
  var users = getUsers();
  var before = users.length;
  users = users.filter(function (u) { return u.chatId !== chatId; });
  saveUsers(users);
  return before !== users.length
    ? { success: true, message: '🗑️ User dihapus.' }
    : { success: false, message: '⚠️ User tidak ditemukan.' };
}


// ═══════════════════════════════════════════════
//  OPEN SIDEBAR
// ═══════════════════════════════════════════════

/**
 * Dipakai oleh <?!= include('nama-file') ?> di HTML
 * supaya CSS dan JS bisa dipisah ke file berbeda
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function openSidebar() {
  var html = HtmlService.createTemplateFromFile('sidebar')
    .evaluate()
    .setTitle('Vira Bot')
    .setWidth(320);
  SpreadsheetApp.getUi().showSidebar(html);
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🤖 Vira Bot')
    .addItem('Buka Panel', 'openSidebar')
    .addToUi();
}