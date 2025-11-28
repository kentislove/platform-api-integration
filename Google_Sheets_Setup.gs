/**
 * 平台API串接互換系統 - Google Sheets 資料庫設置腳本
 * 版本: v2.0
 * 建立日期: 2025-11-27
 * 
 * 使用說明:
 * 1. 開啟 Google Sheets
 * 2. 工具 > 指令碼編輯器
 * 3. 貼上此程式碼
 * 4. 執行 setup() 函數
 * 5. 授權後會自動建立所有工作表和設定
 */

// ============================================
// 系統設定
// ============================================
const CONFIG = {
  // Email 通知設定
  NOTIFICATION_EMAIL: 'your-email@example.com', // 請修改為實際 Email
  
  // 安全庫存閾值
  SAFETY_STOCK_THRESHOLD: 2,
  
  // 同步間隔(分鐘)
  SYNC_INTERVAL_MINUTES: 1,
  
  // 工作表名稱
  SHEETS: {
    VENDOR_PRODUCTS: '廠商原料號主檔',
    PLATFORM_MAPPING: '平台料號映射',
    INVENTORY_MASTER: '主庫存(YAHOO)',
    INVENTORY_SYNC: '同步庫存記錄',
    ORDERS: '訂單記錄',
    SYNC_LOGS: '同步日誌',
    ALERTS: '庫存警示',
    SYSTEM_CONFIG: '系統設定'
  }
};

// ============================================
// 主要設置函數
// ============================================
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  Logger.log('開始建立資料庫結構...');
  
  // 建立所有工作表
  createVendorProductsSheet(ss);
  createPlatformMappingSheet(ss);
  createInventoryMasterSheet(ss);
  createInventorySyncSheet(ss);
  createOrdersSheet(ss);
  createSyncLogsSheet(ss);
  createAlertsSheet(ss);
  createSystemConfigSheet(ss);
  
  // 插入預設資料
  insertDefaultConfig(ss);
  
  // 設定觸發器
  setupTriggers();
  
  // 設定資料驗證
  setupDataValidation(ss);
  
  Logger.log('資料庫結構建立完成！');
  
  // 發送完成通知
  sendEmail(
    CONFIG.NOTIFICATION_EMAIL,
    '【系統通知】資料庫設置完成',
    '平台API串接互換系統的 Google Sheets 資料庫已成功建立。\n\n請開始設定平台 API 金鑰和料號映射。'
  );
  
  SpreadsheetApp.getUi().alert('✅ 資料庫設置完成！\n\n所有工作表已建立，請檢查各工作表內容。');
}

