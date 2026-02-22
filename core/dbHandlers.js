/**
 * Helper function: Format empty report message with smart UX
 * 
 * @param {Object} params - Configuration object
 * @param {string} params.isToday - Boolean: true if request is for 'today' (single day mode)
 * @param {string} params.startDate - Start date in YYYY-MM-DD format
 * @param {string} params.endDate - End date in YYYY-MM-DD format
 * @param {string} params.locale - Language locale ('id' for Indonesia, 'en' for English)
 * @return {string} - Formatted empty report message
 */
function formatEmptyReportMessage(params = {}) {
  const { isToday = false, startDate, endDate, locale = 'id' } = params;

  // If request is for 'today' and single day → short message only
  if (isToday && startDate === endDate) {
    if (locale === 'id') {
      return "Belum ada transaksi hari ini.";
    } else {
      return "No transactions for today.";
    }
  }

  // For other date ranges → include range info
  if (locale === 'id') {
    if (startDate === endDate) {
      // Single day but NOT 'today' mode (user requested specific date)
      return `Tidak ada transaksi pada ${startDate}.`;
    } else {
      // Multi-day range
      return `Tidak ada transaksi pada ${startDate} s/d ${endDate}.`;
    }
  } else {
    if (startDate === endDate) {
      return `No transactions on ${startDate}.`;
    } else {
      return `No transactions between ${startDate} and ${endDate}.`;
    }
  }
}

function getRecentSpending(rowCount) {
  const lastRow = dbSpending.last_row;
  const startRow = Math.max(2, lastRow - rowCount + 1);
  const numRows = lastRow - startRow + 1;

  // ✅ No data: return empty string (wizard/handler decides message)
  if (numRows <= 0) return "";

  const data = dbSpending
    .range(startRow, 2, numRows, 5)
    .getValues();

  data.sort((a, b) => new Date(a[1]) - new Date(b[1]));

  let table = "```\n";
  table += "Date     | Expense        | Amount    \n";
  table += "---------|----------------|-----------\n";

  let totalSpending = 0;

  for (let i = 0; i < data.length; i++) {
    const dateObj = new Date(data[i][1]);
    const formattedDate = Utilities
      .formatDate(dateObj, "GMT+7", "dd/MM/yy")
      .padEnd(8);

    const expenseName = data[i][2]
      .toString()
      .slice(0, 14)
      .padEnd(14);

    const amount = Number(data[i][4]) || 0;
    const formattedAmount = new Intl.NumberFormat("en-US")
      .format(amount)
      .padEnd(10);

    table += `${formattedDate} | ${expenseName} | ${formattedAmount}\n`;
    totalSpending += amount;
  }

  const formattedTotal = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(totalSpending);

  table += "---------|----------------|-----------\n";
  table += `Total    |                | ${formattedTotal}\n`;
  table += "```";

  return table;
}


function processSpendingByDateRange(daysAgo) {
  const TZ = "GMT+7";

  // Fetch a wide enough data window, then filter it ourselves
  // (use Math.max to ensure we fetch at least 2 days of data)
  let data = getDataByDateRange(Math.max(daysAgo, 2)); // [[id, date, name, category, amount], ...]

  // Helper to compare dates based on timezone
  const toYMD = (d) => Utilities.formatDate(new Date(d), TZ, "yyyy-MM-dd");
  const todayYMD = toYMD(new Date());

  if (daysAgo === 1) {
    // "Today's Spending" → ONLY rows with date = today (TZ GMT+7)
    data = (data || []).filter(row => toYMD(row[1]) === todayYMD);
  } else {
    // "Last X Days" → from (today - (daysAgo-1)) to today (inclusive)
    const start = toYMD(new Date(Date.now() - (daysAgo - 1) * 86400000));
    data = (data || []).filter(row => {
      const ymd = toYMD(row[1]);
      return ymd >= start && ymd <= todayYMD;
    });
  }

  if (!data || data.length === 0) {
    return { error: `No transactions found in the last ${daysAgo} day(s).` };
  }

  let response = "```\n";
  response += "Date     | Expense        | Amount    \n";
  response += "---------|----------------|-----------\n";

  let totalSpending = 0;

  for (let i = 0; i < data.length; i++) {
    const dates = new Date(data[i][1]);
    const formattedDate = Utilities.formatDate(dates, TZ, "dd/MM/yy").padEnd(8);

    const expenseName = data[i][2].toString().slice(0, 14).padEnd(14);

    const amount = Number(data[i][4]) || 0;
    const formattedAmount = new Intl.NumberFormat("en-US")
      .format(amount)
      .replace(/\.\d+$/, "")
      .padStart(10);

    response += `${formattedDate} | ${expenseName} | ${formattedAmount}\n`;
    totalSpending += amount;
  }

  const formattedTotalSpending = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(totalSpending);

  response += `\nTotal Spending: ${formattedTotalSpending}\n`;
  response += "```";

  return { response };
}


