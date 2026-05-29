// ============================================================
// AI Commerce OS Indonesia — Google Apps Script Backend API
// Version: 1.0.0 Production
// ============================================================

// ─── CONFIGURATION ──────────────────────────────────────────
function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    SPREADSHEET_ID: props.getProperty('SPREADSHEET_ID'),
    DRIVE_FOLDER_ID: props.getProperty('DRIVE_FOLDER_ID'),
    AI_API_KEY:      props.getProperty('AI_API_KEY'),       // Groq API Key
    AI_MODEL:        props.getProperty('AI_MODEL') || 'llama-3.1-70b-versatile',
    API_SECRET:      props.getProperty('API_SECRET'),       // Shared secret with Next.js
    ADMIN_EMAIL:     props.getProperty('ADMIN_EMAIL'),
  };
}

// ─── SHEET NAMES ────────────────────────────────────────────
const SHEET = {
  USERS:      'USERS',
  PRODUCTS:   'PRODUCTS',
  STORES:     'STORES',
  ANALYTICS:  'ANALYTICS',
  AI_CONTENT: 'AI_CONTENT',
  SESSIONS:   'SESSIONS',
};

// ─── CORS HEADERS ───────────────────────────────────────────
function createResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function ok(data)    { return createResponse({ success: true,  ...data }); }
function err(msg, code) { return createResponse({ success: false, message: msg, code: code || 400 }); }

// ─── ENTRY POINTS ───────────────────────────────────────────
function doGet(e) {
  try {
    const cfg   = getConfig();
    const secret = e.parameter.secret || '';
    if (cfg.API_SECRET && secret !== cfg.API_SECRET) {
      return err('Unauthorized', 401);
    }
    return routeGet(e.parameter);
  } catch(ex) {
    return err('Server error: ' + ex.message, 500);
  }
}

function doPost(e) {
  try {
    const cfg  = getConfig();
    const body = JSON.parse(e.postData.contents || '{}');
    const secret = body.secret || '';
    if (cfg.API_SECRET && secret !== cfg.API_SECRET) {
      return err('Unauthorized', 401);
    }
    return routePost(body);
  } catch(ex) {
    return err('Server error: ' + ex.message, 500);
  }
}

// ─── GET ROUTER ─────────────────────────────────────────────
function routeGet(p) {
  switch (p.action) {
    case 'getProducts':   return getProducts(p.token);
    case 'getStore':      return getStore(p.token);
    case 'getPublicStore':return getPublicStore(p.slug);
    case 'getAnalytics':  return getAnalytics(p.token);
    case 'getProfile':    return getProfile(p.token);
    case 'adminGetData':  return adminGetData(p.token);
    default:              return err('Action not found', 404);
  }
}

// ─── POST ROUTER ────────────────────────────────────────────
function routePost(body) {
  switch (body.action) {
    // Auth
    case 'register':       return registerUser(body);
    case 'login':          return loginUser(body);
    case 'logout':         return logoutUser(body.token);

    // Products
    case 'createProduct':  return createProduct(body, body.token);
    case 'updateProduct':  return updateProduct(body, body.token);
    case 'deleteProduct':  return deleteProduct(body, body.token);

    // Store
    case 'updateStore':    return updateStore(body, body.token);
    case 'updateProfile':  return updateProfile(body, body.token);
    case 'changePassword': return changePassword(body, body.token);

    // Analytics
    case 'trackVisit':     return trackVisit(body);

    // AI
    case 'aiDescription':  return aiGenerateDescription(body, body.token);
    case 'aiCaption':      return aiGenerateCaption(body, body.token);
    case 'aiHashtags':     return aiGenerateHashtags(body, body.token);
    case 'aiTitle':        return aiGenerateTitle(body, body.token);
    case 'aiContentIdeas': return aiGenerateContentIdeas(body, body.token);
    case 'aiAutoReply':    return aiGenerateAutoReply(body, body.token);

    // Upload
    case 'uploadImage':    return uploadImage(body, body.token);

    // Admin
    case 'adminBanUser':          return adminBanUser(body, body.token);
    case 'adminUpdateSubscription': return adminUpdateSubscription(body, body.token);

    default: return err('Action not found', 404);
  }
}

// ============================================================
// ─── HELPERS ────────────────────────────────────────────────
// ============================================================

function getSheet(name) {
  const cfg = getConfig();
  return SpreadsheetApp.openById(cfg.SPREADSHEET_ID).getSheetByName(name);
}

function uuid() {
  return Utilities.getUuid();
}

function nowISO() {
  return new Date().toISOString();
}

function hashPassword(password) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password + 'aicommerce_salt_2024'
  );
  return bytes.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function slugExists(slug) {
  const data = getSheet(SHEET.STORES).getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === slug) return true;
  }
  return false;
}

function makeUniqueSlug(baseName) {
  let slug = slugify(baseName);
  if (!slug) slug = 'toko';
  let candidate = slug;
  let n = 1;
  while (slugExists(candidate)) {
    candidate = slug + '-' + n;
    n++;
  }
  return candidate;
}