// ============================================
// 1. 廠商原料號主檔
// ============================================
function createVendorProductsSheet(ss) {
  const sheetName = CONFIG.SHEETS.VENDOR_PRODUCTS;
  let sheet = ss.getSheetByName(sheetName);
  
  if (sheet) {
    Logger.log(`工作表 "${sheetName}" 已存在，跳過建立`);
    return;
  }
  
  sheet = ss.insertSheet(sheetName);
  
  // 設定標題列
  const headers = [
    'ID',
    '廠商原料號',
    '商品名稱',
    '商品描述',
    '分類',
    '是否啟用',
    '建立時間',
    '更新時間',
    '建立者',
    '更新者'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // 格式化標題列
  formatHeaderRow(sheet, headers.length);
  
  // 設定欄寬
  sheet.setColumnWidth(1, 60);   // ID
  sheet.setColumnWidth(2, 150);  // 廠商原料號
  sheet.setColumnWidth(3, 200);  // 商品名稱
  sheet.setColumnWidth(4, 300);  // 商品描述
  sheet.setColumnWidth(5, 100);  // 分類
  sheet.setColumnWidth(6, 80);   // 是否啟用
  sheet.setColumnWidth(7, 150);  // 建立時間
  sheet.setColumnWidth(8, 150);  // 更新時間
  
  // 凍結標題列
  sheet.setFrozenRows(1);
  
  Logger.log(`✓ 建立工作表: ${sheetName}`);
}

// ============================================
// 2. 平台料號映射
// ============================================
function createPlatformMappingSheet(ss) {
  const sheetName = CONFIG.SHEETS.PLATFORM_MAPPING;
  let sheet = ss.getSheetByName(sheetName);
  
  if (sheet) {
    Logger.log(`工作表 "${sheetName}" 已存在，跳過建立`);
    return;
  }
  
  sheet = ss.insertSheet(sheetName);
  
  const headers = [
    'ID',
    '廠商原料號',
    '平台',
    '平台料號',
    '格式規則說明',
    '是否上架',
    '建立時間',
    '更新時間'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatHeaderRow(sheet, headers.length);
  
  sheet.setColumnWidth(1, 60);
  sheet.setColumnWidth(2, 150);
  sheet.setColumnWidth(3, 100);
  sheet.setColumnWidth(4, 200);
  sheet.setColumnWidth(5, 250);
  sheet.setColumnWidth(6, 80);
  sheet.setColumnWidth(7, 150);
  sheet.setColumnWidth(8, 150);
  
  sheet.setFrozenRows(1);
  
  // 插入範例資料
  const sampleData = [
    [1, 'ABC-12345', 'YAHOO', 'ABC-12345-黑色', '供應商料號 + 賣場配件名稱', 'TRUE', new Date(), new Date()],
    [2, 'ABC-12345', 'MOMO', 'ABC-12345-手機殼/L', '商品原廠編號 + 單品詳細 (/ 後為尺寸名稱)', 'TRUE', new Date(), new Date()],
    [3, 'ABC-12345', 'PCHOME', 'ABC-12345-保護套/M', '廠商料號 + 規格名稱 (/ 後為尺寸名稱)', 'TRUE', new Date(), new Date()]
  ];
  
  sheet.getRange(2, 1, sampleData.length, sampleData[0].length).setValues(sampleData);
  
  Logger.log(`✓ 建立工作表: ${sheetName}`);
}

// ============================================
// 3. 主庫存(YAHOO)
// ============================================
function createInventoryMasterSheet(ss) {
  const sheetName = CONFIG.SHEETS.INVENTORY_MASTER;
  let sheet = ss.getSheetByName(sheetName);
  
  if (sheet) {
    Logger.log(`工作表 "${sheetName}" 已存在，跳過建立`);
    return;
  }
  
  sheet = ss.insertSheet(sheetName);
  
  const headers = [
    'ID',
    '廠商原料號',
    '庫存數量',
    '保留數量(已下單未出貨)',
    '可用庫存',
    '最後更新時間',
    '同步狀態',
    '最後同步時間',
    '版本號'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatHeaderRow(sheet, headers.length);
  
  sheet.setColumnWidth(1, 60);
  sheet.setColumnWidth(2, 150);
  sheet.setColumnWidth(3, 100);
  sheet.setColumnWidth(4, 150);
  sheet.setColumnWidth(5, 100);
  sheet.setColumnWidth(6, 150);
  sheet.setColumnWidth(7, 100);
  sheet.setColumnWidth(8, 150);
  sheet.setColumnWidth(9, 80);
  
  sheet.setFrozenRows(1);
  
  // 插入範例資料
  const sampleData = [
    [1, 'ABC-12345', 150, 0, '=C2-D2', new Date(), 'synced', new Date(), 1]
  ];
  
  sheet.getRange(2, 1, sampleData.length, sampleData[0].length).setValues(sampleData);
  
  // 設定條件格式 - 庫存 ≤ 2 時標紅
  const inventoryRange = sheet.getRange('C2:C1000');
  const rule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThanOrEqualTo(CONFIG.SAFETY_STOCK_THRESHOLD)
    .setBackground('#f4c7c3')
    .setFontColor('#cc0000')
    .setRanges([inventoryRange])
    .build();
  
  const rules = sheet.getConditionalFormatRules();
  rules.push(rule);
  sheet.setConditionalFormatRules(rules);
  
  Logger.log(`✓ 建立工作表: ${sheetName}`);
}

// ============================================
// 4. 同步庫存記錄
// ============================================
function createInventorySyncSheet(ss) {
  const sheetName = CONFIG.SHEETS.INVENTORY_SYNC;
  let sheet = ss.getSheetByName(sheetName);
  
  if (sheet) {
    Logger.log(`工作表 "${sheetName}" 已存在，跳過建立`);
    return;
  }
  
  sheet = ss.insertSheet(sheetName);
  
  const headers = [
    'ID',
    '廠商原料號',
    '平台',
    '庫存數量',
    '是否上架',
    '最後同步時間',
    '同步來源'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatHeaderRow(sheet, headers.length);
  
  sheet.setColumnWidth(1, 60);
  sheet.setColumnWidth(2, 150);
  sheet.setColumnWidth(3, 100);
  sheet.setColumnWidth(4, 100);
  sheet.setColumnWidth(5, 80);
  sheet.setColumnWidth(6, 150);
  sheet.setColumnWidth(7, 100);
  
  sheet.setFrozenRows(1);
  
  // 插入範例資料
  const sampleData = [
    [1, 'ABC-12345', 'MOMO', 150, 'TRUE', new Date(), 'auto'],
    [2, 'ABC-12345', 'PCHOME', 150, 'TRUE', new Date(), 'auto']
  ];
  
  sheet.getRange(2, 1, sampleData.length, sampleData[0].length).setValues(sampleData);
  
  Logger.log(`✓ 建立工作表: ${sheetName}`);
}

// ============================================
// 5. 訂單記錄
// ============================================
function createOrdersSheet(ss) {
  const sheetName = CONFIG.SHEETS.ORDERS;
  let sheet = ss.getSheetByName(sheetName);
  
  if (sheet) {
    Logger.log(`工作表 "${sheetName}" 已存在，跳過建立`);
    return;
  }
  
  sheet = ss.insertSheet(sheetName);
  
  const headers = [
    'ID',
    '訂單編號',
    '平台',
    '廠商原料號',
    '平台料號',
    '數量',
    '訂單狀態',
    '客戶姓名',
    '訂單金額',
    '建立時間',
    '更新時間',
    '出貨時間',
    '取消時間',
    '取消原因',
    '同步狀態'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatHeaderRow(sheet, headers.length);
  
  sheet.setColumnWidth(1, 60);
  sheet.setColumnWidth(2, 150);
  sheet.setColumnWidth(3, 100);
  sheet.setColumnWidth(4, 150);
  sheet.setColumnWidth(5, 200);
  sheet.setColumnWidth(6, 80);
  sheet.setColumnWidth(7, 100);
  sheet.setColumnWidth(8, 120);
  sheet.setColumnWidth(9, 100);
  
  sheet.setFrozenRows(1);
  
  Logger.log(`✓ 建立工作表: ${sheetName}`);
}

// ============================================
// 6. 同步日誌
// ============================================
function createSyncLogsSheet(ss) {
  const sheetName = CONFIG.SHEETS.SYNC_LOGS;
  let sheet = ss.getSheetByName(sheetName);
  
  if (sheet) {
    Logger.log(`工作表 "${sheetName}" 已存在，跳過建立`);
    return;
  }
  
  sheet = ss.insertSheet(sheetName);
  
  const headers = [
    'ID',
    '日誌ID',
    '時間戳記',
    '操作類型',
    '平台',
    '廠商原料號',
    '平台料號',
    '訂單編號',
    '數量變動',
    '變動前數量',
    '變動後數量',
    '執行結果',
    '錯誤代碼',
    '錯誤訊息',
    '是否觸發同步',
    '影響的平台',
    '執行時間(ms)',
    '操作者',
    '備註'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatHeaderRow(sheet, headers.length);
  
  sheet.setColumnWidth(1, 60);
  sheet.setColumnWidth(2, 150);
  sheet.setColumnWidth(3, 150);
  sheet.setColumnWidth(4, 100);
  sheet.setColumnWidth(5, 100);
  sheet.setColumnWidth(6, 150);
  sheet.setColumnWidth(13, 200);
  sheet.setColumnWidth(14, 200);
  sheet.setColumnWidth(19, 300);
  
  sheet.setFrozenRows(1);
  
  Logger.log(`✓ 建立工作表: ${sheetName}`);
}

// ============================================
// 7. 庫存警示
// ============================================
function createAlertsSheet(ss) {
  const sheetName = CONFIG.SHEETS.ALERTS;
  let sheet = ss.getSheetByName(sheetName);
  
  if (sheet) {
    Logger.log(`工作表 "${sheetName}" 已存在，跳過建立`);
    return;
  }
  
  sheet = ss.insertSheet(sheetName);
  
  const headers = [
    'ID',
    '警示ID',
    '警示類型',
    '嚴重程度',
    '廠商原料號',
    '平台',
    '當前庫存',
    '閾值',
    '警示訊息',
    '已採取動作',
    '建立時間',
    '是否已確認',
    '確認時間',
    '確認者',
    '是否已解決',
    '解決時間'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatHeaderRow(sheet, headers.length);
  
  sheet.setColumnWidth(1, 60);
  sheet.setColumnWidth(2, 150);
  sheet.setColumnWidth(3, 100);
  sheet.setColumnWidth(4, 100);
  sheet.setColumnWidth(5, 150);
  sheet.setColumnWidth(6, 100);
  sheet.setColumnWidth(9, 300);
  sheet.setColumnWidth(10, 200);
  
  sheet.setFrozenRows(1);
  
  Logger.log(`✓ 建立工作表: ${sheetName}`);
}

// ============================================
// 8. 系統設定
// ============================================
function createSystemConfigSheet(ss) {
  const sheetName = CONFIG.SHEETS.SYSTEM_CONFIG;
  let sheet = ss.getSheetByName(sheetName);
  
  if (sheet) {
    Logger.log(`工作表 "${sheetName}" 已存在，跳過建立`);
    return;
  }
  
  sheet = ss.insertSheet(sheetName);
  
  const headers = [
    'ID',
    '設定鍵',
    '設定值',
    '設定類型',
    '說明',
    '是否可編輯',
    '更新時間',
    '更新者'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatHeaderRow(sheet, headers.length);
  
  sheet.setColumnWidth(1, 60);
  sheet.setColumnWidth(2, 200);
  sheet.setColumnWidth(3, 150);
  sheet.setColumnWidth(4, 100);
  sheet.setColumnWidth(5, 300);
  sheet.setColumnWidth(6, 100);
  sheet.setColumnWidth(7, 150);
  
  sheet.setFrozenRows(1);
  
  Logger.log(`✓ 建立工作表: ${sheetName}`);
}

// ============================================
// 插入預設系統設定
// ============================================
function insertDefaultConfig(ss) {
  const sheet = ss.getSheetByName(CONFIG.SHEETS.SYSTEM_CONFIG);
  
  const configs = [
    [1, 'safety_stock_threshold', '2', 'integer', '安全庫存閾值(≤此值時MOMO和PChome下架)', 'TRUE', new Date(), 'SYSTEM'],
    [2, 'sync_interval_minutes', '1', 'integer', '庫存同步間隔(分鐘)', 'TRUE', new Date(), 'SYSTEM'],
    [3, 'enable_auto_sync', 'true', 'boolean', '啟用自動同步', 'TRUE', new Date(), 'SYSTEM'],
    [4, 'enable_safety_stock_rule', 'true', 'boolean', '啟用安全庫存規則', 'TRUE', new Date(), 'SYSTEM'],
    [5, 'notification_email', CONFIG.NOTIFICATION_EMAIL, 'string', 'Email通知地址', 'TRUE', new Date(), 'SYSTEM'],
    [6, 'enable_email_notification', 'true', 'boolean', '啟用Email通知', 'TRUE', new Date(), 'SYSTEM'],
    [7, 'yahoo_api_key', '', 'string', 'YAHOO API金鑰', 'TRUE', new Date(), 'SYSTEM'],
    [8, 'momo_api_key', '', 'string', 'MOMO API金鑰', 'TRUE', new Date(), 'SYSTEM'],
    [9, 'pchome_api_key', '', 'string', 'PChome API金鑰', 'TRUE', new Date(), 'SYSTEM'],
    [10, 'log_retention_days', '90', 'integer', '日誌保留天數', 'TRUE', new Date(), 'SYSTEM']
  ];
  
  sheet.getRange(2, 1, configs.length, configs[0].length).setValues(configs);
  
  Logger.log('✓ 插入預設系統設定');
}

// ============================================
// 設定觸發器
// ============================================
function setupTriggers() {
  // 刪除現有觸發器
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  // 建立每分鐘執行的觸發器 (庫存同步)
  ScriptApp.newTrigger('checkInventoryChanges')
    .timeBased()
    .everyMinutes(1)
    .create();
  
  // 建立每5分鐘執行的觸發器 (訂單同步)
  ScriptApp.newTrigger('syncOrders')
    .timeBased()
    .everyMinutes(5)
    .create();
  
  // 建立每10分鐘執行的觸發器 (安全庫存檢查)
  ScriptApp.newTrigger('checkSafetyStock')
    .timeBased()
    .everyMinutes(10)
    .create();
  
  Logger.log('✓ 設定自動觸發器');
}

// ============================================
// 設定資料驗證
// ============================================
function setupDataValidation(ss) {
  // 平台料號映射 - 平台欄位驗證
  const mappingSheet = ss.getSheetByName(CONFIG.SHEETS.PLATFORM_MAPPING);
  const platformRange = mappingSheet.getRange('C2:C1000');
  const platformRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['YAHOO', 'MOMO', 'PCHOME'], true)
    .setAllowInvalid(false)
    .build();
  platformRange.setDataValidation(platformRule);
  
  // 訂單記錄 - 訂單狀態驗證
  const ordersSheet = ss.getSheetByName(CONFIG.SHEETS.ORDERS);
  const statusRange = ordersSheet.getRange('G2:G1000');
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['pending', 'processing', 'shipped', 'cancelled', 'returned'], true)
    .setAllowInvalid(false)
    .build();
  statusRange.setDataValidation(statusRule);
  
  Logger.log('✓ 設定資料驗證規則');
}

// ============================================
// 格式化標題列
// ============================================
function formatHeaderRow(sheet, columnCount) {
  const headerRange = sheet.getRange(1, 1, 1, columnCount);
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  headerRange.setVerticalAlignment('middle');
}

// ============================================
// 核心業務邏輯函數
// ============================================

/**
 * 檢查庫存變動並同步 (優化版 - 只同步有變動的商品)
 */
function checkInventoryChanges() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName(CONFIG.SHEETS.INVENTORY_MASTER);
  
  const data = masterSheet.getDataRange().getValues();
  const headers = data[0];
  
  // 找到欄位索引
  const vendorCodeCol = headers.indexOf('廠商原料號');
  const quantityCol = headers.indexOf('庫存數量');
  const lastUpdatedCol = headers.indexOf('最後更新時間');
  const versionCol = headers.indexOf('版本號');
  
  let changedCount = 0;
  let skippedCount = 0;
  
  // 取得上次檢查時間
  const lastCheckTime = getLastCheckTime();
  
  // 跳過標題列
  for (let i = 1; i < data.length; i++) {
    const vendorCode = data[i][vendorCodeCol];
    const quantity = data[i][quantityCol];
    const lastUpdated = data[i][lastUpdatedCol];
    const version = data[i][versionCol];
    
    if (!vendorCode) continue;
    
    // 檢查是否有變動
    const hasChanged = checkIfInventoryChanged(vendorCode, quantity, lastUpdated, lastCheckTime, version);
    
    if (hasChanged) {
      // 只同步有變動的商品
      syncInventoryToPlatforms(vendorCode, quantity);
      changedCount++;
    } else {
      skippedCount++;
    }
  }
  
  // 更新最後檢查時間
  setLastCheckTime(new Date());
  
  // 記錄效能日誌
  Logger.log(`庫存檢查完成: 已同步 ${changedCount} 件, 跳過 ${skippedCount} 件`);
  
  // 如果有變動,發送摘要通知
  if (changedCount > 0) {
    sendBatchSyncNotification(changedCount, skippedCount);
  }
}

// ============================================
// API 服務接口 (供本地網頁呼叫)
// ============================================

/**
 * 處理 GET 請求
 */
function doGet(e) {
  return handleApiRequest(e);
}

/**
 * 處理 POST 請求
 */
function doPost(e) {
  return handleApiRequest(e);
}

/**
 * 統一處理 API 請求
 */
function handleApiRequest(e) {
  // 鎖定權限: 這裡可以加入簡單的 token 驗證
  // if (e.parameter.token !== 'YOUR_SECRET_TOKEN') return ...

  var action = e.parameter.action;
  var result = {};
  
  try {
    if (action === 'getInventory') {
      // 查詢庫存: ?action=getInventory&code=ABC-12345
      var vendorCode = e.parameter.code;
      result = getInventoryData(vendorCode);
      
    } else if (action === 'syncInventory') {
      // 觸發同步: ?action=syncInventory
      checkInventoryChanges();
      result = { status: 'success', message: '已觸發庫存同步檢查' };
      
    } else if (action === 'updateInventory') {
      // 更新庫存: ?action=updateInventory&code=ABC-12345&qty=50
      // 建議使用 POST
      var vendorCode = e.parameter.code;
      var qty = parseInt(e.parameter.qty);
      result = updateInventoryData(vendorCode, qty);
      
    } else {
      result = { status: 'error', message: '未知動作: ' + action };
    }
  } catch (error) {
    result = { status: 'error', message: error.toString() };
  }
  
  // 回傳 JSON 格式
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * API 輔助: 取得庫存資料
 */
function getInventoryData(code) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.INVENTORY_MASTER);
  const data = sheet.getDataRange().getValues();
  
  // 搜尋廠商原料號 (假設在第2欄)
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] == code) {
      return {
        status: 'success',
        data: {
          code: data[i][1],
          quantity: data[i][2],
          available: data[i][4],
          lastUpdated: data[i][5]
        }
      };
    }
  }
  return { status: 'error', message: '找不到商品: ' + code };
}

/**
 * API 輔助: 更新庫存資料
 */
function updateInventoryData(code, qty) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.INVENTORY_MASTER);
  const data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] == code) {
      // 更新庫存數量 (第3欄)
      sheet.getRange(i + 1, 3).setValue(qty);
      // 更新時間
      sheet.getRange(i + 1, 6).setValue(new Date());
      
      // 觸發同步
      checkInventoryChanges();
      
      return {
        status: 'success',
        message: '庫存已更新為 ' + qty,
        data: { code: code, newQuantity: qty }
      };
    }
  }
  return { status: 'error', message: '找不到商品: ' + code };
}