function processSpendingByCustomDateRange(startDateStr, endDateStr) {
  const TZ = "GMT+7";

  Logger.log("=== [DEBUG] START processSpendingByCustomDateRange ===");
  Logger.log(`Raw input -> startDateStr: ${startDateStr}, endDateStr: ${endDateStr}`);

  // ======== Parse date input ========
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  Logger.log(`Parsed Dates -> startDate: ${startDate}, endDate: ${endDate}`);

  if (isNaN(startDate) || isNaN(endDate)) {
    Logger.log("[ERROR] Invalid date format");
    return { error: "Invalid date format. Expected 'YYYY-MM-DD' or 'DD/MM/YYYY'." };
  }

  if (startDate > endDate) {
    Logger.log("[ERROR] Start date is later than end date");
    return { error: "The start date cannot be later than the end date." };
  }

  // ======== Retrieve data ========
  const dayDiff = Math.ceil((endDate - startDate) / 86400000) + 1;
  Logger.log(`Date difference (dayDiff): ${dayDiff}`);

  let data = getDataByDateRange(Math.max(dayDiff, 2)); // [[id, date, name, category, amount], ...]
  Logger.log(`Raw data count: ${data ? data.length : 0}`);

  const toYMD = (d) => {
    const dateObj = new Date(d);
    if (isNaN(dateObj)) {
      Logger.log(`[WARN] Invalid date in data: ${d}`);
      return null;
    }
    // Tambahkan jam agar tidak offset timezone
    dateObj.setHours(dateObj.getHours() + 12);
    return Utilities.formatDate(dateObj, TZ, "yyyy-MM-dd");
  };

  const startYMD = toYMD(startDate);
  const endYMD = toYMD(endDate);

  Logger.log(`Filtering range from ${startYMD} to ${endYMD}`);

  // ======== Filter data ========
  const filtered = (data || []).filter(row => {
    const rawDate = row[1];
    const ymd = toYMD(rawDate);
    const inRange = ymd && ymd >= startYMD && ymd <= endYMD;
    if (!inRange) {
      Logger.log(`[SKIP] ${rawDate} (${ymd}) out of range`);
    } else {
      Logger.log(`[KEEP] ${rawDate} (${ymd})`);
    }
    return inRange;
  });

  Logger.log(`Filtered data count: ${filtered.length}`);

  if (!filtered || filtered.length === 0) {
    Logger.log(`[RESULT] No transactions found between ${startYMD} and ${endYMD}`);
    Logger.log("=== [DEBUG END] ===");
    return { error: `No transactions found between ${startYMD} and ${endYMD}.` };
  }

  // ======== Build Markdown-formatted response ========
  let response = "```\n";
  response += "Date     | Expense        | Amount    \n";
  response += "---------|----------------|-----------\n";

  let totalSpending = 0;

  for (let i = 0; i < filtered.length; i++) {
    const dates = new Date(filtered[i][1]);
    const formattedDate = Utilities.formatDate(dates, TZ, "dd/MM/yy").padEnd(8);
    const expenseName = filtered[i][2].toString().slice(0, 14).padEnd(14);
    const amount = Number(filtered[i][4]) || 0;
    const formattedAmount = new Intl.NumberFormat("en-US")
      .format(amount)
      .replace(/\.\d+$/, "")
      .padStart(10);

    response += `${formattedDate} | ${expenseName} | ${formattedAmount}\n`;
    totalSpending += amount;
  }

  const formattedTotal = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(totalSpending);

  response += `\nTotal Spending: ${formattedTotal}\n`;
  response += "```";

  Logger.log(`[RESULT] Total Spending: ${formattedTotal}`);
  Logger.log("=== [DEBUG END] ===");

  return { response };
}




/*
-----------------
*/

function setrecordSpending(transactionID, savedDate, expenseName, category, amount, tag, note) {
  var newRow = dbSpending.last_row + 1;
  var saveRecord = dbSpending.range(newRow, 2, 1, 7);
  var recordValues = [
    transactionID,
    savedDate,
    expenseName,
    category,
    amount,
    tag,
    note,
  ];

  var recordLogvalues = [
    chatingId,
    full_name,
    username,
    message,
    savedDate,
  ];

  try {

    saveRecord.setValues([recordValues]);
    return true;
  } catch (error) {
    console.error("Error while recording spending:", error);
    return false;
  }
}




