# ScanForge Studio (Smart QR Platform)

ScanForge Studio is a browser-based QR code and barcode platform for creating, customizing, scanning, securing, and exporting codes from one workspace.

It combines a responsive frontend with an optional Node.js backend for file sharing, authentication, and persistent application data.

## Highlights

- Custom QR styling with shapes, colors, gradients, logos, themes, and branded frames
- 16+ content formats including URLs, Wi-Fi, vCards, payments, events, social profiles, locations, and documents
- 1D barcode generation for Code 128, EAN-13, UPC-A, Code 39, and ITF-14
- AES-GCM encrypted QR payloads with PBKDF2 key derivation
- Live camera scanning and image-based QR or barcode decoding
- Searchable scan history with CSV and JSON export
- Bulk generation, ZIP export, and printable label sheets
- PNG, SVG, WebP, and JPEG export options
- Installable PWA support for browser-based use
- Optional server-backed file sharing with a 500 MB upload limit

## Tech Stack

| Area | Technologies |
| --- | --- |
| Frontend | HTML5, CSS3, Vanilla JavaScript, Canvas API |
| Security | Web Crypto API, AES-GCM, PBKDF2 |
| Backend | Node.js, Express.js |
| Data | SQLite, better-sqlite3 |
| Authentication | Express sessions, bcryptjs |
| File handling | Multer |

## Project Structure

```text
qrforge-pro/
├── qr-studio-pro/
│   ├── index.html
│   ├── css/              # Application styles and animations
│   ├── js/               # QR engine, scanner, crypto, bulk tools, and app logic
│   ├── assets/           # Static application assets
│   ├── server.js         # Optional Node.js backend
│   ├── manifest.webmanifest
│   └── README.md         # Detailed application documentation
├── package.json          # Workspace scripts
└── README.md
```

## Requirements

- Node.js 18 or newer
- npm
- A modern browser
- Camera access for live scanning

## Run Locally

From the repository root:

```bash
npm run install:app
npm start
```

Open [http://localhost:8080](http://localhost:8080) in a browser.

The application can also run in browser-only mode by serving `qr-studio-pro` with any static web server. Browser-only mode supports local QR generation, while persistent file sharing and authentication require the Node.js server.

## Network Access

To create file links that work from another device on the same network, set the public address before starting the server:

```powershell
$env:PUBLIC_URL="http://YOUR-LAN-IP:8080"
npm start
```

Replace `YOUR-LAN-IP` with the computer's local IPv4 address. Do not use `localhost` for links opened on a phone or another computer.

## Security Notes

- Runtime databases, uploaded files, dependencies, and local configuration are excluded from version control.
- Set a strong `SESSION_SECRET` in production.
- Use HTTPS when deploying outside a trusted local network.
- Client-side encryption protects QR payload content, but passwords must still be handled securely.

## Documentation

See the detailed [QRForge Pro application README](qr-studio-pro/README.md) for the complete feature list, architecture notes, keyboard shortcuts, and deployment options.

## License

No license has been added yet. Add a license before accepting external contributions or redistributing the project.