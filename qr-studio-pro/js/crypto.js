/* ============================================================
   QRForge Pro – AES-256-GCM Client-Side Encryption (Web Crypto)
   ============================================================ */

'use strict';

const CryptoEngine = {
  // ── Derive Key from Password ──
  async _deriveKey(password, salt) {
    const enc     = new TextEncoder();
    const keyMat  = await crypto.subtle.importKey(
      'raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      {
        name:       'PBKDF2',
        salt:       salt,
        iterations: 250000,
        hash:       'SHA-256',
      },
      keyMat,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  },

  // ── Encode ArrayBuffer → Base64 ──
  _b64(buf) {
    return btoa(String.fromCharCode(...new Uint8Array(buf)));
  },

  // ── Decode Base64 → Uint8Array ──
  _unb64(str) {
    return Uint8Array.from(atob(str), c => c.charCodeAt(0));
  },

  // ── Encrypt plaintext with password ──
  // Returns: "<base64 salt>.<base64 iv>.<base64 ciphertext>"
  async encrypt(plaintext, password) {
    const enc   = new TextEncoder();
    const salt  = crypto.getRandomValues(new Uint8Array(16));
    const iv    = crypto.getRandomValues(new Uint8Array(12));
    const key   = await this._deriveKey(password, salt);

    const ct = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(plaintext)
    );

    return `${this._b64(salt)}.${this._b64(iv)}.${this._b64(ct)}`;
  },

  // ── Decrypt ciphertext with password ──
  // Throws on wrong password
  async decrypt(payload, password) {
    const parts = payload.split('.');
    if (parts.length !== 3) throw new Error('Invalid encrypted payload');

    const salt = this._unb64(parts[0]);
    const iv   = this._unb64(parts[1]);
    const ct   = this._unb64(parts[2]);
    const key  = await this._deriveKey(password, salt);

    const dec = new TextDecoder().decode(
      await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)
    );
    return dec;
  },

  // ── Check if a QR payload is encrypted ──
  isEncrypted(data) {
    return typeof data === 'string' && data.startsWith('qrpro://enc/v1/');
  },

  // ── Extract inner payload from encrypted QR ──
  extractPayload(data) {
    return data.replace('qrpro://enc/v1/', '');
  },
};


/* ============================================================
   QRForge Pro – 1D Barcode Generator Engine
   ============================================================ */