// ─── TOKEN VALIDATION ───────────────────────────────────────
function validateToken(token) {
  if (!token) return null;
  const sheet = getSheet(SHEET.SESSIONS);
  const data  = sheet.getDataRange().getValues();
  const SESSION_TTL_HOURS = 72;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === token) {
      const age = (Date.now() - new Date(data[i][2]).getTime()) / 36e5;
      if (age < SESSION_TTL_HOURS) {
        return data[i][1]; // user_id
      } else {
        // Expired — delete row
        sheet.deleteRow(i + 1);
        return null;
      }
    }
  }
  return null;
}

function isAdmin(token) {
  const userId = validateToken(token);
  if (!userId) return false;
  const data = getSheet(SHEET.USERS).getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      return data[i][7] === 'admin'; // role column
    }
  }
  return false;
}

function getUserById(userId) {
  const data = getSheet(SHEET.USERS).getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      return {
        user_id:           data[i][0],
        email:             data[i][1],
        whatsapp:          data[i][3],
        store_name:        data[i][4],
        subscription_plan: data[i][5],
        created_at:        data[i][6],
        role:              data[i][7] || 'user',
      };
    }
  }
  return null;
}

function getStoreByUserId(userId) {
  const data = getSheet(SHEET.STORES).getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === userId) {
      return {
        store_id:          data[i][0],
        user_id:           data[i][1],
        slug:              data[i][2],
        theme_color:       data[i][3],
        store_description: data[i][4],
        logo_url:          data[i][5],
        banner_url:        data[i][6],
        created_at:        data[i][7],
      };
    }
  }
  return null;
}

// ============================================================
// ─── AUTH ───────────────────────────────────────────────────
// ============================================================

function registerUser(body) {
  const { email, password, whatsapp, store_name } = body;

  if (!email || !password || !store_name) {
    return err('Email, password, dan nama toko wajib diisi');
  }
  if (password.length < 6) {
    return err('Password minimal 6 karakter');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return err('Format email tidak valid');
  }

  // Check email uniqueness
  const usersSheet = getSheet(SHEET.USERS);
  const userData   = usersSheet.getDataRange().getValues();
  for (let i = 1; i < userData.length; i++) {
    if (userData[i][1].toString().toLowerCase() === email.toLowerCase()) {
      return err('Email sudah terdaftar');
    }
  }

  const userId   = uuid();
  const passHash = hashPassword(password);
  const slug     = makeUniqueSlug(store_name);
  const now      = nowISO();

  // Insert user: [user_id, email, password_hash, whatsapp, store_name, subscription_plan, created_at, role]
  usersSheet.appendRow([userId, email, passHash, whatsapp || '', store_name, 'free', now, 'user']);

  // Insert store: [store_id, user_id, slug, theme_color, store_description, logo_url, banner_url, created_at]
  getSheet(SHEET.STORES).appendRow([uuid(), userId, slug, '#059669', '', '', '', now]);

  // Create session
  const token = uuid() + '-' + Date.now();
  getSheet(SHEET.SESSIONS).appendRow([token, userId, now]);

  return ok({
    token,
    user: { user_id: userId, email, store_name, whatsapp: whatsapp || '', subscription_plan: 'free', slug, role: 'user' },
  });
}

function loginUser(body) {
  const { email, password } = body;
  if (!email || !password) return err('Email dan password wajib diisi');

  const data     = getSheet(SHEET.USERS).getDataRange().getValues();
  const passHash = hashPassword(password);

  for (let i = 1; i < data.length; i++) {
    if (data[i][1].toString().toLowerCase() === email.toLowerCase()) {
      if (data[i][2] !== passHash) return err('Password salah');
      if (data[i][5] === 'banned') return err('Akun Anda telah dinonaktifkan');

      const userId = data[i][0];
      const store  = getStoreByUserId(userId);
      const token  = uuid() + '-' + Date.now();

      getSheet(SHEET.SESSIONS).appendRow([token, userId, nowISO()]);

      return ok({
        token,
        user: {
          user_id:           userId,
          email:             data[i][1],
          store_name:        data[i][4],
          whatsapp:          data[i][3],
          subscription_plan: data[i][5],
          slug:              store ? store.slug : '',
          role:              data[i][7] || 'user',
        },
      });
    }
  }
  return err('Email tidak ditemukan');
}

function logoutUser(token) {
  if (!token) return err('Token diperlukan');
  const sheet = getSheet(SHEET.SESSIONS);
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === token) {
      sheet.deleteRow(i + 1);
      return ok({ message: 'Berhasil logout' });
    }
  }
  return ok({ message: 'Session tidak ditemukan' });
}

function getProfile(token) {
  const userId = validateToken(token);
  if (!userId) return err('Unauthorized', 401);
  const user  = getUserById(userId);
  const store = getStoreByUserId(userId);
  if (!user) return err('User tidak ditemukan', 404);
  return ok({ user, store });
}

