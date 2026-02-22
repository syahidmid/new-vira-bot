## 📘 PANDUAN DIRECT COMMAND

### (Command Tanpa Wizard / Satu Langkah)

---

## 🧠 DEFINISI

**Direct Command** adalah command yang:

* dieksekusi **satu langkah**
* **tanpa dialog lanjutan**
* **tanpa state / wizard**
* biasanya **read-only** atau aksi ringan

Contoh:

* `/whoiam`
* `/status`
* `/ping`
* `/help`

---

## 🗂️ STRUKTUR FILE

### 📁 Lokasi

```
bot/skills/<domain>/
```

### 📄 Penamaan File

```
*Command.js
```

📌 **Rule wajib:**

> Semua Direct Command **HARUS** diakhiri dengan `Command.js`

**Contoh:**

```
whoIAmCommand.js
botStatusCommand.js
helpCommand.js
```

---

## 🔁 ALUR EKSEKUSI

```
User Input
   ↓
handler.js (router)
   ↓
bot.command / bot.hears
   ↓
handleXxxCommand()
   ↓
ctx.reply()
```

📌 **Tetap wajib lewat router**, tidak boleh langsung logic di `webhook.js`.

---

## 🪜 LANGKAH MEMBUAT DIRECT COMMAND

---

### 1️⃣ REGISTER DI ROUTER

📁 `handler.js`

```js
bot.command('whoiam', handleWhoIAmCommand);
```

atau via `hears`:

```js
bot.hears(/^status$/i, handleBotStatusCommand);
```

---

### 2️⃣ BUAT FILE COMMAND

📁 `bot/skills/system/botStatusCommand.js`

```js
/**
 * /status
 * Show current bot status
 */
function handleBotStatusCommand(ctx) {
    const chatID = ctx.from.id;

    // Access control
    if (!isUserAllowed(chatID)) {
        ctx.reply(MSG_REJECT);
        return;
    }

    const message =
        '🤖 *Bot Status*\n' +
        'Status: Online\n' +
        'Uptime: OK';

    ctx.replyWithMarkdown(message);
}
```

✔ boleh access control
✔ boleh read DB
✔ ❌ tidak boleh wizard
✔ ❌ tidak boleh multi-step

---

## ❌ HAL YANG DILARANG

* ❌ `stage.enter()`
* ❌ `ctx.wizard`
* ❌ `ctx.data`
* ❌ state / session

Kalau butuh salah satu di atas → **HARUS pakai Wizard-Based Command**.

---

## 🧪 DEBUGGING CHECKLIST

Jika Direct Command tidak jalan:

1. Command match?
2. Sudah diregister di router?
3. Nama function benar?
4. Tidak ketiban hears lain?
5. Access control lolos?

---

## 🧩 CONTOH DIRECT COMMAND YANG BAIK

| Command   | Fungsi       |
| --------- | ------------ |
| `/whoiam` | Info user    |
| `/status` | Status bot   |
| `/help`   | Bantuan      |
| `/ping`   | Health check |

---

## 🔑 RINGKASAN ATURAN EMAS

> 🔹 **Direct Command = satu aksi, satu respon**
> 🔹 **Tanpa wizard, tanpa state**
> 🔹 **File harus `*Command.js`**
> 🔹 **Tetap lewat router**

---

## 🏁 PENUTUP

Gunakan **Direct Command** untuk:

* query cepat
* informasi
* kontrol ringan

Gunakan **Wizard-Based Command** untuk:

* input kompleks
* konfirmasi
* perubahan data