function getDataByDateRange(daysAgo) {
  var lastRow = dbSpending.last_row;

  var startRow = 2; // Baris pertama data (header di baris 1)
  var data = dbSpending.range(startRow, 2, lastRow - startRow + 1, 5).getValues();

  // Hitung tanggal batas berdasarkan `daysAgo`
  const today = new Date();
  const dateThreshold = new Date(today);
  dateThreshold.setDate(today.getDate() - daysAgo);

  // Filter data berdasarkan rentang tanggal
  let filteredData = data.filter(row => {
    const transactionDate = new Date(row[1]); // Kolom tanggal (indeks 1)
    return transactionDate >= dateThreshold; // Hanya ambil data >= tanggal batas
  });

  // Log hasil dan kembalikan data
  Logger.log(`Transactions in the last ${daysAgo} day(s):`);
  Logger.log(JSON.stringify(filteredData, null, 2));
  return filteredData;
}

function generateUniqueTransactionID() {
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  const idLength = 4;

  while (true) {
    let generatedID = "";
    for (let i = 0; i < idLength; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      generatedID += characters.charAt(randomIndex);
    }

    const existingData = getDbSpending().key(generatedID);
    if (!existingData) {
      return generatedID;
    }
  }
}



function listmaincommandFinance() {
  const commands = ["#Record", "#Update", "#Summary"];
  const formattedCommands = commands.map((command) => `- ${command}`).join("\n");
  return `> Here are the valid update commands:\n${formattedCommands}`;
}


var category = 'life';
function getQuote(category) {
  // Ganti YOUR_API_KEY dengan kunci API yang valid
  var apiKey = 'ihE8aAQyiP4Dj5d/rrUObA==7XBiHX40v1AMeFyv';

  // Periksa apakah kategori didefinisikan, jika tidak, berikan nilai default
  category = category || 'success';

  // URL endpoint API
  var apiUrl = 'https://api.api-ninjas.com/v1/quotes?category=' + category;

  // Konfigurasi opsi permintaan HTTP
  var options = {
    method: 'get',
    headers: {
      'X-Api-Key': apiKey
    }
  };

  try {
    // Lakukan permintaan HTTP
    var response = UrlFetchApp.fetch(apiUrl, options);

    // Mendapatkan konten respons dalam bentuk teks
    var responseText = response.getContentText();

    // Menangani respons JSON
    var result = JSON.parse(responseText);

    // Ekstrak dan log penulis (author) dan kutipan (quote)
    if (result.length > 0) {
      var randomIndex = Math.floor(Math.random() * result.length);
      var quote = result[randomIndex];
      var author = quote.author;
      var quoteText = quote.quote;

      // Mengembalikan string HTML dengan kutipan dan penulis dalam format yang diinginkan
      return '<i>"' + quoteText + '"</i><br/><strong>- ' + author + '</strong>';
    } else {
      return 'Tidak ada kutipan ditemukan untuk kategori: ' + category;
    }
  } catch (error) {
    // Menangani kesalahan
    return '<p>Error: ' + error + '</p>';
  }
}

function schedule() {
  const holiday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDate = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta', weekday: 'long' });

  // Cek apakah currentDate bukan hari libur
  if (!holiday.includes(currentDate)) {
    const text = '#Credit Parkir CIBIS';
    handleUpdate(text);
    handleUpdate('/schedule');
  }
}


function getLastID() {
  var lastRow = dbSpending.last_row;
  const cellObject = dbSpending.getValue(lastRow, 2);
  const lastID = cellObject.data;
  return lastID; //
}

function getLastDescription() {
  var lastRow = dbSpending.last_row;
  const cellObject = dbSpending.getValue(lastRow, 4);
  const lastID = cellObject.data;
  return lastID; //
}

function getLastamount() {
  var lastRow = dbSpending.last_row;
  const cellObject = dbSpending.getValue(lastRow, 6);
  const lastID = cellObject.data;
  return lastID; //
}

function getListcatspending() {
  const listCat = dbsettings.getValues('⚙️Setting!D2:D');
  const filteredData = listCat.data.filter(item => item[0].trim() !== '');
  return filteredData;
}


function getCatamount(category, month) {
  let result = dbReport.key(category);

  if (result) {
    const monthIndex = getMonthIndex(month);
    if (monthIndex !== -1) {
      const amount = result.data[monthIndex];
      return amount; // Mengembalikan nilai amount
    } else {
      return null; // Jika bulan tidak ditemukan
    }
  } else {
    return null;
  }
}