// ============================================================
// ─── PRODUCTS ───────────────────────────────────────────────
// ============================================================

function getProducts(token) {
  const userId = validateToken(token);
  if (!userId) return err('Unauthorized', 401);

  const data     = getSheet(SHEET.PRODUCTS).getDataRange().getValues();
  const products = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === userId) {
      products.push(rowToProduct(data[i]));
    }
  }
  return ok({ products });
}

function rowToProduct(row) {
  return {
    product_id:   row[0],
    user_id:      row[1],
    product_name: row[2],
    price:        Number(row[3]) || 0,
    description:  row[4],
    image_urls:   row[5] ? String(row[5]).split(',').filter(Boolean) : [],
    stock:        Number(row[6]) || 0,
    category:     row[7],
    is_active:    row[8] !== false && row[8] !== 'false',
    created_at:   row[9],
  };
}

function getUserPlan(userId) {
  const data = getSheet(SHEET.USERS).getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) return data[i][5];
  }
  return 'free';
}

function countUserProducts(userId) {
  const data = getSheet(SHEET.PRODUCTS).getDataRange().getValues();
  let count = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === userId) count++;
  }
  return count;
}

function createProduct(body, token) {
  const userId = validateToken(token);
  if (!userId) return err('Unauthorized', 401);

  const { product_name, price, description, image_urls, stock, category } = body;
  if (!product_name) return err('Nama produk wajib diisi');
  if (!price || isNaN(Number(price))) return err('Harga tidak valid');

  // Check free plan limit
  const plan = getUserPlan(userId);
  if (plan === 'free') {
    const count = countUserProducts(userId);
    if (count >= 5) {
      return err('Batas 5 produk untuk akun gratis. Upgrade ke Pro untuk produk unlimited.', 403);
    }
  }

  // Validate image count
  const imgs = Array.isArray(image_urls) ? image_urls : [];
  if (plan === 'free' && imgs.length > 5) {
    return err('Maksimal 5 gambar per produk untuk akun gratis');
  }

  const productId = uuid();
  const now       = nowISO();

  // [product_id, user_id, product_name, price, description, image_urls, stock, category, is_active, created_at]
  getSheet(SHEET.PRODUCTS).appendRow([
    productId, userId, product_name, Number(price),
    description || '', imgs.join(','), Number(stock) || 0,
    category || 'Umum', true, now,
  ]);

  return ok({ product: { product_id: productId, product_name, price: Number(price), description, image_urls: imgs, stock: Number(stock) || 0, category: category || 'Umum', is_active: true, created_at: now } });
}

function updateProduct(body, token) {
  const userId = validateToken(token);
  if (!userId) return err('Unauthorized', 401);

  const { product_id, product_name, price, description, image_urls, stock, category, is_active } = body;
  if (!product_id) return err('product_id diperlukan');

  const sheet = getSheet(SHEET.PRODUCTS);
  const data  = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === product_id && data[i][1] === userId) {
      const imgs = Array.isArray(image_urls) ? image_urls : (data[i][5] ? String(data[i][5]).split(',') : []);
      sheet.getRange(i + 1, 3, 1, 8).setValues([[
        product_name  !== undefined ? product_name  : data[i][2],
        price         !== undefined ? Number(price) : data[i][3],
        description   !== undefined ? description   : data[i][4],
        imgs.join(','),
        stock         !== undefined ? Number(stock) : data[i][6],
        category      !== undefined ? category      : data[i][7],
        is_active     !== undefined ? is_active     : data[i][8],
        data[i][9],
      ]]);
      return ok({ message: 'Produk berhasil diperbarui' });
    }
  }
  return err('Produk tidak ditemukan', 404);
}

function deleteProduct(body, token) {
  const userId = validateToken(token);
  if (!userId) return err('Unauthorized', 401);

  const { product_id } = body;
  if (!product_id) return err('product_id diperlukan');

  const sheet = getSheet(SHEET.PRODUCTS);
  const data  = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === product_id && data[i][1] === userId) {
      sheet.deleteRow(i + 1);
      return ok({ message: 'Produk berhasil dihapus' });
    }
  }
  return err('Produk tidak ditemukan', 404);
}

// ============================================================
// ─── STORES ─────────────────────────────────────────────────
// ============================================================

function getStore(token) {
  const userId = validateToken(token);
  if (!userId) return err('Unauthorized', 401);
  const store = getStoreByUserId(userId);
  if (!store) return err('Toko tidak ditemukan', 404);
  return ok({ store });
}