/**
 * 檢查商品庫存是否有變動
 */
function checkIfInventoryChanged(vendorCode, currentQuantity, lastUpdated, lastCheckTime, version) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const syncSheet = ss.getSheetByName(CONFIG.SHEETS.INVENTORY_SYNC);
  
  // 方法 1: 使用最後更新時間比對
  if (lastUpdated && lastCheckTime) {
    const updatedTime = new Date(lastUpdated);
    if (updatedTime <= lastCheckTime) {
      return false; // 沒有更新,跳過
    }
  }
  
  // 方法 2: 使用版本號比對
  const lastSyncedVersion = getLastSyncedVersion(vendorCode);
  if (version && lastSyncedVersion && version === lastSyncedVersion) {
    return false; // 版本號相同,跳過
  }
  
  // 方法 3: 比對實際庫存數量
  const lastSyncedQuantity = getLastSyncedQuantity(vendorCode);
  if (lastSyncedQuantity !== null && lastSyncedQuantity === currentQuantity) {
    return false; // 庫存數量沒變,跳過
  }
  
  return true; // 有變動,需要同步
}

/**
 * 取得上次檢查時間
 */
function getLastCheckTime() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName(CONFIG.SHEETS.SYSTEM_CONFIG);
  const data = configSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === 'last_check_time') {
      return data[i][2] ? new Date(data[i][2]) : null;
    }
  }
  
  return null;
}

