# 專案原則與 Yahoo API 整合

## 1. 專案原則
基於客戶提案，系統設計遵循以下原則：

### 核心架構
- **資料庫**: Google Sheets (雲端版，0 元成本)。
- **自動化**: Google Apps Script。
- **同步頻率**: 每 1 分鐘。
- **同步邏輯**: 僅同步庫存有變動的商品 (智能同步)。

### 庫存管理規則
- **安全庫存**: 
  - 若庫存 <= 2: 自動將 MOMO 和 PChome 下架。
  - YAHOO 保持上架 (作為主要/安全通路)。
- **訂單處理**:
  - 訂單成立時，立即扣除所有平台的庫存。
  - 訂單取消時，立即回補所有平台的庫存。

### 通知
- **管道**: Email。
- **觸發條件**:
  - 低庫存 (<= 2)。
  - 同步錯誤。
  - 自動下架事件。
  - 訂單扣除/回補。

## 2. Yahoo 購物 API (庫存相關)

### 概覽
- **API 類型**: Yahoo! Shopping SCM API (庫存 API)。
- **驗證方式**: OAuth 2.0 (需要 Client ID/Secret)。
- **基礎 URL**: `https://circus.shopping.yahooapis.jp/ShoppingWebService/V1/`

### 端點 (Endpoints)

#### 1. 更新庫存 (setRealStock)
- **用途**: 更新特定商品的庫存數量。
- **方法**: POST
- **URL**: `https://circus.shopping.yahooapis.jp/ShoppingWebService/V1/setRealStock`
- **主要參數**:
  - `seller_id`: 商店帳號 ID。
  - `item_code`: 商品料號。
  - `quantity`: 新的庫存數量。
- **備註**: 這是 1 分鐘同步和安全庫存調整的主要端點。

#### 2. 查詢庫存 (getRealStock)
- **用途**: 取得目前庫存數量以驗證同步狀態。
- **方法**: GET (可能，待 PDF 確認)
- **URL**: `https://circus.shopping.yahooapis.jp/ShoppingWebService/V1/getRealStock` (推測)
- **用途**: 用於「首次同步」(第 9-10 天) 抓取初始資料。

### 整合注意事項
- **頻率限制 (Rate Limits)**:
  - **限制**: 每秒 5 次請求 (5 rps)，每日 50,000 次請求 (每 Client ID)。
  - **可行性分析**: 
    - 1 分鐘同步 = 每天 1,440 次檢查週期。
    - 只要遵循「智能同步」(僅更新變動商品)，每日 API 使用量將遠低於 50,000 次上限。
    - 若單次變動商品過多 (例如 > 300 件)，需分批處理以避免超過 5 rps 限制。
- **錯誤處理**: 必須優雅地處理 API 超時或「系統錯誤」回應。

## 3. PChome 購物 API (庫存相關)

### 概覽
- **API 類型**: PChome 廠商後台 API (轉單/寄倉)。
- **文件來源**: `pchome_39173` 資料夾中的 `轉單_寄倉廠商共用_商品API_v3.2_20220830.doc`。
- **驗證方式**: 
  - 需要 `Vendor ID` (廠商代號)。
  - 需要 `Encrypt Key` 和 `Encrypt IV` 進行加密簽章。
  - 通常涉及 AES 加密。

### 端點 (Endpoints)

#### 1. 更新庫存 (Update Stock)
- **用途**: 同步庫存數量。
- **URL**: `https://ecvdr.pchome.com.tw/vdr/prod/v3.2/index.php`
- **方法**: POST
- **請求格式**: 
  - 通常為 `application/x-www-form-urlencoded` 或 `multipart/form-data`。
  - 需指定 `Action` 或 `Method` (例如 `UpdateStock`，需從文件確認)。
- **關鍵參數**:
  - `VendorID`: 廠商代號。
  - `Items`: 商品陣列 (包含料號與數量)。
  - `Auth`: 加密簽章 (AES-128-CBC)。

### 整合注意事項
- **文件格式**: 目前文件為 `.doc` (Binary)，已提取出基礎 URL。
- **加密機制**: PChome 的加密機制較複雜 (AES-128-CBC)，需特別注意實作正確性。
- **頻率限制**: 需查閱文件確認，但通常建議批次更新以節省請求次數。

## 4. MOMO 購物 API (庫存相關)

### 概覽
- **API 類型**: MOMO SCM API (供應商管理系統)。
- **文件來源**: 
  - `MOMO API文件/API文件/商品串接/商品異動/SCM_商品異動API規格文件_V2.6.docx`
  - `MOMO API文件/API文件/寄倉相關/F11xx_寄倉報表/SCM_庫存查詢API_V2.6.docx`
- **驗證方式**: 
  - 需透過 MOMO 供應商後台申請 API 串接權限。
  - 需設定 API 串接 IP 位址 (後台路徑: 供應商 > 【H1112】API串接IP位置管理)。
  - 使用 API Token 或供應商主帳號 + OTP 進行驗證。

### 端點 (Endpoints)

#### 1. 商品異動 API (Product Changes)
- **用途**: 更新商品庫存、價格、上下架狀態。
- **文件**: `SCM_商品異動API規格文件_V2.6.docx`
- **支援功能**:
  - 商品上架 (Listing)
  - 商品下架 (Delisting)
  - 商品價格異動 (Price Update)
  - **商品庫存量異動 (Inventory Update)** ← 核心功能
- **URL**: 需從供應商後台取得或參考文件。
- **方法**: POST (通常)
- **關鍵參數** (推測,需確認文件):
  - `VendorID` 或 `SupplierID`: 供應商編號。
  - `ProductID` 或 `ItemCode`: 商品料號。
  - `Stock` 或 `Quantity`: 庫存數量。
  - `Token` 或 `Auth`: API Token。

#### 2. 庫存查詢 API (Inventory Query)
- **用途**: 查詢目前庫存狀態,用於驗證同步結果。
- **文件**: `SCM_庫存查詢API_V2.6.docx`
- **URL**: 需從供應商後台取得或參考文件。
- **方法**: GET 或 POST
- **用途場景**: 首次同步時抓取初始庫存資料。

### 整合注意事項
- **文件格式**: 文件為 `.docx` 格式,XML 解析失敗,需使用 Word 開啟以取得詳細規格。
- **申請流程**: 
  1. 登入 MOMO 供應商後台。
  2. 前往「供應商 > 【H1112】API串接IP位置管理」申請權限。
  3. 取得 API Token 或憑證。
- **平台版本**: MOMO 有「mo店+」(momo 3.0) 新版平台,API 可能有差異,需確認使用版本。
- **頻率限制**: 需查閱文件確認,但建議批次更新以節省請求次數。
- **安全庫存機制**: 根據提案,當庫存 ≤ 2 時,MOMO 需自動下架 (透過「商品下架」API)。

### 庫存同步邏輯 (基於提案)
根據客戶提案,MOMO 的庫存同步邏輯如下:

1. **主動同步** (每 1 分鐘):
   - 從 YAHOO API 讀取庫存變動。
   - 若庫存 > 2: 使用「商品異動 API」更新 MOMO 庫存。
   - 若庫存 ≤ 2: 使用「商品異動 API」將 MOMO 商品下架。

2. **訂單處理**:
   - MOMO 訂單成立: 扣除 YAHOO/MOMO/PChome 三平台庫存。
   - MOMO 訂單取消: 回補 YAHOO/MOMO/PChome 三平台庫存。

3. **補貨恢復**:
   - 當庫存從 ≤ 2 補貨至 > 2 時,使用「商品異動 API」將 MOMO 商品重新上架並更新庫存。