function getMonthIndex(month) {
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUNE", "JULY", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return months.indexOf(month) + 13; // Tambahkan 1 karena array data mungkin dimulai dari indeks 1
}

function findcatTransaction(transactionName) {
  // --- Cari exact match di DB ---
  const exactMatch = getDbCatAndTag().search(transactionName);
  let category = "Not Found";
  let tag = "Not Found";

  if (exactMatch) {
    category = exactMatch.data[1];
    tag = exactMatch.data[2];
  } else {
    const searchWords = transactionName.split(/\s+/);
    const searchRegex = new RegExp(searchWords.join("|"), "i");
    const cat = getDbCatAndTag().search(searchRegex);

    if (cat) {
      category = cat.data[1];
      tag = cat.data[2];
    }
  }

  // --- Kalau tetap Not Found → minta ke AI ---
  if (category === "Not Found") {
    const aiResult = findcatTransactionWithAI(transactionName);
    category = aiResult.category;
    tag = aiResult.tag;
  }

  return { category, tag };
}

function findcatTransactionFromDbOnly(transactionName) {
  if (!transactionName) {
    return { category: "Uncategorized", tag: "", matched: false };
  }

  const exactMatch = dbcatandTag.search(transactionName);
  let category = "Uncategorized";
  let tag = "";
  let matched = false;

  if (exactMatch) {
    category = exactMatch.data[1];
    tag = exactMatch.data[2];
    matched = true;
  } else {
    const searchWords = transactionName.split(/\s+/);
    const searchRegex = new RegExp(searchWords.join("|"), "i");
    const cat = dbcatandTag.search(searchRegex);

    if (cat) {
      category = cat.data[1];
      tag = cat.data[2];
      matched = true;
    }
  }

  return { category, tag, matched };
}

function getKeyFromSearchInCol3() {
  dbSpending.col_start = 4;
  const term = "Mild";
  const searchResults = dbSpending.searchAll(term);

  if (searchResults) {
    const amount = searchResults;
    Logger.log(amount);
  } else {
    return "Not Found";
  }
}

function searchTransactionByTerm(term, limit) {
  dbSpending.col_start = 4; // tetap mulai dari kolom D

  const searchResults = dbSpending.searchAll(term);

  if (searchResults && searchResults.length > 0) {
    // Batasi jumlah hasil sesuai limit
    const limitedResults = searchResults.slice(0, limit);

    // Misalnya ambil data yang relevan (row, pos, data)
    const formatted = limitedResults.map(r => ({
      row: r.row,
      col: r.col,
      pos: r.pos,
      data: r.data
    }));

    Logger.log(formatted);
    return formatted;
  } else {
    return "Not Found";
  }
}

function logSearchTransaction() {
  // Cari 5 transaksi dengan kata "Sampoerna Mild"
  const results1 = searchTransactionByTerm("Sampoerna Mild", 5);
  Logger.log(results1);

  // Cari 3 transaksi dengan kata "Indomie"
  const results2 = searchTransactionByTerm("Indomie", 3);
  Logger.log(results2);
}



function lastID() {
  let row = dbSpending.last_row;
  let result = dbSpending.getValue(row, 2);
  const id = result.data;
  return id;
}

function backDate(date) {

  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  return Utilities.formatDate(yesterday, "GMT+7", "dd MMMM yyyy");
}

function getBookmarkDB() {
  return new miniSheetDB2.init(ssidMoneyManagement, "Bookmark", {
    col_length: 8,
    row_start: 2,
    json: true,
    key_column: 1 // kolom USER ID
  });
}


function getLatestBookmarks(limit) {
  var db = getBookmarkDB();
  var lastRow = db.last_row;

  var numRows = limit || 5; // default ke 5 jika tidak diisi
  var startRow = Math.max(db.row_start, lastRow - numRows + 1);

  var raw = db.range(startRow, 1, lastRow - startRow + 1, db.col_length).getValues();

  var data = raw.map(row => ({
    userId: row[0],
    name: row[1],
    username: row[2],
    url: row[3],
    date: new Date(row[4]),
    raw: row
  }));

  data.sort((a, b) => b.date - a.date);

  return data.slice(0, numRows);
}

function reloadDbSpending() {
  dbSpending = new miniSheetDB2.init(ssidMoneyManagement, "Spending", {
    col_length: 8,
    row_start: 2,
    col_start: 2,
    json: true,
  });
}