/**
 * 設定最後檢查時間
 */
function setLastCheckTime(time) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName(CONFIG.SHEETS.SYSTEM_CONFIG);
  const data = configSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === 'last_check_time') {
      configSheet.getRange(i + 1, 3).setValue(time);
      return;
    }
  }
  
  // 如果不存在,新增一行
  const newRow = [
    data.length,
    'last_check_time',
    time,
    'datetime',
    '最後檢查時間',
    'FALSE',
    new Date(),
    'SYSTEM'
  ];
  configSheet.appendRow(newRow);
}

/**
 * 取得最後同步的版本號
 */
function getLastSyncedVersion(vendorCode) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const syncSheet = ss.getSheetByName(CONFIG.SHEETS.INVENTORY_SYNC);
  const data = syncSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === vendorCode && data[i][2] === 'YAHOO') {
      return data[i][7]; // 假設版本號在第8欄
    }
  }
  
  return null;
}

/**
 * 取得最後同步的庫存數量
 */
function getLastSyncedQuantity(vendorCode) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const syncSheet = ss.getSheetByName(CONFIG.SHEETS.INVENTORY_SYNC);
  const data = syncSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === vendorCode && data[i][2] === 'MOMO') {
      return data[i][3]; // 庫存數量
    }
  }
  
  return null;
}