function getPublicStore(slug) {
  if (!slug) return err('Slug diperlukan');

  const storesData = getSheet(SHEET.STORES).getDataRange().getValues();
  let store = null;
  let userId = null;

  for (let i = 1; i < storesData.length; i++) {
    if (storesData[i][2] === slug) {
      userId = storesData[i][1];
      store = {
        store_id:          storesData[i][0],
        slug:              storesData[i][2],
        theme_color:       storesData[i][3],
        store_description: storesData[i][4],
        logo_url:          storesData[i][5],
        banner_url:        storesData[i][6],
      };
      break;
    }
  }

  if (!store || !userId) return err('Toko tidak ditemukan', 404);

  const user = getUserById(userId);
  if (!user || user.subscription_plan === 'banned') return err('Toko tidak tersedia', 404);

  store.store_name = user.store_name;
  store.whatsapp   = user.whatsapp;

  // Products (active only)
  const productsData = getSheet(SHEET.PRODUCTS).getDataRange().getValues();
  const products = [];
  for (let i = 1; i < productsData.length; i++) {
    if (productsData[i][1] === userId && productsData[i][8] !== false && productsData[i][8] !== 'false') {
      products.push(rowToProduct(productsData[i]));
    }
  }

  return ok({ store, products });
}

function updateStore(body, token) {
  const userId = validateToken(token);
  if (!userId) return err('Unauthorized', 401);

  const { theme_color, store_description, logo_url, banner_url } = body;
  const sheet = getSheet(SHEET.STORES);
  const data  = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === userId) {
      if (theme_color       !== undefined) sheet.getRange(i + 1, 4).setValue(theme_color);
      if (store_description !== undefined) sheet.getRange(i + 1, 5).setValue(store_description);
      if (logo_url          !== undefined) sheet.getRange(i + 1, 6).setValue(logo_url);
      if (banner_url        !== undefined) sheet.getRange(i + 1, 7).setValue(banner_url);
      return ok({ message: 'Toko berhasil diperbarui' });
    }
  }
  return err('Toko tidak ditemukan', 404);
}

// ============================================================
// ─── ANALYTICS ──────────────────────────────────────────────
// ============================================================

function trackVisit(body) {
  const { slug, visitor_id, clicked_product, whatsapp_click, referrer } = body;
  if (!slug) return err('Slug diperlukan');

  // Resolve store_id from slug
  const storesData = getSheet(SHEET.STORES).getDataRange().getValues();
  let storeId = null;
  for (let i = 1; i < storesData.length; i++) {
    if (storesData[i][2] === slug) { storeId = storesData[i][0]; break; }
  }
  if (!storeId) return err('Toko tidak ditemukan', 404);

  // [store_id, visitor_id, clicked_product, whatsapp_click, referrer, timestamp]
  getSheet(SHEET.ANALYTICS).appendRow([
    storeId,
    visitor_id || uuid(),
    clicked_product || '',
    whatsapp_click ? 1 : 0,
    referrer || 'direct',
    nowISO(),
  ]);

  return ok({ message: 'Tracked' });
}

function getAnalytics(token) {
  const userId = validateToken(token);
  if (!userId) return err('Unauthorized', 401);

  const store = getStoreByUserId(userId);
  if (!store) return err('Toko tidak ditemukan', 404);
  const storeId = store.store_id;

  const data = getSheet(SHEET.ANALYTICS).getDataRange().getValues();

  let totalViews = 0, totalWAClicks = 0;
  const uniqueVisitors = new Set();
  const productClicks  = {};
  const dailyMap       = {};
  const referrerMap    = {};

  const today   = new Date();
  const cutoff  = new Date(today); cutoff.setDate(today.getDate() - 29); // last 30 days

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] !== storeId) continue;

    const ts = new Date(data[i][5]);
    if (ts < cutoff) continue;

    totalViews++;
    uniqueVisitors.add(data[i][1]);
    if (Number(data[i][3]) > 0) totalWAClicks++;

    if (data[i][2]) {
      productClicks[data[i][2]] = (productClicks[data[i][2]] || 0) + 1;
    }

    const dateKey = ts.toISOString().split('T')[0];
    dailyMap[dateKey] = (dailyMap[dateKey] || 0) + 1;

    const ref = data[i][4] || 'direct';
    referrerMap[ref] = (referrerMap[ref] || 0) + 1;
  }

  // Build last-30-days chart
  const chart = [];
  for (let d = 29; d >= 0; d--) {
    const dt = new Date(today);
    dt.setDate(today.getDate() - d);
    const key = dt.toISOString().split('T')[0];
    chart.push({ date: key, visitors: dailyMap[key] || 0 });
  }

  const topProducts = Object.entries(productClicks)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, clicks]) => ({ name, clicks }));

  const topReferrers = Object.entries(referrerMap)
    .sort((a, b) => b[1] - a[1])
    .map(([source, count]) => ({ source, count }));

  const conversionRate = totalViews > 0
    ? parseFloat(((totalWAClicks / totalViews) * 100).toFixed(1))
    : 0;

  return ok({
    analytics: {
      total_views:       totalViews,
      unique_visitors:   uniqueVisitors.size,
      total_wa_clicks:   totalWAClicks,
      conversion_rate:   conversionRate,
      top_products:      topProducts,
      referrers:         topReferrers,
      daily_chart:       chart,
    },
  });
}

// ============================================================
// ─── AI FEATURES ────────────────────────────────────────────
// ============================================================

