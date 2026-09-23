/* ============================================================
   QRForge Pro – Live Camera Scanner + Image Decoder
   ============================================================ */

'use strict';

const Scanner = {
  stream:        null,
  scanning:      false,
  facingMode:    'environment',
  _frameTimer:   null,
  _jsQRLoaded:   false,

  // ── Load jsQR dynamically ──
  async _loadJsQR() {
    if (window.jsQR) { this._jsQRLoaded = true; return; }
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
      s.onload  = () => { this._jsQRLoaded = true; resolve(); };
      s.onerror = () => reject(new Error('jsQR failed to load'));
      document.head.appendChild(s);
    });
  },

  // ── Start Camera ──
  async startCamera() {
    try {
      await this._loadJsQR();
    } catch {
      App.toast('⚠️', 'jsQR library unavailable – image scan still works', 'warn');
    }

    if (this.stream) this.stopCamera();

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: this.facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      const video = document.getElementById('scanner-video');
      video.srcObject = this.stream;
      video.classList.add('active');
      const ov = document.getElementById('scanner-overlay');
      if (ov) { ov.classList.remove('hidden'); ov.style.display = 'block'; }
      this.scanning = true;
      video.play();
      this._scanLoop(video);
      App.toast('📷', 'Camera started – point at a QR code', 'success');
      document.getElementById('btn-start-cam')?.classList.add('hidden');
      document.getElementById('btn-stop-cam')?.classList.remove('hidden');
    } catch (e) {
      App.toast('❌', 'Camera access denied. Enable permissions.', 'error');
    }
  },

  // ── Stop Camera ──
  stopCamera() {
    this.scanning = false;
    clearTimeout(this._frameTimer);
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    const video = document.getElementById('scanner-video');
    if (video) { video.srcObject = null; video.classList.remove('active'); }
    document.getElementById('scanner-idle')?.classList.remove('hidden');
    const ov = document.getElementById('scanner-overlay');
    if (ov) { ov.classList.add('hidden'); ov.style.display = 'none'; }
    document.getElementById('btn-start-cam')?.classList.remove('hidden');
    document.getElementById('btn-stop-cam')?.classList.add('hidden');
  },

  // ── Switch Camera (Front ↔ Back) ──
  async switchCamera() {
    this.facingMode = this.facingMode === 'environment' ? 'user' : 'environment';
    if (this.stream) await this.startCamera();
  },

  // ── Torch Toggle ──
  async toggleTorch() {
    if (!this.stream) return;
    const track = this.stream.getVideoTracks()[0];
    if (!track?.getCapabilities().torch) {
      App.toast('⚠️', 'Torch not available on this device', 'warn'); return;
    }
    const settings = track.getSettings();
    await track.applyConstraints({ advanced: [{ torch: !settings.torch }] });
    App.toast(settings.torch ? '🔦' : '💡', `Torch ${settings.torch ? 'off' : 'on'}`, 'info');
  },

  // ── Scan Loop ──
  _scanLoop(video) {
    if (!this.scanning || !this._jsQRLoaded) return;

    const canvas = document.createElement('canvas');
    const ctx    = canvas.getContext('2d');

    const loop = () => {
      if (!this.scanning) return;

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = window.jsQR?.(imgData.data, imgData.width, imgData.height, {
          inversionAttempts: 'dontInvert'
        });

        if (code?.data) {
          this._onDecoded(code.data, null);
          // Short pause after successful scan
          this.scanning = false;
          setTimeout(() => { this.scanning = true; this._scanLoop(video); }, 3000);
          return;
        }
      }

      this._frameTimer = setTimeout(loop, 150);
    };

    loop();
  },

  // ── Scan from Uploaded Image ──
  async scanFromImage(input) {
    const file = input.files?.[0];
    if (!file) return;

    try {
      await this._loadJsQR();
    } catch {
      App.toast('⚠️', 'jsQR not loaded', 'warn'); return;
    }

    App.toast('🔍', 'Analyzing image…', 'info');

    const img = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width  = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const code = window.jsQR?.(imgData.data, imgData.width, imgData.height, {
      inversionAttempts: 'attemptBoth'
    });

    if (code?.data) {
      this._onDecoded(code.data, null);
    } else {
      App.toast('❌', 'No QR code found in image', 'error');
    }

    input.value = '';
  },

  // ── On Decode: Display & Save Result ──
  async _onDecoded(raw, type) {
    let displayText = raw;
    let isEncrypted = false;

    // Check if encrypted
    if (CryptoEngine.isEncrypted(raw)) {
      isEncrypted = true;
      const payload = CryptoEngine.extractPayload(raw);
      this._showPasswordGate(payload);
      return;
    }

    // Play beep
    this._beep();

    // Save to history
    const entry = {
      text: raw,
      type: type || this._detectType(raw),
      time: new Date().toLocaleTimeString(),
      date: new Date().toLocaleDateString(),
    };
    App.state.scanHistory.unshift(entry);
    App.persist('scanHistory');

    // Show result
    this._showResult(entry);
    this._renderScanHistory();
    Analytics.load();
  },

  // ── Detect QR type from data ──
  _detectType(text) {
    if (text.startsWith('http'))        return 'Website URL';
    if (text.startsWith('tel:'))        return 'Phone Number';
    if (text.startsWith('mailto:'))     return 'Email';
    if (text.startsWith('sms:'))        return 'SMS';
    if (text.startsWith('WIFI:'))       return 'Wi-Fi Network';
    if (text.startsWith('BEGIN:VCARD')) return 'Contact (vCard)';
    if (text.startsWith('geo:'))        return 'GPS Location';
    if (text.startsWith('upi://'))      return 'UPI Payment';
    if (text.startsWith('BEGIN:VEVENT'))return 'Calendar Event';
    if (text.startsWith('bitcoin:'))    return 'Bitcoin';
    if (text.startsWith('ethereum:'))   return 'Ethereum';
    if (text.startsWith('qrpro://enc'))return '🔒 Encrypted';
    return 'Plain Text';
  },

  // ── Show Result Panel ──
  _showResult(entry) {
    const panel = document.getElementById('scan-result-panel');
    if (!panel) return;
    panel.classList.remove('hidden');

    document.getElementById('scan-result-type').textContent  = entry.type;
    document.getElementById('scan-result-text').textContent  = entry.text;
    document.getElementById('scan-result-time').textContent  = `${entry.date} at ${entry.time}`;

    // Action buttons
    const actions = document.getElementById('scan-result-actions');
    if (!actions) return;
    actions.innerHTML = '';

    const text = entry.text;

    // Copy button always
    actions.innerHTML += `<button class="btn btn-outline btn-sm" onclick="navigator.clipboard.writeText('${text.replace(/'/g,"\\'")}').then(()=>App.toast('📋','Copied!','success'))">📋 Copy</button>`;

    if (text.startsWith('http')) {
      actions.innerHTML += `<a href="${text}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">🌐 Open URL</a>`;
    }
    if (text.startsWith('tel:')) {
      actions.innerHTML += `<a href="${text}" class="btn btn-teal btn-sm">📞 Call</a>`;
    }
    if (text.startsWith('mailto:')) {
      actions.innerHTML += `<a href="${text}" class="btn btn-teal btn-sm">📧 Send Email</a>`;
    }
    if (text.startsWith('WIFI:')) {
      actions.innerHTML += `<button class="btn btn-teal btn-sm" onclick="App.toast('📶','Open Wi-Fi settings to connect','info')">📶 Connect Wi-Fi</button>`;
    }
    if (text.startsWith('BEGIN:VCARD')) {
      const blob = new Blob([text], { type: 'text/vcard' });
      const url  = URL.createObjectURL(blob);
      actions.innerHTML += `<a href="${url}" download="contact.vcf" class="btn btn-teal btn-sm">👤 Save Contact</a>`;
    }
    if (text.startsWith('geo:')) {
      const coords = text.replace('geo:', '').split(',');
      const mapUrl = `https://maps.google.com/?q=${coords[0]},${coords[1]}`;
      actions.innerHTML += `<a href="${mapUrl}" target="_blank" class="btn btn-teal btn-sm">🗺️ Open Maps</a>`;
    }
    if (text.startsWith('upi://')) {
      actions.innerHTML += `<button class="btn btn-teal btn-sm" onclick="App.toast('💳','Open your UPI app to pay','info')">💳 Pay</button>`;
    }
  },

  // ── Password Gate for Encrypted QR ──
  _showPasswordGate(payload) {
    const modal = document.getElementById('pw-gate-modal');
    if (!modal) return;
    modal.classList.add('show');
    modal.style.display = 'flex';
    modal._payload = payload;
  },

  async unlockEncrypted() {
    const modal = document.getElementById('pw-gate-modal');
    const input = document.getElementById('pw-gate-input');
    const error = document.getElementById('pw-gate-error');
    if (!modal || !input) return;

    const pw = input.value;
    if (!pw) { input.classList.add('error'); return; }

    const btn = document.getElementById('pw-gate-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Decrypting…'; }

    try {
      const decrypted = await CryptoEngine.decrypt(modal._payload, pw);
      modal.classList.remove('show');
      modal.style.display = 'none';
      input.value = '';
      if (error) error.textContent = '';
      this._onDecoded(decrypted, null);
      QREngine._fireConfetti();
    } catch {
      input.classList.add('error');
      if (error) error.textContent = '❌ Wrong password. Try again.';
      setTimeout(() => input.classList.remove('error'), 600);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Unlock Content'; }
    }
  },

  // ── Render Scan History ──
  _renderScanHistory() {
    const list = document.getElementById('scan-history-list');
    if (!list) return;
    const items = App.state.scanHistory.slice(0, 10);
    if (!items.length) {
      list.innerHTML = '<div class="text-muted text-sm" style="text-align:center;padding:1rem">No scans yet</div>';
      return;
    }
    list.innerHTML = items.map(s => `
      <div class="qr-card" onclick="navigator.clipboard.writeText('${s.text.replace(/'/g,"\\'")}').then(()=>App.toast('📋','Copied!','success'))">
        <div class="qr-card-thumb">${Scanner._typeIcon(s.type)}</div>
        <div class="qr-card-info">
          <div class="qr-card-name truncate" style="max-width:280px">${s.text}</div>
          <div class="qr-card-url">${s.type} · ${s.time}</div>
        </div>
      </div>`).join('');
  },

  _typeIcon(type) {
    const m = {
      'Website URL':'🌐','Phone Number':'📞','Email':'📧','SMS':'💬',
      'Wi-Fi Network':'📶','Contact (vCard)':'👤','GPS Location':'📍',
      'UPI Payment':'💳','Calendar Event':'📅','Bitcoin':'₿','Ethereum':'Ξ',
      '🔒 Encrypted':'🔒','Plain Text':'📝'
    };
    return m[type] || '📄';
  },

  // ── Beep sound on scan ──
  _beep() {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain= ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 1200;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  },
};