/**
 * 發送批次同步通知 (摘要版)
 */
function sendBatchSyncNotification(changedCount, skippedCount) {
  const subject = `📦 【批次同步完成】已更新 ${changedCount} 件商品`;
  const body = `
批次庫存同步完成

已同步商品: ${changedCount} 件
跳過商品: ${skippedCount} 件 (無變動)
總商品數: ${changedCount + skippedCount} 件

效能提升: 跳過 ${Math.round(skippedCount / (changedCount + skippedCount) * 100)}% 的商品

時間: ${Utilities.formatDate(new Date(), 'GMT+8', 'yyyy-MM-dd HH:mm:ss')}

💡 提示: 系統只同步有變動的商品,大幅提升處理速度。
  `;
  
  // 只在有較多變動時才發送通知,避免過多 Email
  if (changedCount >= 5) {
    sendEmail(CONFIG.NOTIFICATION_EMAIL, subject, body);
  }
}

/**
 * 同步庫存到各平台
 */
function syncInventoryToPlatforms(vendorCode, yahooQuantity) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const syncSheet = ss.getSheetByName(CONFIG.SHEETS.INVENTORY_SYNC);
  const threshold = CONFIG.SAFETY_STOCK_THRESHOLD;
  
  let momoQuantity, pchomeQuantity, momoListed, pchomeListed;
  
  // 安全庫存規則: ≤2 時兩個平台都下架
  if (yahooQuantity <= threshold) {
    momoQuantity = 0;
    pchomeQuantity = 0;
    momoListed = false;
    pchomeListed = false;
    
    // 發送警示 Email
    sendLowStockAlert(vendorCode, yahooQuantity);
    
    // 記錄警示
    logAlert(vendorCode, yahooQuantity, 'MOMO和PChome已自動下架');
  } else {
    // 庫存 > 2 時，恢復實際庫存
    momoQuantity = yahooQuantity;
    pchomeQuantity = yahooQuantity;
    momoListed = true;
    pchomeListed = true;
  }
  
  // 更新同步記錄
  updateSyncRecord(vendorCode, 'MOMO', momoQuantity, momoListed);
  updateSyncRecord(vendorCode, 'PCHOME', pchomeQuantity, pchomeListed);
  
  // 記錄同步日誌
  logSync(vendorCode, 'YAHOO', yahooQuantity, '自動同步', 'success');
  
  // 發送庫存異動通知
  sendInventoryChangeNotification(vendorCode, yahooQuantity);
}

