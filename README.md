# AI Commerce OS Indonesia 🛍️

Platform toko online AI-powered untuk UMKM Indonesia.  
Backend: Google Apps Script + Google Sheets + Google Drive.  
Frontend: Next.js 14 + Tailwind CSS.

---

## 📁 Struktur Project

```
ai-commerce-os/
├── apps-script/
│   ├── Code.gs          ← Backend API lengkap
│   └── Setup.gs         ← Inisialisasi spreadsheet & triggers
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── (auth)/login/       ← Halaman login
    │   │   ├── (auth)/register/    ← Halaman daftar
    │   │   ├── api/proxy/          ← API proxy ke Apps Script
    │   │   ├── dashboard/          ← Dashboard seller
    │   │   │   ├── page.tsx        ← Overview & stats
    │   │   │   ├── products/       ← Kelola produk (CRUD + upload)
    │   │   │   ├── analytics/      ← Analitik toko (chart 30 hari)
    │   │   │   ├── ai-tools/       ← 6 fitur AI
    │   │   │   └── store/          ← Kustomisasi toko
    │   │   ├── s/[slug]/           ← Storefront publik pelanggan
    │   │   └── admin/              ← Admin panel
    │   └── lib/
    │       ├── api.ts              ← API client
    │       └── auth.ts             ← Session management
    └── .env.example
```

---

## 🚀 LANGKAH DEPLOY (Step by Step)

### STEP 1 — Buat Google Spreadsheet

