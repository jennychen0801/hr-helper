<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/66060131-86a1-4ef5-9a81-bc53aa9285ae

## 本地端運行 (Run Locally)

**環境需求 (Prerequisites):** Node.js

1. 安裝專案相依套件：
   ```bash
   npm install
   ```
2. 設定環境變數：請將 API Key 設定於 `.env.local` 檔案中 (`GEMINI_API_KEY`)
3. 啟動專案：
   ```bash
   npm run dev
   ```


## 自動部署 (Deployment)

專案已內建 GitHub Actions 腳本：

- 當程式碼推送 (Push) 到 `main` 分支時，將會自動觸發部署流程。
- 專案將會被打包並部署至 **GitHub Pages**。
- 請確認您的 GitHub Repository > Settings > Pages，將 Build and deployment 裡的 Source 設為 `GitHub Actions`。