/**
 * 更新同步記錄
 */
function updateSyncRecord(vendorCode, platform, quantity, isListed) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.INVENTORY_SYNC);
  const data = sheet.getDataRange().getValues();
  
  let found = false;
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === vendorCode && data[i][2] === platform) {
      // 更新現有記錄
      sheet.getRange(i + 1, 4).setValue(quantity);
      sheet.getRange(i + 1, 5).setValue(isListed);
      sheet.getRange(i + 1, 6).setValue(new Date());
      found = true;
      break;
    }
  }
  
  if (!found) {
    // 新增記錄
    const newRow = [
      data.length,
      vendorCode,
      platform,
      quantity,
      isListed,
      new Date(),
      'auto'
    ];
    sheet.appendRow(newRow);
  }
}

/**
 * 記錄同步日誌
 */
function logSync(vendorCode, platform, quantity, actionType, status) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.SYNC_LOGS);
  
  const logId = `LOG-${Utilities.formatDate(new Date(), 'GMT+8', 'yyyyMMddHHmmss')}`;
  
  const newRow = [
    sheet.getLastRow(),
    logId,
    new Date(),
    actionType,
    platform,
    vendorCode,
    '',  // 平台料號
    '',  // 訂單編號
    0,   // 數量變動
    0,   // 變動前數量
    quantity,  // 變動後數量
    status,
    '',  // 錯誤代碼
    '',  // 錯誤訊息
    true,  // 是否觸發同步
    'MOMO,PCHOME',  // 影響的平台
    0,   // 執行時間
    'SYSTEM',
    `庫存同步: ${quantity}件`
  ];
  
  sheet.appendRow(newRow);
}