function callGroq(systemPrompt, userPrompt) {
  const cfg = getConfig();
  if (!cfg.AI_API_KEY) return null;

  try {
    const resp = UrlFetchApp.fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      muteHttpExceptions: true,
      headers: {
        'Authorization': 'Bearer ' + cfg.AI_API_KEY,
        'Content-Type':  'application/json',
      },
      payload: JSON.stringify({
        model:      cfg.AI_MODEL,
        max_tokens: 1024,
        temperature: 0.85,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt   },
        ],
      }),
    });

    const result = JSON.parse(resp.getContentText());
    if (result.error) throw new Error(result.error.message);
    return result.choices[0].message.content.trim();
  } catch (ex) {
    Logger.log('Groq error: ' + ex.message);
    return null;
  }
}

function requirePaidPlan(userId) {
  const plan = getUserPlan(userId);
  if (plan !== 'pro' && plan !== 'admin') {
    return err('Fitur AI hanya tersedia untuk akun Pro. Upgrade sekarang!', 403);
  }
  return null;
}

function saveAiContent(userId, type, content) {
  // [user_id, type, content, created_at]
  getSheet(SHEET.AI_CONTENT).appendRow([userId, type, content, nowISO()]);
}

function aiGenerateDescription(body, token) {
  const userId = validateToken(token);
  if (!userId) return err('Unauthorized', 401);

  const planErr = requirePaidPlan(userId);
  if (planErr) return planErr;

  const { product_name, category, keywords, price } = body;
  if (!product_name) return err('Nama produk diperlukan');

  const system = `Kamu adalah copywriter e-commerce Indonesia terbaik. 
Tulis dengan bahasa Indonesia yang natural, engaging, dan persuasif.
Tidak perlu penjelasan tambahan—langsung berikan konten yang diminta.`;

  const user = `Buatkan deskripsi produk yang menarik dan SEO-friendly untuk:
Nama: ${product_name}
Kategori: ${category || 'Umum'}
Harga: ${price ? 'Rp ' + Number(price).toLocaleString('id-ID') : 'tidak disebutkan'}
Kata kunci tambahan: ${keywords || '-'}

Struktur deskripsi:
1. Kalimat pembuka yang menarik perhatian (hook)
2. Keunggulan utama produk (3-4 poin dengan emoji)
3. Deskripsi detail & manfaat
4. Siapa yang cocok menggunakan produk ini
5. Penutup dengan CTA yang kuat

Gunakan emoji secukupnya. Panjang sekitar 200-250 kata.`;

  const raw = callGroq(system, user);
  const description = raw || fallbackDescription(product_name, category);

  saveAiContent(userId, 'description', description);
  return ok({ description });
}

function aiGenerateCaption(body, token) {
  const userId = validateToken(token);
  if (!userId) return err('Unauthorized', 401);

  const planErr = requirePaidPlan(userId);
  if (planErr) return planErr;

  const { product_name, platform, tone, price } = body;
  if (!product_name) return err('Nama produk diperlukan');

  const system = `Kamu adalah social media specialist Indonesia yang ahli membuat caption viral. 
Tulis caption yang terasa natural, bukan template generik.`;

  const user = `Buat 3 pilihan caption ${platform || 'Instagram/TikTok'} untuk produk:
Nama: ${product_name}
Harga: ${price ? 'Rp ' + Number(price).toLocaleString('id-ID') : '-'}
Tone: ${tone || 'casual, relatable, dan engaging'}

Setiap caption harus:
- Hook kuat di 1-2 baris pertama (buat orang berhenti scroll)
- Body yang menarik & relatable
- CTA yang jelas
- Emoji yang tepat (tidak berlebihan)
- Panjang ideal untuk ${platform || 'Instagram/TikTok'}

Format: CAPTION 1: [isi], CAPTION 2: [isi], CAPTION 3: [isi]`;

  const raw = callGroq(system, user);
  const caption = raw || fallbackCaption(product_name);

  saveAiContent(userId, 'caption', caption);
  return ok({ caption });
}

function aiGenerateHashtags(body, token) {
  const userId = validateToken(token);
  if (!userId) return err('Unauthorized', 401);

  const planErr = requirePaidPlan(userId);
  if (planErr) return planErr;

  const { product_name, category, platform } = body;
  if (!product_name) return err('Nama produk diperlukan');

  const system = 'Kamu adalah social media strategist Indonesia yang ahli hashtag research.';

  const user = `Generate 30 hashtag optimal untuk "${product_name}" (kategori: ${category || 'umum'}) di ${platform || 'Instagram & TikTok'} pasar Indonesia.

Komposisi:
- 10 hashtag mega populer (10jt+ post) → untuk reach luas
- 10 hashtag medium (100rb-1jt post) → untuk engagement lebih targeted
- 10 hashtag niche/spesifik (<100rb post) → untuk konversi tinggi

Pertimbangkan trend Indonesia saat ini.
Format: satu baris, pisahkan dengan spasi, semua dimulai dengan #.`;

  const raw = callGroq(system, user);
  const hashtags = raw || fallbackHashtags(product_name, category);

  saveAiContent(userId, 'hashtags', hashtags);
  return ok({ hashtags });
}

