# QRForge Pro - Advanced QR and Barcode Studio

A browser-based QR and barcode platform built with **HTML5, CSS3, and modern JavaScript**, with an optional Node.js backend for persistent file sharing.

QRForge Pro is designed for creating, customizing, scanning, securing, and exporting QR codes and barcodes from one workspace. It supports browser-only use as well as a server-backed mode for persistent file sharing.

## Why This Project

This project brings together QR generation, visual customization, secure payloads, scanning, bulk workflows, and export tools in a single practical application. It is also a portfolio project demonstrating frontend UI development, browser APIs, client-side cryptography, backend integration, and responsive product design.

---

## ✨ Features Overview

### 1. 🎨 Advanced QR Customization Engine
- **Body & Dot Shapes**: 6 patterns (`Square`, `Dots`, `Rounded`, `Classy`, `Classy-Rounded`, `Extra-Rounded`).
- **Corner Eye Customization**:
  - Independent corner outer eye shapes (`Square`, `Rounded`, `Circle`).
  - Independent corner inner eye shapes (`Square`, `Dot`, `Rounded`).
  - Custom color controls for outer frame and inner center dot.
- **Gradients & Colors**:
  - Solid color fill.
  - Linear Gradient with 0° - 360° angle picker.
  - Radial Gradient with focal positioning.
  - Background color with alpha transparency support.
- **Logo & Watermark Studio**:
  - Custom logo upload (PNG, JPG, SVG, WebP).
  - 15+ built-in instant brand icons (Google, Apple, WhatsApp, Wi-Fi, GitHub, Twitter/X, Instagram, YouTube, LinkedIn, Spotify, Bitcoin, Ethereum, Telegram, UPI, etc.).
  - Automatic error correction level boosting (bumped to Level H ~30% recovery) and clean background clearance behind logos.
- **Branded Marketing Frames (Call-to-Action)**:
  - 8 frame styles including *"SCAN ME"*, *"SCAN TO PAY"*, *"CONNECT TO WIFI"*, *"FOLLOW US"*, Polaroid badge, Rounded capsule, and top banner.
  - Fully customizable text, font, text color, and frame background color.
- **1-Click Designer Themes**:
  - Cyberpunk Neon, Apple Obsidian, Solar Gold, Emerald Fintech, Arctic Frost, Pastel Sunset, Minimalist Monochrome.

---

### 2. 📱 16+ Smart QR & Barcode Content Types
| Type | Description |
|------|-------------|
| 🌐 **Website URL** | Clean URL encoding with preview. |
| 🌳 **Bio-Tree / Multi-Link** | Mobile-optimized landing page with links & social handles. |
| 📶 **Wi-Fi Network** | Direct scan-to-connect (WPA/WPA2/WEP/Open, hidden network). |
| 📇 **vCard 3.0** | Comprehensive contact card (Name, Phone, Email, Company, Title, Address, URL). |
| 💳 **UPI & Payments** | Unified Payments Interface format (VPA, Payee, Amount, Note). |
| ₿ **Cryptocurrency** | Bitcoin (`bitcoin:`), Ethereum (`ethereum:`), Solana, USDT, Polygon. |
| 📅 **Event (iCal)** | Calendar event with start/end timestamps, location, and description. |
| ✉️ **Email** | Pre-composed email with recipient, subject, and body. |
| 📞 **Phone Call** | Direct `tel:` phone dialing. |
| 💬 **SMS Message** | Pre-filled SMS recipient and text message. |
| 📍 **Location** | GPS coordinates & Google Maps search pin. |
| 👥 **Social Profiles** | Quick links for Instagram, YouTube, Twitter/X, LinkedIn, TikTok, WhatsApp, Telegram, Discord, GitHub. |
| 📱 **App Store** | Smart link routing to Apple App Store or Google Play Store. |
| 🎵 **Audio / Voice** | Direct link or embed for podcast/audio stream. |
| 📄 **Document / PDF** | Direct download link for documents. |
| 📝 **Plain Text / Secret** | Multi-line text notes. |
| ▦ **1D Barcode Suite** | Code 128, EAN-13, UPC-A, Code 39, ITF-14. |

---

### 3. 🔒 Military-Grade Client-Side Security (AES-256)
- **AES-GCM (256-bit) + PBKDF2** encryption implemented via the native browser `window.crypto.subtle` API.
- 100,000 PBKDF2 iterations with unique salt per encryption.
- Encrypted payloads are safe to transmit over QR codes.
- Scan and decrypt directly inside the built-in scanner with password prompt.