/**
 * 記錄警示
 */
function logAlert(vendorCode, quantity, action) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.ALERTS);
  
  const alertId = `ALERT-${Utilities.formatDate(new Date(), 'GMT+8', 'yyyyMMddHHmmss')}`;
  
  const newRow = [
    sheet.getLastRow(),
    alertId,
    'safety_stock',
    'warning',
    vendorCode,
    'ALL',
    quantity,
    CONFIG.SAFETY_STOCK_THRESHOLD,
    `庫存≤${CONFIG.SAFETY_STOCK_THRESHOLD}，已觸發安全庫存規則`,
    action,
    new Date(),
    false,  // 是否已確認
    '',     // 確認時間
    '',     // 確認者
    false,  // 是否已解決
    ''      // 解決時間
  ];
  
  sheet.appendRow(newRow);
}

/**
 * 發送低庫存警示 Email
 */
function sendLowStockAlert(vendorCode, quantity) {
  const subject = `⚠️ 【庫存警示】${vendorCode} 庫存不足`;
  const body = `
庫存警示通知

廠商原料號: ${vendorCode}
當前庫存: ${quantity} 件
安全閾值: ${CONFIG.SAFETY_STOCK_THRESHOLD} 件

⚠️ 已自動執行以下動作:
- MOMO 平台: 已下架，庫存設為 0
- PChome 平台: 已下架，庫存設為 0

請盡快補貨！當庫存 > ${CONFIG.SAFETY_STOCK_THRESHOLD} 時，系統將自動恢復上架。

時間: ${Utilities.formatDate(new Date(), 'GMT+8', 'yyyy-MM-dd HH:mm:ss')}
  `;
  
  sendEmail(CONFIG.NOTIFICATION_EMAIL, subject, body);
}