1. Buka [sheets.google.com](https://sheets.google.com) → buat spreadsheet baru
2. Beri nama: `AI Commerce OS DB`
3. Catat **Spreadsheet ID** dari URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```

---

### STEP 2 — Buat Google Drive Folder

1. Buka [drive.google.com](https://drive.google.com) → buat folder baru
2. Beri nama: `AI Commerce OS Images`
3. Klik kanan folder → **Share** → ubah ke "Anyone with the link can view"
4. Catat **Folder ID** dari URL:
   ```
   https://drive.google.com/drive/folders/[FOLDER_ID]
   ```

---

### STEP 3 — Setup Google Apps Script

1. Buka Spreadsheet → **Extensions** → **Apps Script**
2. Hapus semua kode default di `Code.gs`
3. Copy-paste isi file `apps-script/Code.gs` ke editor
4. Buat file baru → nama `Setup.gs` → copy-paste isi `apps-script/Setup.gs`
5. **Atur Script Properties:**
   - Klik ikon ⚙️ **Project Settings** → **Script Properties**
   - Tambahkan semua properti berikut:

   | Property          | Value                          |
   |-------------------|--------------------------------|
   | `SPREADSHEET_ID`  | ID dari Step 1                 |
   | `DRIVE_FOLDER_ID` | ID dari Step 2                 |
   | `AI_API_KEY`      | Groq API Key (lihat Step 4)    |
   | `AI_MODEL`        | `llama-3.1-70b-versatile`     |
   | `API_SECRET`      | Random string 32+ karakter     |
   | `ADMIN_EMAIL`     | Email admin kamu               |

6. **Jalankan Setup:**
   - Di editor, pilih fungsi `setupAll` dari dropdown
   - Klik tombol **Run** ▶️
   - Izinkan semua permission yang diminta
   - Cek log: harus muncul "✅ Setup complete!"

7. **Deploy sebagai Web App:**
   - Klik **Deploy** → **New Deployment**
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Klik **Deploy**
   - Catat **Web App URL** (format: `https://script.google.com/macros/s/xxx/exec`)

   > ⚠️ **PENTING:** Setiap kali ubah kode Apps Script, buat deployment BARU (versi baru).

---

### STEP 4 — Dapatkan Groq API Key (Gratis)

1. Buka [console.groq.com](https://console.groq.com)
2. Daftar/login → **API Keys** → **Create API Key**
3. Copy API key → masukkan ke Script Properties `AI_API_KEY`

> Model rekomendasi: `llama-3.1-70b-versatile` (cerdas) atau `llama-3.1-8b-instant` (cepat)

---

### STEP 5 — Setup Frontend Next.js

```bash
# Clone atau masuk ke folder frontend
cd ai-commerce-os/frontend

# Install dependencies
npm install

# Buat file .env.local
cp .env.example .env.local
```

Edit `.env.local`:
```env
APPS_SCRIPT_URL=https://script.google.com/macros/s/[SCRIPT_ID]/exec
API_SECRET=random_secret_sama_dengan_script_properties
NEXT_PUBLIC_APP_URL=https://domain-kamu.com
NEXT_PUBLIC_APP_NAME=AI Commerce OS
```

> ⚠️ `API_SECRET` harus **sama persis** dengan yang di Script Properties!

---

### STEP 6 — Test Lokal

```bash
npm run dev
# Buka: http://localhost:3000
```

Test flow:
1. Buka `http://localhost:3000` → klik **Daftar**
2. Daftar akun baru → masuk ke dashboard
3. Tambah produk → lihat di `/s/[slug]`
4. Test klik WhatsApp di storefront

---

### STEP 7 — Deploy ke Vercel (Rekomendasi)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Atau connect GitHub repo di vercel.com
```

Di Vercel dashboard:
1. Tambahkan Environment Variables:
   - `APPS_SCRIPT_URL` = Web App URL dari Step 3
   - `API_SECRET` = sama dengan Script Properties
   - `NEXT_PUBLIC_APP_URL` = `https://[nama].vercel.app`

2. Deploy → siap!

---

### STEP 8 — Buat Akun Admin

Setelah deploy, ada 2 cara:

**Cara 1** — Via Apps Script (rekomendasi):
```javascript
// Jalankan di Apps Script editor
function makeAdmin() {
  const sheet = getSheet(SHEET.USERS);
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === 'email-admin@kamu.com') {
      sheet.getRange(i + 1, 6).setValue('admin'); // plan
      sheet.getRange(i + 1, 8).setValue('admin'); // role
      Logger.log('Admin role set!');
      break;
    }
  }
}
```

**Cara 2** — Via `seedTestData()`:
- Jalankan fungsi `seedTestData()` di Setup.gs
- Login dengan `admin@aicommerce.id` / `admin123`
- Akses `/admin`

---

## 🗄️ Database Schema

### USERS
| Kolom | Deskripsi |
|-------|-----------|
| user_id | UUID unik |
| email | Email login |
| password_hash | SHA-256 + salt |
| whatsapp | Nomor WA untuk terima order |
| store_name | Nama toko |
| subscription_plan | `free` / `pro` / `admin` / `banned` |
| created_at | Timestamp |
| role | `user` / `admin` |

### PRODUCTS
| Kolom | Deskripsi |
|-------|-----------|
| product_id | UUID |
| user_id | FK ke USERS |
| product_name | Nama produk |
| price | Harga (number) |
| description | Deskripsi |
| image_urls | URL dipisah koma |
| stock | Jumlah stok |
| category | Kategori |
| is_active | Boolean |
| created_at | Timestamp |

### STORES
| Kolom | Deskripsi |
|-------|-----------|
| store_id | UUID |
| user_id | FK ke USERS |
| slug | URL slug unik |
| theme_color | Hex color |
| store_description | Deskripsi toko |
| logo_url | URL logo di Drive |
| banner_url | URL banner di Drive |
| created_at | Timestamp |

### ANALYTICS
| Kolom | Deskripsi |
|-------|-----------|
| store_id | FK ke STORES |
| visitor_id | ID visitor (localStorage) |
| clicked_product | Nama produk yang diklik |
| whatsapp_click | 0 / 1 |
| referrer | Domain asal traffic |
| timestamp | Waktu kunjungan |

### AI_CONTENT
| Kolom | Deskripsi |
|-------|-----------|
| user_id | FK ke USERS |
| type | `description`/`caption`/`hashtags`/dll |
| content | Hasil generate AI |
| created_at | Timestamp |

### SESSIONS
| Kolom | Deskripsi |
|-------|-----------|
| token | UUID-timestamp token |
| user_id | FK ke USERS |
| created_at | Timestamp (TTL: 72 jam) |

---

## 🔐 Keamanan

- Password di-hash dengan SHA-256 + salt sebelum disimpan
- Session token: UUID random, expire 72 jam
- `API_SECRET` shared secret antara Next.js dan Apps Script
- Apps Script hanya menerima request dengan secret yang benar
- Admin check dilakukan server-side di Apps Script

---

## 💰 Monetization (Midtrans/Xendit)

Arsitektur sudah siap untuk payment gateway:

```typescript
// Di Next.js, tambahkan endpoint:
// POST /api/payment/create-invoice

// Contoh Xendit integration:
const xendit = require('xendit-node');
const invoice = await xendit.Invoice.createInvoice({
  externalID: `invoice-${userId}-${Date.now()}`,
  amount: 99000, // Rp 99.000
  description: 'AI Commerce OS Pro - 1 Bulan',
  customer: { email, mobileNumber: whatsapp },
  successRedirectURL: `${APP_URL}/dashboard?upgrade=success`,
  failureRedirectURL: `${APP_URL}/dashboard?upgrade=failed`,
});

// Setelah payment sukses (webhook):
// Update subscription_plan di Google Sheets via Apps Script API
await adminApi.updateSubscription(adminToken, userId, 'pro');
```

---

## ⚙️ Maintenance

### Cleanup session expired
Sudah ada trigger otomatis daily jam 02:00.  
Atau jalankan manual: `cleanExpiredSessions()` di Apps Script.

### Re-deploy Apps Script setelah update kode
```
Deploy → New Deployment → Web App → Anyone → Deploy
Update APPS_SCRIPT_URL di .env.local dengan URL baru
```

### Monitor quota Apps Script
- Free: 6 menit execution/hari, 1000 URL fetch/hari
- Upgrade ke Google Workspace untuk quota lebih besar

---

## 🐛 Troubleshooting

**"Server timeout" errors**
→ Apps Script cold start bisa 5-10 detik. Normal, coba lagi.

**"Unauthorized" errors**
→ Cek API_SECRET sama antara .env.local dan Script Properties.

**Gambar tidak muncul dari Drive**
→ Pastikan folder Drive sudah di-share "Anyone with link can view".

**AI tidak generate konten**
→ Cek AI_API_KEY di Script Properties. Tanpa API key, AI pakai fallback template.

**Session hilang terus**
→ Browser privacy mode menghapus localStorage. Gunakan mode normal.

---

## 📱 Fitur Utama

| Fitur | Free | Pro |
|-------|------|-----|
| URL Toko Sendiri | ✅ | ✅ |
| Produk | Maks 5 | Unlimited |
| Gambar per produk | Maks 5 | Maks 20 |
| Order via WhatsApp | ✅ | ✅ |
| Kustomisasi tema | ✅ | ✅ |
| Analitik dasar | ✅ | ✅ |
| Analitik 30 hari | ❌ | ✅ |
| AI Deskripsi Produk | ❌ | ✅ |
| AI Caption TikTok/IG | ❌ | ✅ |
| AI Hashtag Generator | ❌ | ✅ |
| AI Judul Optimizer | ❌ | ✅ |
| AI Ide Konten | ❌ | ✅ |
| AI Auto Reply | ❌ | ✅ |
| Upload ke Drive | ✅ | ✅ |

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (App Router), Tailwind CSS, Recharts
- **Backend:** Google Apps Script
- **Database:** Google Sheets
- **Storage:** Google Drive
- **AI:** Groq API (llama-3.1-70b-versatile)
- **Auth:** Custom token-based (localStorage)
- **Deploy:** Vercel (frontend) + Apps Script (backend)

---

Made with ❤️ for UMKM Indonesia 🇮🇩