---

### 4. 📷 Real-Time Live Scanner & File Decoder
- **Live Camera Scanner**: Real-time camera viewfinder with camera switching (Rear / Front) and flash/torch support.
- **Image Scanner**: Drag-and-drop or select any image/screenshot to instantly decode QR codes and barcodes.
- **Context Actions**:
  - One-click Open URL
  - Copy to clipboard
  - Save vCard to contacts (.vcf)
  - Connect to Wi-Fi
  - Unlock AES-256 password-protected codes
- **Scan History**: Filterable, searchable scan log with CSV / JSON export.

---

### 5. 📦 Bulk Generator & Multi-Page Print Sheets
- Input comma-separated data or paste lists up to 200 items.
- CSV file upload support.
- Simultaneous batch rendering.
- **Export as ZIP**: Downloads all generated codes inside a neatly structured ZIP archive.
- **Print Sheet Generator**: Configurable grid (columns × rows) formatted for A4/Letter label sticker printing.

---

### 6. 📊 Real-Time Analytics Dashboard
- Total scans counter and dynamic link tracker.
- Device breakdown (iOS, Android, Windows, macOS, Linux).
- Activity charts and scan trends.
- Scan history management.

---

### 7. 💾 Multi-Format High-Resolution Export
- **PNG**: 1x (300px), 2x (600px), 4x (1200px), Ultra HD (2400px / 300 DPI print quality).
- **SVG**: Pure vector format for lossless scaling and graphic design.
- **WebP & JPEG**: Optimized for web distribution.
- **Copy to Clipboard**: Instant PNG image copy for rapid pasting into Figma, Slack, Word, Photoshop, etc.

---

## 📁 Project Architecture

```
qr-studio-pro/
├── index.html              # Main single-page application shell
├── css/
│   ├── main.css            # CSS variables, typography, resets, core layout
│   ├── components.css      # UI components (cards, buttons, inputs, modals, tabs)
│   └── animations.css      # Keyframes, glow effects, micro-interactions, print media
├── js/
│   ├── templates.js        # 16 QR types data models, form builders & formatters
│   ├── presets.js          # Designer themes, icon SVG library, CTA marketing frames
│   ├── crypto.js           # Web Crypto AES-256-GCM encryption & 1D Barcode engine
│   ├── qr-engine.js        # Canvas drawing engine (dots, eyes, gradients, logos, frames)
│   ├── scanner.js          # Camera stream decoder, image drop reader, history manager
│   ├── bulk.js             # CSV parser, batch rendering, JSZip export & Analytics
│   └── app.js              # State manager, theme toggle, nav router, auth modals
├── server.js               # Node.js API for persistent file uploads and downloads
├── package.json             # Backend scripts and dependencies
└── README.md               # Complete documentation and usage guide
```

---

## 🚀 How to Run

### Full web application with file sharing

Install Node.js 18 or newer, then run:

```bash
cd qr-studio-pro
npm install
npm start
```

Open `http://localhost:8080/`. The backend stores uploaded files in `storage/uploads` and enforces a maximum file size of **500 MB**.

For QR file links that must open on a phone over the same Wi-Fi, start the server with your computer's LAN address:

```powershell
$env:PUBLIC_URL="http://192.168.1.10:8080"
npm start
```

Replace `192.168.1.10` with the computer's IPv4 address from `ipconfig`. Do not use `localhost` in a QR code intended for another device.

### Static browser-only mode

The QR generator can still be opened directly without Node.js, but persistent file sharing requires the backend mode above.

### Free phone/PWA mode

Serve the project from a local or hosted HTTP/HTTPS URL to enable the installable phone app shell and offline caching. Directly opening `index.html` still supports browser-only QR generation, but browsers do not allow service workers or backend APIs from `file://` pages.

```bash
# Windows PowerShell
Start-Process "c:\Users\Mummy\Downloads\smart-qr-code-main\qr-studio-pro\index.html"
```

Or serve with any static web server:
```bash
# Optional: using python
cd qr-studio-pro
python -m http.server 8080

# Optional: using npx serve
npx serve .
```

---

## ⌨️ Keyboard Shortcuts
- `Ctrl + Enter` / `Cmd + Enter`: Generate / Refresh QR code
- `Esc`: Close open modal / dialog