/**
 * 發送庫存異動通知
 */
function sendInventoryChangeNotification(vendorCode, quantity) {
  const subject = `📦 【庫存異動】${vendorCode} 庫存更新`;
  const body = `
庫存異動通知

廠商原料號: ${vendorCode}
當前庫存: ${quantity} 件

同步狀態:
- YAHOO: ${quantity} 件 (主庫存)
- MOMO: ${quantity <= CONFIG.SAFETY_STOCK_THRESHOLD ? '0 件 (已下架)' : quantity + ' 件'}
- PChome: ${quantity <= CONFIG.SAFETY_STOCK_THRESHOLD ? '0 件 (已下架)' : quantity + ' 件'}

時間: ${Utilities.formatDate(new Date(), 'GMT+8', 'yyyy-MM-dd HH:mm:ss')}
  `;
  
  sendEmail(CONFIG.NOTIFICATION_EMAIL, subject, body);
}

/**
 * 發送 Email
 */
function sendEmail(to, subject, body) {
  try {
    MailApp.sendEmail({
      to: to,
      subject: subject,
      body: body
    });
    Logger.log(`✓ Email 已發送: ${subject}`);
  } catch (e) {
    Logger.log(`✗ Email 發送失敗: ${e.message}`);
  }
}

/**
 * 訂單同步 (需要實作平台 API 整合)
 */
function syncOrders() {
  Logger.log('執行訂單同步...');
  // TODO: 實作 YAHOO, MOMO, PChome 訂單 API 整合
}

/**
 * 安全庫存檢查
 */
function checkSafetyStock() {
  Logger.log('執行安全庫存檢查...');
  checkInventoryChanges();
}

// ============================================
// 手動觸發函數 (可從選單執行)
// ============================================

/**
 * 建立自訂選單
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📦 庫存管理系統')
    .addItem('🔄 手動同步庫存', 'manualSync')
    .addItem('⚠️ 檢查安全庫存', 'checkSafetyStock')
    .addItem('📧 測試 Email 通知', 'testEmail')
    .addItem('📊 查看系統狀態', 'showSystemStatus')
    .addSeparator()
    .addItem('⚙️ 重新設置資料庫', 'setup')
    .addToUi();
}

/**
 * 手動同步
 */
function manualSync() {
  checkInventoryChanges();
  SpreadsheetApp.getUi().alert('✅ 手動同步完成！');
}

/**
 * 測試 Email
 */
function testEmail() {
  sendEmail(
    CONFIG.NOTIFICATION_EMAIL,
    '📧 測試 Email 通知',
    '這是一封測試郵件，確認 Email 通知功能正常運作。\n\n時間: ' + new Date()
  );
  SpreadsheetApp.getUi().alert('✅ 測試 Email 已發送！\n請檢查您的信箱: ' + CONFIG.NOTIFICATION_EMAIL);
}

/**
 * 顯示系統狀態
 */
function showSystemStatus() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName(CONFIG.SHEETS.INVENTORY_MASTER);
  const alertSheet = ss.getSheetByName(CONFIG.SHEETS.ALERTS);
  
  const productCount = masterSheet.getLastRow() - 1;
  const alertCount = alertSheet.getLastRow() - 1;
  
  const message = `
📊 系統狀態報告

商品總數: ${productCount}
未解決警示: ${alertCount}
安全庫存閾值: ${CONFIG.SAFETY_STOCK_THRESHOLD}
同步間隔: ${CONFIG.SYNC_INTERVAL_MINUTES} 分鐘
通知 Email: ${CONFIG.NOTIFICATION_EMAIL}

最後檢查時間: ${new Date()}
  `;
  
  SpreadsheetApp.getUi().alert(message);
}