function aiGenerateTitle(body, token) {
  const userId = validateToken(token);
  if (!userId) return err('Unauthorized', 401);

  const planErr = requirePaidPlan(userId);
  if (planErr) return planErr;

  const { product_name, category, current_title } = body;
  if (!product_name) return err('Nama produk diperlukan');

  const system = 'Kamu adalah SEO specialist Shopee, Tokopedia, dan TikTok Shop Indonesia.';

  const user = `Optimasi judul produk untuk meningkatkan CTR dan penjualan:
Judul saat ini: ${current_title || product_name}
Kategori: ${category || 'umum'}

Berikan 5 pilihan judul yang:
- Mengandung keyword high-volume yang sering dicari pembeli Indonesia
- Maksimal 100 karakter
- Mengandung kata trigger: Original, Premium, Terlaris, Ready Stock, dll (jika relevan)
- Sertakan spec/ukuran jika memungkinkan
- Natural dan mudah dibaca

Format: 
1. [judul]
2. [judul]
3. [judul]
4. [judul]
5. [judul]`;

  const raw = callGroq(system, user);
  const titles = raw || fallbackTitles(product_name);

  saveAiContent(userId, 'title', titles);
  return ok({ titles });
}

function aiGenerateContentIdeas(body, token) {
  const userId = validateToken(token);
  if (!userId) return err('Unauthorized', 401);

  const planErr = requirePaidPlan(userId);
  if (planErr) return planErr;

  const { product_name, platform, store_name } = body;
  if (!product_name) return err('Nama produk diperlukan');

  const system = 'Kamu adalah content strategist e-commerce Indonesia yang kreatif dan berpengalaman.';

  const user = `Buat 10 ide konten kreatif untuk ${platform || 'TikTok & Instagram Reels'} mempromosikan "${product_name}" dari toko "${store_name || 'toko kami'}".

Untuk setiap ide, berikan:
- 🎬 Judul/Konsep
- 🎣 Hook pembuka (kalimat pertama yang bikin orang berhenti)
- 📝 Brief isi konten (2-3 kalimat)
- 📣 CTA di akhir

Variasikan format: unboxing, tutorial, before-after, testimoni, comparison, POV, storytelling, edukasi, humor, dll.`;

  const raw = callGroq(system, user);
  const ideas = raw || fallbackContentIdeas(product_name);

  saveAiContent(userId, 'content_ideas', ideas);
  return ok({ ideas });
}

function aiGenerateAutoReply(body, token) {
  const userId = validateToken(token);
  if (!userId) return err('Unauthorized', 401);

  const planErr = requirePaidPlan(userId);
  if (planErr) return planErr;

  const { customer_message, product_name, store_name } = body;
  if (!customer_message) return err('Pesan customer diperlukan');

  const system = `Kamu adalah customer service toko online Indonesia yang ramah, cepat, dan profesional.
Selalu gunakan bahasa Indonesia yang sopan, hangat, dan natural—bukan kaku atau formal berlebihan.
Gunakan sapaan "kak" dan emoji secukupnya.`;

  const user = `Balas pesan customer ini dengan bijak:
Customer: "${customer_message}"
Konteks: Toko "${store_name || 'kami'}", produk "${product_name || 'yang ditanyakan'}"

Berikan 3 variasi balasan (singkat-medium, medium, dan detail).
Setiap balasan harus natural, informatif, dan mengarah ke konversi.

Format:
BALASAN 1 (singkat): [teks]
BALASAN 2 (medium): [teks]  
BALASAN 3 (detail): [teks]`;

  const raw = callGroq(system, user);
  const replies = raw || fallbackAutoReply(customer_message, product_name);

  saveAiContent(userId, 'auto_reply', replies);
  return ok({ replies });
}

// ─── AI FALLBACKS (when no API key) ─────────────────────────
function fallbackDescription(name, category) {
  return `✨ Perkenalkan ${name} — pilihan terbaik untuk kebutuhan ${category || 'Anda'}!

🌟 Keunggulan Produk:
• Kualitas premium yang terjamin dan sudah teruji
• Bahan pilihan terbaik untuk hasil yang optimal
• Desain modern yang cocok untuk berbagai kebutuhan
• Harga terjangkau dengan nilai terbaik

Produk ini dirancang khusus untuk memenuhi kebutuhan Anda sehari-hari dengan sempurna. Ribuan pelanggan telah merasakan manfaatnya dan memberikan ulasan positif.

Cocok untuk Anda yang menginginkan kualitas terbaik dengan harga yang bersahabat. Tidak perlu ragu karena kepuasan Anda adalah prioritas utama kami.

🛒 Segera order sekarang sebelum kehabisan! Chat kami via WhatsApp untuk informasi lebih lanjut dan dapatkan penawaran terbaik hari ini.`;
}