const BarcodeEngine = {
  // ── Code 128 character set ──
  CODE128_MAP: null,

  _initCode128() {
    if (this.CODE128_MAP) return;
    this.CODE128_MAP = {};
    const chars = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
    // Full Code 128 B encoding – simplified patterns for demo
    // A proper implementation would include checksum, start/stop codes
  },

  // ── Render barcode ──
  render(data, save = false) {
    const wrap = document.getElementById('qr-canvas-wrap');
    if (!wrap) return;

    const old = document.getElementById('qr-main-canvas');
    if (old) old.remove();
    document.getElementById('qr-placeholder')?.classList.add('hidden');

    const type  = (document.getElementById('f-bc-type')?.value || 'CODE128').toUpperCase();
    const fg    = document.getElementById('f-bc-fg')?.value || '#000000';
    const bg    = document.getElementById('f-bc-bg')?.value || '#ffffff';

    const canvas  = document.createElement('canvas');
    canvas.id     = 'qr-main-canvas';
    const canvasH = 140;
    canvas.width  = 320;
    canvas.height = canvasH + 40; // +40 for label
    canvas.style.display   = 'block';
    canvas.style.maxWidth  = '100%';
    wrap.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Generate bars
    const bars = this._encode(data, type);

    if (!bars) {
      ctx.fillStyle = '#f87171';
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Invalid barcode data', canvas.width / 2, 80);
      return;
    }

    const barW   = (canvas.width - 40) / bars.length;
    let x        = 20;

    bars.forEach(dark => {
      ctx.fillStyle = dark ? fg : bg;
      ctx.fillRect(Math.round(x), 20, Math.max(1, Math.ceil(barW)), canvasH - 20);
      x += barW;
    });

    // Label below bars
    ctx.fillStyle = '#333333';
    ctx.font      = `bold 14px JetBrains Mono, monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(data, canvas.width / 2, canvasH + 22);

    // Type label
    ctx.fillStyle = '#999999';
    ctx.font      = '10px Inter, sans-serif';
    ctx.fillText(type, canvas.width / 2, canvas.height - 6);

    canvas.classList.add('qr-reveal');
    QREngine.state.lastCanvas = canvas;

    if (save) {
      QREngine._saveToHistory(data);
      App.toast('✅', 'Barcode generated!', 'success');
    }
  },

  // ── Encode data to bar pattern (simplified) ──
  _encode(data, type) {
    switch (type) {
      case 'CODE128':  return this._code128(data);
      case 'CODE39':   return this._code39(data.toUpperCase());
      case 'EAN13':    return this._ean13(data);
      case 'UPCA':     return this._ean13(data.length === 11 ? '0' + data : data);
      case 'EAN8':     return this._ean8(data);
      case 'ITF14':    return this._itf(data);
      default:         return this._code128(data);
    }
  },

  // ── Code 128 (simplified, Code B subset) ──
  _code128(str) {
    // Code 128 B patterns (11 bars each), start=104, stop=106
    const patterns = {
      ' ':  [1,1,0,1,1,0,0,1,1,0,0],
      '!':  [1,0,0,1,1,0,1,1,0,1,1],
      '"':  [1,0,0,1,1,0,1,1,0,1,1],
      '0':  [1,1,0,1,1,0,0,1,0,0,0],
      '1':  [1,0,0,1,1,0,1,1,0,1,1],
      '2':  [1,1,0,0,1,0,1,1,0,1,1],
      '3':  [1,0,1,0,0,1,1,0,1,1,0],
      '4':  [1,1,0,1,0,0,1,1,0,1,1],
      '5':  [1,0,0,1,0,1,1,0,1,1,0],
      '6':  [1,0,0,1,0,1,0,1,1,0,0],
      '7':  [1,0,1,0,0,1,0,1,1,0,0],
      '8':  [1,0,0,1,0,0,1,0,1,1,0],
      '9':  [1,0,0,0,1,0,1,1,0,1,1],
      'A':  [1,0,1,0,0,1,1,0,0,1,0],
      'B':  [1,0,0,1,0,0,1,0,0,1,1],
      'C':  [1,1,0,0,1,0,0,1,0,0,1],
      'D':  [1,0,1,0,0,0,1,0,0,1,1],
      'E':  [1,0,0,1,0,0,0,1,0,0,1],
    };
    const fallback = [1,0,1,0,1,0,1,0,1,0,1];
    const start    = [1,1,0,1,0,0,0,1,1,0,1,0,0];
    const stop     = [1,1,0,0,0,1,0,1,0,0,0,1,1,1];
    const quiet    = [0,0,0,0,0,0,0,0,0,0];

    let bars = [...quiet, ...start];
    for (const ch of str) {
      bars = [...bars, ...(patterns[ch] || fallback)];
    }
    bars = [...bars, ...stop, ...quiet];
    return bars;
  },

  // ── Code 39 ──
  _code39(str) {
    const C39 = {
      '0':[1,0,1,0,0,1,1,0,1,1,0],'1':[1,1,0,1,0,0,1,0,1,0,1],
      '2':[1,0,0,1,1,0,1,0,1,0,1],'3':[1,1,0,1,1,0,1,0,1,0,0],
      '4':[1,0,1,0,0,1,1,0,1,0,0],'5':[1,1,0,1,0,0,1,1,0,1,0],
      '6':[1,0,0,1,0,1,1,0,1,0,0],'7':[1,0,1,0,1,0,0,1,1,0,0],
      '8':[1,1,0,1,0,1,0,0,1,1,0],'9':[1,0,0,1,1,0,0,1,1,0,1],
      'A':[1,1,0,1,0,0,1,0,0,1,0],'B':[1,0,0,1,1,0,0,1,0,1,0],
      'C':[1,1,0,1,1,0,0,1,0,0,0],'D':[1,0,1,0,0,0,1,0,0,1,0],
      'E':[1,1,0,1,0,0,0,1,0,0,0],'F':[1,0,0,1,0,0,0,1,0,1,0],
      'G':[1,0,1,0,0,1,0,0,0,1,0],'H':[1,1,0,1,0,1,0,0,0,1,0],
      'I':[1,0,0,0,1,0,1,0,0,1,0],'J':[1,0,0,0,0,1,0,0,1,1,0],
      'K':[1,1,0,1,0,0,1,0,1,0,0],'L':[1,0,0,1,1,0,1,0,0,0,0],
      'M':[1,1,0,1,1,0,1,0,0,0,0],'N':[1,0,1,0,0,0,0,1,0,1,0],
      'O':[1,1,0,1,0,0,0,0,1,0,0],'P':[1,0,0,0,1,0,0,0,1,1,0],
      'Q':[1,0,1,0,0,1,0,0,0,0,1],'R':[1,1,0,1,0,1,0,0,0,0,0],
      'S':[1,0,0,0,0,1,0,0,0,1,0],'T':[1,0,0,0,0,0,0,1,1,0,0],
      'U':[1,1,0,0,1,0,1,0,0,1,0],'V':[1,0,1,1,0,0,0,1,0,1,0],
      'W':[1,1,0,1,1,0,0,0,1,0,0],'X':[1,0,1,0,0,1,1,0,0,1,0],
      'Y':[1,1,0,1,0,1,1,0,0,0,0],'Z':[1,0,0,1,0,1,1,0,0,0,0],
      '-':[1,0,1,0,0,0,0,1,0,0,1],' ':[1,0,0,0,1,0,0,0,0,1,0],
      '*':[1,0,1,0,0,1,0,0,1,0,0], '+': [1,0,1,0,0,0,0,1,0,1,0],
    };
    const start = [1,0,1,0,0,1,0,0,1,0,0,0];
    const stop  = [1,0,1,0,0,1,0,0,1,0,0,0];
    const gap   = [0];
    let bars = [...start];
    for (const ch of str.toUpperCase()) {
      bars = [...bars, ...gap, ...(C39[ch] || C39[' '])];
    }
    return [...bars, ...gap, ...stop];
  },

  // ── EAN-13 ──
  _ean13(str) {
    const d = str.replace(/\D/g, '').slice(0, 12).padEnd(12, '0');
    // EAN-13 encoding (simplified visual representation)
    const LG = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
    const RG = ['1110010','1100110','1101100','1000010','1011100','1001110','1010000','1000100','1001000','1110100'];
    const FP = [1,1,1,0,1,0,1]; // first parity based on first digit
    let bars = [1,0,1]; // start
    for (let i = 0; i < 6; i++) bars = [...bars, ...LG[+d[i]].split('').map(Number)];
    bars = [...bars, 0,1,0,1,0]; // center guard
    for (let i = 6; i < 12; i++) bars = [...bars, ...RG[+d[i]].split('').map(Number)];
    bars = [...bars, 1,0,1]; // end
    return bars;
  },

  // ── EAN-8 ──
  _ean8(str) {
    const d = str.replace(/\D/g, '').slice(0, 7).padEnd(7, '0');
    const LG = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
    const RG = ['1110010','1100110','1101100','1000010','1011100','1001110','1010000','1000100','1001000','1110100'];
    let bars = [1,0,1];
    for (let i = 0; i < 4; i++) bars = [...bars, ...LG[+d[i]].split('').map(Number)];
    bars = [...bars, 0,1,0,1,0];
    for (let i = 4; i < 7; i++) bars = [...bars, ...RG[+d[i]].split('').map(Number)];
    return [...bars, 1,0,1];
  },

  // ── ITF-14 (Interleaved 2 of 5) ──
  _itf(str) {
    const d = str.replace(/\D/g, '').slice(0, 14).padEnd(14, '0');
    const narrow = 1, wide = 3;
    const ITF = [
      [narrow,narrow,wide,wide,narrow],[wide,narrow,narrow,narrow,wide],
      [narrow,wide,narrow,narrow,wide],[wide,wide,narrow,narrow,narrow],
      [narrow,narrow,wide,narrow,wide],[wide,narrow,wide,narrow,narrow],
      [narrow,wide,wide,narrow,narrow],[narrow,narrow,narrow,wide,wide],
      [wide,narrow,narrow,wide,narrow],[narrow,wide,narrow,wide,narrow],
    ];
    let bars = [1,1,0,1,1,0]; // start
    for (let i = 0; i < d.length; i += 2) {
      const a = ITF[+d[i]], b = ITF[+d[i+1]];
      for (let j = 0; j < 5; j++) {
        bars.push(...Array(a[j]).fill(1)); // bar
        bars.push(...Array(b[j]).fill(0)); // space
      }
    }
    return [...bars, 1,1,1,0,1]; // stop
  },
};
