// ============================================================
// AI Commerce OS Indonesia — Setup Script
// Run setupAll() once after creating the spreadsheet
// ============================================================

function setupAll() {
  setupSheets();
  setupProperties();
  setupTriggers();
  Logger.log('✅ Setup complete! Check execution log for details.');
}

function setupSheets() {
  const cfg = getConfig();
  if (!cfg.SPREADSHEET_ID) {
    throw new Error('SPREADSHEET_ID tidak ditemukan. Set dulu di Script Properties!');
  }

  const ss = SpreadsheetApp.openById(cfg.SPREADSHEET_ID);

  const schemas = [
    {
      name: SHEET.USERS,
      headers: ['user_id', 'email', 'password_hash', 'whatsapp', 'store_name', 'subscription_plan', 'created_at', 'role'],
      widths:  [220, 200, 300, 120, 150, 120, 180, 80],
      color:   '#E8F5E9',
    },
    {
      name: SHEET.PRODUCTS,
      headers: ['product_id', 'user_id', 'product_name', 'price', 'description', 'image_urls', 'stock', 'category', 'is_active', 'created_at'],
      widths:  [220, 220, 180, 100, 300, 400, 80, 100, 80, 180],
      color:   '#E3F2FD',
    },
    {
      name: SHEET.STORES,
      headers: ['store_id', 'user_id', 'slug', 'theme_color', 'store_description', 'logo_url', 'banner_url', 'created_at'],
      widths:  [220, 220, 150, 100, 300, 300, 300, 180],
      color:   '#FFF3E0',
    },
    {
      name: SHEET.ANALYTICS,
      headers: ['store_id', 'visitor_id', 'clicked_product', 'whatsapp_click', 'referrer', 'timestamp'],
      widths:  [220, 220, 180, 120, 150, 180],
      color:   '#F3E5F5',
    },
    {
      name: SHEET.AI_CONTENT,
      headers: ['user_id', 'type', 'content', 'created_at'],
      widths:  [220, 120, 500, 180],
      color:   '#FFF8E1',
    },
    {
      name: SHEET.SESSIONS,
      headers: ['token', 'user_id', 'created_at'],
      widths:  [300, 220, 180],
      color:   '#FCE4EC',
    },
  ];

  schemas.forEach(schema => {
    let sheet = ss.getSheetByName(schema.name);

    if (!sheet) {
      sheet = ss.insertSheet(schema.name);
      Logger.log('Created sheet: ' + schema.name);
    }

    // Only write headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(schema.headers);
    }

    // Style header row
    const headerRange = sheet.getRange(1, 1, 1, schema.headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground(schema.color);
    headerRange.setFontSize(11);
    headerRange.setBorder(true, true, true, true, true, true);

    // Set column widths
    schema.widths.forEach((w, idx) => {
      sheet.setColumnWidth(idx + 1, w);
    });

    // Freeze header row
    sheet.setFrozenRows(1);

    // Auto-resize if possible
    sheet.setRowHeight(1, 32);

    Logger.log('✅ Sheet configured: ' + schema.name);
  });

  Logger.log('All sheets configured successfully!');
}

function setupProperties() {
  Logger.log(`
==========================================
SCRIPT PROPERTIES YANG PERLU DIISI MANUAL
==========================================
Buka: Extensions > Apps Script > Project Settings > Script Properties

1. SPREADSHEET_ID   = [ID Google Spreadsheet kamu]
2. DRIVE_FOLDER_ID  = [ID Google Drive Folder untuk gambar]
3. AI_API_KEY       = [Groq API Key dari console.groq.com]
4. AI_MODEL         = llama-3.1-70b-versatile
5. API_SECRET       = [Random string panjang, contoh: xk9m2p...]
6. ADMIN_EMAIL      = [Email admin kamu]
==========================================
  `);
}

function setupTriggers() {
  // Remove existing triggers first
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'cleanExpiredSessions') {
      ScriptApp.deleteTrigger(t);
    }
  });

  // Create daily trigger to clean sessions
  ScriptApp.newTrigger('cleanExpiredSessions')
    .timeBased()
    .everyDays(1)
    .atHour(2) // 2 AM
    .create();

  Logger.log('✅ Daily session cleanup trigger created (runs at 2 AM)');
}

// ─── SEED DATA (for testing) ──────────────────────────────
function seedTestData() {
  Logger.log('Seeding test data...');

  // Register a test seller
  const regResult = registerUser({
    email:      'seller@test.com',
    password:   'test123',
    whatsapp:   '6281234567890',
    store_name: 'Toko Demo Cantik',
  });

  Logger.log('Test seller: ' + JSON.stringify(regResult));

  // Register admin
  const adminResult = registerUser({
    email:      'admin@aicommerce.id',
    password:   'admin123',
    whatsapp:   '6289999999999',
    store_name: 'Admin Panel',
  });

  // Set role to admin
  if (adminResult.success) {
    const sheet = getSheet(SHEET.USERS);
    const data  = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === 'admin@aicommerce.id') {
        sheet.getRange(i + 1, 6).setValue('admin');
        sheet.getRange(i + 1, 8).setValue('admin');
        break;
      }
    }
  }

  Logger.log('Test data seeded successfully!');
  Logger.log('Seller: seller@test.com / test123');
  Logger.log('Admin:  admin@aicommerce.id / admin123');
}

// ─── VERIFY SETUP ────────────────────────────────────────────
function verifySetup() {
  const cfg = getConfig();
  Logger.log('=== SETUP VERIFICATION ===');
  Logger.log('SPREADSHEET_ID:  ' + (cfg.SPREADSHEET_ID ? '✅ Set' : '❌ Missing'));
  Logger.log('DRIVE_FOLDER_ID: ' + (cfg.DRIVE_FOLDER_ID ? '✅ Set' : '❌ Missing'));
  Logger.log('AI_API_KEY:      ' + (cfg.AI_API_KEY ? '✅ Set' : '⚠️ Missing (AI features disabled)'));
  Logger.log('API_SECRET:      ' + (cfg.API_SECRET ? '✅ Set' : '⚠️ Missing (API open access)'));
  Logger.log('ADMIN_EMAIL:     ' + (cfg.ADMIN_EMAIL ? '✅ ' + cfg.ADMIN_EMAIL : '⚠️ Missing'));

  // Check sheets
  const sheetNames = Object.values(SHEET);
  sheetNames.forEach(name => {
    try {
      const s = getSheet(name);
      Logger.log('Sheet ' + name + ': ' + (s ? '✅ Exists (' + s.getLastRow() + ' rows)' : '❌ Missing'));
    } catch(e) {
      Logger.log('Sheet ' + name + ': ❌ Error - ' + e.message);
    }
  });

  Logger.log('=== END VERIFICATION ===');
}