function fallbackCaption(name) {
  return `CAPTION 1:
Stop scroll dulu! 🛑 ${name} ini lagi viral dan gue tau kenapa...
Udah coba belum? Yang belum, RUGI banget! Kualitas top, harga friendly ✅
DM atau link bio untuk order 💚

CAPTION 2:
POV: kamu akhirnya nemu ${name} yang worth it 🎯
Jujur, gue sempet ragu... tapi setelah coba? WOW bestie!
Detail lengkap di bio, order sekarang sebelum sold out! 🔥

CAPTION 3:
Review jujur ${name} yang lagi hype ✨
✅ Kualitas: 10/10
✅ Harga: Ramah di kantong
✅ Pelayanan: Fast respon
Mau order? Chat kita langsung ya! 💬`;
}

function fallbackHashtags(name, category) {
  const cat = (category || 'produk').toLowerCase().replace(/\s/g, '');
  const nm  = name.toLowerCase().replace(/\s/g, '');
  return `#jualonline #olshop #shopee #tokopedia #tiktokshop #belanjayuk #produklokal #umkmindonesia #bisnisonline #reseller #dropship #jualanonline #olshopindonesia #rekomendasiproduk #fyp #fypシ #viral #trending #indonesia #murahberkualitas #${nm} #${cat} #terlaris #bestseller #readystock #ongkirgratis #flashsale #harbolnas #shopaholic #belanja`;
}

function fallbackTitles(name) {
  return `1. ${name} Premium Original Berkualitas Tinggi - Best Seller Indonesia
2. [READY STOCK] ${name} Murah Berkualitas | Free Ongkir | Fast Respon  
3. ${name} Terlaris ⭐ Kualitas Premium | Harga Terjangkau | Garansi Puas
4. ✅ ${name} ORIGINAL | Trusted Seller | Pengiriman Cepat Seluruh Indonesia
5. ${name} | Premium Quality | COD Available | Promo Terbatas - Order Sekarang`;
}

function fallbackContentIdeas(name) {
  return `1. 🎬 UNBOXING ${name}
🎣 "Kalian minta review jujur, ini dia hasilnya..."
📝 Unboxing dramatis dengan reaksi natural. Tampilkan packaging, detail produk, dan kesan pertama.
📣 "Link order di bio, fast respon!"

2. 🎬 Before vs After pakai ${name}
🎣 "Ini sebelum... ini sesudah. Bedanya NYATA banget."
📝 Demonstrasi visual perubahan/manfaat produk. Musik trending + transisi smooth.
📣 "Mau merasakan perbedaannya? Order sekarang!"

3. 🎬 "${name} worth it atau nggak?"
🎣 "Gue habiskan [harga] untuk ini, dan ternyata..."
📝 Review jujur format vlog pendek. Pro & cons. Kesimpulan positif.
📣 "Verdict: Worth it! DM untuk order."`;
}

function fallbackAutoReply(msg, product) {
  return `BALASAN 1 (singkat):
Halo kak! Terima kasih udah tanya soal ${product || 'produk kami'} 😊 Masih ada stok kak, mau order berapa? Kita langsung proses!

BALASAN 2 (medium):
Hai kak, selamat datang! 👋 Makasih udah tertarik sama ${product || 'produk kami'}. Produknya ready stock ya kak. Untuk informasi lengkap bisa kak lihat di deskripsi atau mau kita bantu jelaskan? Langsung order aja kak, kita fast respon dan packing rapi! 📦

BALASAN 3 (detail):
Halo kak, selamat datang di toko kami! 🌟 Terima kasih sudah menghubungi kami mengenai ${product || 'produk ini'}. Kami dengan senang hati membantu kakak! Produk ini tersedia ready stock dan bisa langsung kami proses. Pengiriman bisa ke seluruh Indonesia dengan berbagai pilihan ekspedisi. Ada pertanyaan lain? Kami siap bantu 24 jam ya kak. Yuk segera order sebelum kehabisan! 💚`;
}

// ============================================================
// ─── IMAGE UPLOAD ───────────────────────────────────────────
// ============================================================

function uploadImage(body, token) {
  const userId = validateToken(token);
  if (!userId) return err('Unauthorized', 401);

  const { image_data, filename, mime_type } = body;
  if (!image_data || !filename) return err('Data gambar dan nama file diperlukan');

  // Free plan: no restriction on upload itself, restriction is on product images count
  const cfg = getConfig();

  try {
    const folder = DriveApp.getFolderById(cfg.DRIVE_FOLDER_ID);
    const decoded = Utilities.base64Decode(image_data);
    const blob    = Utilities.newBlob(decoded, mime_type || 'image/jpeg', filename);
    const file    = folder.createFile(blob);

    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const fileId   = file.getId();
    const imageUrl = 'https://drive.google.com/uc?export=view&id=' + fileId;

    return ok({ image_url: imageUrl, file_id: fileId });
  } catch (ex) {
    return err('Gagal upload gambar: ' + ex.message, 500);
  }
}

// ============================================================
// ─── ADMIN ──────────────────────────────────────────────────
// ============================================================

