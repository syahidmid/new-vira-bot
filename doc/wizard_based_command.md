# 📘 PANDUAN SINGKAT (FINAL)

## Membuat `bot.hears` / `bot.command` Baru Menggunakan Wizard

---

## 🧠 KONSEP DASAR (WAJIB PAHAM)

Dalam project ini:

* **Wizard TIDAK pernah melakukan register**
* **Stage adalah satu-satunya registry owner**
* **Lifecycle aplikasi dikontrol dari `code.gs`**

> Wizard = *Scene factory*
> Stage = *Registry*
> code.gs = *Lifecycle owner*

---

## 🧠 ATURAN PENAMAAN FILE (WAJIB)

| Trigger                  | Lokasi           | Contoh File                    |
| ------------------------ | ---------------- | ------------------------------ |
| `bot.hears` (teks biasa) | `bot/skills/**/` | `addDefaultCategoryWizard.js`  |
| `/command` atau `#tag`   | `bot/skills/**/` | `addDefaultCategoryCommand.js` |
| Wizard (Scene)           | `bot/wizard/`    | `addDefaultCategoryWizard.js`  |

📌 **Rule utama:**

> Trigger teks biasa → **`*Wizard.js`**
> Trigger `/` atau `#` → **`*Command.js`**

---

## 🪜 LANGKAH MEMBUAT BEHAVIOR BARU (URUTAN FINAL)

---

## 1️⃣ DEFINE TRIGGER (`bot.hears` / `bot.command`)

📁 `handler.js`

```js
bot.hears(/add.*default.*category/i, handleAddCategoryWizard);
```

atau:

```js
bot.command('adddefaultcategory', handleAddCategoryWizard);
bot.hears(/^#addcategory/i, handleAddCategoryWizard);
```

📌 **Catatan penting:**

* File ini **hanya routing**
* Tidak tahu wizard
* Tidak tahu DB
* Tidak punya logic

---

## 2️⃣ BUAT HANDLER (ENTRY GATE)

📁 `bot/skills/finance_assistant/addDefaultCategoryWizard.js`

```js
/**
 * Entry handler: Add Default Category
 */
function handleAddCategoryWizard(ctx) {
    const chatID = ctx.from.id;

    // Access control only
    if (!isUserAllowed(chatID)) {
        ctx.reply(MSG_REJECT);
        return;
    }

    // Hand off to wizard
    return stage.enter('add_default_category');
}
```

✔ boleh access control
✔ boleh logging ringan
❌ tidak boleh DB
❌ tidak boleh appendSheets
❌ tidak boleh logic bisnis

---

## 3️⃣ BUAT WIZARD (SCENE FACTORY)

📁 `bot/wizard/addDefaultCategoryWizard.js`

```js
/**
 * Wizard: Add Default Category
 * STEP 1: Ask expense query
 * STEP 2: Ask category
 * STEP 3: Save → EXIT
 */
function createAddDefaultCategoryWizard(Scene) {

    return new Scene(
        'add_default_category',
        stepAskQuery,
        stepAskCategory,
        stepSave
    );
}
```

📌 **Aturan penting di wizard:**

* Wizard **hanya** mengembalikan `Scene`
* Wizard **tidak tahu `stage`**
* Wizard **tidak melakukan register**
* Semua UX, validasi, dan save logic ada di sini

---

## 4️⃣ REGISTER WIZARD (TERPUSAT)

📁 `bot/wizard/initWizardStage.js`

```js
/**
 * Initialize all wizard scenes
 * Called ONCE from code.gs
 */

let stage;

function initWizardStage(bot) {
    const addDefaultCategoryWizard =
        createAddDefaultCategoryWizard(Scene);

    stage = new Stage([
        addDefaultCategoryWizard
    ]);

    bot.use(stage.middleware());
}
```

📌 **INI SATU-SATUNYA TEMPAT REGISTER**

> ❗ Wizard **tidak akan jalan**
> jika **tidak dimasukkan ke array `new Stage([...])`**

---

## 🔁 FLOW EKSEKUSI (SESUAI REALITY)

```
User message
   ↓
bot.hears / bot.command
   ↓
handleXxxWizard (entry gate)
   ↓
stage.enter('scene_name')
   ↓
Wizard (Scene)
   ↓
Core logic + save
```

---

## ❌ HAL YANG DILARANG (FINAL & TEGAS)

* ❌ Logic bisnis di `handler`
* ❌ DB access di `skills`
* ❌ `stage.register()` di wizard
* ❌ Wizard mengakses `stage`
* ❌ Membuat `Stage` selain di `initWizardStage`
* ❌ `ctx.scene.leave()` (gunakan `ctx.wizard.leave()`)
* ❌ `ctx.wizard.state` (gunakan `ctx.data`)

---

## 🧪 CEK CEPAT JIKA TIDAK JALAN

1. `bot.hears` / `bot.command` match?
2. Handler terpanggil?
3. `stage.enter('scene_name')` dieksekusi?
4. Wizard **dibuat oleh `createXWizard(Scene)`**?
5. Wizard **MASUK ke array `new Stage([...])`**?
6. `scene_name` konsisten?

---

## 🏁 TEMPLATE NAMA (REKOMENDASI)

| Tujuan            | File                           |
| ----------------- | ------------------------------ |
| Trigger + handler | `addDefaultCategoryWizard.js`  |
| Wizard (Scene)    | `addDefaultCategoryWizard.js`  |
| Command           | `addDefaultCategoryCommand.js` |
| Scene name        | `add_default_category`         |

---

## 🔑 KESIMPULAN (FINAL)

> **hears / command = trigger**
> **handler = gate**
> **wizard = brain (Scene)**
> **stage = registry**
> **code.gs = lifecycle owner**