function adminGetData(token) {
  if (!isAdmin(token)) return err('Unauthorized', 401);

  const usersSheet    = getSheet(SHEET.USERS);
  const usersData     = usersSheet.getDataRange().getValues();
  const productsSheet = getSheet(SHEET.PRODUCTS);
  const analyticsSheet= getSheet(SHEET.ANALYTICS);

  const users = [];
  let totalFree = 0, totalPro = 0, totalBanned = 0;

  for (let i = 1; i < usersData.length; i++) {
    const plan = usersData[i][5];
    if (plan === 'free')   totalFree++;
    if (plan === 'pro')    totalPro++;
    if (plan === 'banned') totalBanned++;

    users.push({
      user_id:           usersData[i][0],
      email:             usersData[i][1],
      whatsapp:          usersData[i][3],
      store_name:        usersData[i][4],
      subscription_plan: usersData[i][5],
      created_at:        usersData[i][6],
      role:              usersData[i][7] || 'user',
    });
  }

  return ok({
    stats: {
      total_users:    users.length,
      total_free:     totalFree,
      total_pro:      totalPro,
      total_banned:   totalBanned,
      total_products: Math.max(0, productsSheet.getLastRow() - 1),
      total_visits:   Math.max(0, analyticsSheet.getLastRow() - 1),
    },
    users,
  });
}

function adminBanUser(body, token) {
  if (!isAdmin(token)) return err('Unauthorized', 401);
  const { user_id } = body;
  if (!user_id) return err('user_id diperlukan');

  const sheet = getSheet(SHEET.USERS);
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === user_id) {
      sheet.getRange(i + 1, 6).setValue('banned');
      return ok({ message: 'User berhasil di-ban' });
    }
  }
  return err('User tidak ditemukan', 404);
}

function adminUpdateSubscription(body, token) {
  if (!isAdmin(token)) return err('Unauthorized', 401);
  const { user_id, plan } = body;
  if (!user_id || !plan) return err('user_id dan plan diperlukan');
  if (!['free', 'pro', 'banned', 'admin'].includes(plan)) return err('Plan tidak valid');

  const sheet = getSheet(SHEET.USERS);
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === user_id) {
      sheet.getRange(i + 1, 6).setValue(plan);
      return ok({ message: `Subscription berhasil diubah ke ${plan}` });
    }
  }
  return err('User tidak ditemukan', 404);
}

// ============================================================
// ─── MAINTENANCE TRIGGERS ───────────────────────────────────
// ============================================================

// Run this via time-driven trigger daily to clean expired sessions
function cleanExpiredSessions() {
  const sheet = getSheet(SHEET.SESSIONS);
  const data  = sheet.getDataRange().getValues();
  const SESSION_TTL_HOURS = 72;
  const toDelete = [];

  for (let i = data.length - 1; i >= 1; i--) {
    const age = (Date.now() - new Date(data[i][2]).getTime()) / 36e5;
    if (age >= SESSION_TTL_HOURS) toDelete.push(i + 1);
  }

  toDelete.forEach(row => sheet.deleteRow(row));
  Logger.log('Cleaned ' + toDelete.length + ' expired sessions');
}

// ============================================================
// ─── PROFILE MANAGEMENT ─────────────────────────────────────
// ============================================================

function updateProfile(body, token) {
  const userId = validateToken(token);
  if (!userId) return err('Unauthorized', 401);

  const { store_name, whatsapp } = body;
  const sheet = getSheet(SHEET.USERS);
  const data  = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      if (whatsapp   !== undefined) sheet.getRange(i + 1, 4).setValue(whatsapp);
      if (store_name !== undefined) {
        sheet.getRange(i + 1, 5).setValue(store_name);
        // Update store name reference (stores sheet doesn't store name directly but user does)
      }
      return ok({ message: 'Profil berhasil diperbarui' });
    }
  }
  return err('User tidak ditemukan', 404);
}

function changePassword(body, token) {
  const userId = validateToken(token);
  if (!userId) return err('Unauthorized', 401);

  const { current_password, new_password } = body;
  if (!current_password || !new_password) return err('Password lama dan baru wajib diisi');
  if (new_password.length < 6) return err('Password baru minimal 6 karakter');

  const sheet = getSheet(SHEET.USERS);
  const data  = sheet.getDataRange().getValues();
  const currentHash = hashPassword(current_password);

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      if (data[i][2] !== currentHash) return err('Password lama salah');
      sheet.getRange(i + 1, 3).setValue(hashPassword(new_password));
      // Invalidate all sessions for this user
      const sessSheet = getSheet(SHEET.SESSIONS);
      const sessData  = sessSheet.getDataRange().getValues();
      for (let j = sessData.length - 1; j >= 1; j--) {
        if (sessData[j][1] === userId) sessSheet.deleteRow(j + 1);
      }
      return ok({ message: 'Password berhasil diubah. Silakan login kembali.' });
    }
  }
  return err('User tidak ditemukan', 404);
}
