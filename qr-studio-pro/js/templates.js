/* ============================================================
   QRForge Pro – Content Type Templates & QR Data Builders
   ============================================================ */

'use strict';

const QRTypes = {
  list: [
    { id: 'url',      icon: '🌐', label: 'Website',    group: 'Basic' },
    { id: 'text',     icon: '📝', label: 'Plain Text', group: 'Basic' },
    { id: 'biolink',  icon: '🪪', label: 'Bio Link',   group: 'Basic' },
    { id: 'email',    icon: '📧', label: 'Email',      group: 'Contact' },
    { id: 'phone',    icon: '📞', label: 'Phone',      group: 'Contact' },
    { id: 'sms',      icon: '💬', label: 'SMS',        group: 'Contact' },
    { id: 'vcard',    icon: '👤', label: 'vCard',      group: 'Contact' },
    { id: 'wifi',     icon: '📶', label: 'Wi-Fi',      group: 'Network' },
    { id: 'location', icon: '📍', label: 'Location',   group: 'Map' },
    { id: 'event',    icon: '📅', label: 'Event/Cal',  group: 'Utility' },
    { id: 'upi',      icon: '💳', label: 'UPI Pay',    group: 'Payment' },
    { id: 'crypto',   icon: '₿',  label: 'Crypto',     group: 'Payment' },
    { id: 'social',   icon: '🔗', label: 'Social',     group: 'Social' },
    { id: 'youtube',  icon: '▶️', label: 'YouTube',    group: 'Social' },
    { id: 'app',      icon: '📱', label: 'App Link',   group: 'App' },
    { id: 'file',     icon: '📎', label: 'File',       group: 'Media' },
    { id: 'barcode',  icon: '▦',  label: '1D Barcode', group: 'Basic' },
  ],

  forms: {
    url: () => `
      <div class="form-group">
        <label class="form-label">Website URL</label>
        <input class="form-input" id="f-url" type="url" value="https://qrforge.io" placeholder="https://yourwebsite.com" oninput="QREngine.livePreview()"/>
        <div class="input-hint">Include https:// for best compatibility</div>
      </div>`,

    text: () => `
      <div class="form-group">
        <label class="form-label">Text Content</label>
        <textarea class="form-input form-textarea" id="f-text" placeholder="Enter any text, secret message, or plain content..." oninput="QREngine.livePreview()"></textarea>
        <div class="input-hint">Max recommended: 500 characters</div>
      </div>`,

    biolink: () => `
      <div class="form-group">
        <label class="form-label">Display Name</label>
        <input class="form-input" id="f-bio-name" placeholder="Your Name / Brand" oninput="QREngine.livePreview()"/>
      </div>
      <div class="form-group">
        <label class="form-label">Bio / Tagline</label>
        <input class="form-input" id="f-bio-tagline" placeholder="Your short description..." oninput="QREngine.livePreview()"/>
      </div>
      <div id="bio-links-wrap">
        <label class="form-label">Links</label>
        <div id="bio-links-container">
          <div class="form-row" style="margin-bottom:8px">
            <input class="form-input" placeholder="Label (e.g. Website)" oninput="QREngine.livePreview()"/>
            <input class="form-input" placeholder="https://..." oninput="QREngine.livePreview()"/>
          </div>
        </div>
        <button class="btn btn-outline btn-sm mt-2" onclick="QRTemplates.addBioLink()">+ Add Link</button>
      </div>`,

    email: () => `
      <div class="form-group">
        <label class="form-label">To (Recipient)</label>
        <input class="form-input" id="f-email-to" type="email" placeholder="recipient@example.com" oninput="QREngine.livePreview()"/>
      </div>
      <div class="form-group">
        <label class="form-label">Subject</label>
        <input class="form-input" id="f-email-sub" placeholder="Email Subject" oninput="QREngine.livePreview()"/>
      </div>
      <div class="form-group">
        <label class="form-label">Body (optional)</label>
        <textarea class="form-input form-textarea" id="f-email-body" placeholder="Email body..." oninput="QREngine.livePreview()"></textarea>
      </div>`,

    phone: () => `
      <div class="form-group">
        <label class="form-label">Phone Number</label>
        <input class="form-input" id="f-phone" type="tel" placeholder="+91 98765 43210" oninput="QREngine.livePreview()"/>
        <div class="input-hint">Include country code for international</div>
      </div>`,

    sms: () => `
      <div class="form-group">
        <label class="form-label">Phone Number</label>
        <input class="form-input" id="f-sms-no" type="tel" placeholder="+91 98765 43210" oninput="QREngine.livePreview()"/>
      </div>
      <div class="form-group">
        <label class="form-label">Pre-filled Message</label>
        <textarea class="form-input form-textarea" id="f-sms-msg" placeholder="Your SMS message..." oninput="QREngine.livePreview()"></textarea>
      </div>`,

    vcard: () => `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">First Name</label>
          <input class="form-input" id="f-vc-fn" placeholder="John" oninput="QREngine.livePreview()"/>
        </div>
        <div class="form-group">
          <label class="form-label">Last Name</label>
          <input class="form-input" id="f-vc-ln" placeholder="Doe" oninput="QREngine.livePreview()"/>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Phone</label>
        <input class="form-input" id="f-vc-ph" placeholder="+91 98765 43210" oninput="QREngine.livePreview()"/>
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-input" id="f-vc-em" type="email" placeholder="john@example.com" oninput="QREngine.livePreview()"/>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Company</label>
          <input class="form-input" id="f-vc-org" placeholder="Company Inc." oninput="QREngine.livePreview()"/>
        </div>
        <div class="form-group">
          <label class="form-label">Job Title</label>
          <input class="form-input" id="f-vc-title" placeholder="Designer" oninput="QREngine.livePreview()"/>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Website</label>
        <input class="form-input" id="f-vc-web" placeholder="https://yourwebsite.com" oninput="QREngine.livePreview()"/>
      </div>
      <div class="form-group">
        <label class="form-label">Address</label>
        <input class="form-input" id="f-vc-addr" placeholder="123 Street, City, Country" oninput="QREngine.livePreview()"/>
      </div>`,

    wifi: () => `
      <div class="form-group">
        <label class="form-label">Network Name (SSID)</label>
        <input class="form-input" id="f-wifi-ssid" placeholder="MyHomeNetwork" oninput="QREngine.livePreview()"/>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Password</label>
          <input class="form-input" id="f-wifi-pass" type="password" placeholder="wifi_password" oninput="QREngine.livePreview()"/>
        </div>
        <div class="form-group">
          <label class="form-label">Security Type</label>
          <select class="form-input form-select" id="f-wifi-enc" onchange="QREngine.livePreview()">
            <option value="WPA">WPA / WPA2</option>
            <option value="WPA2-EAP">WPA2-Enterprise</option>
            <option value="WEP">WEP</option>
            <option value="nopass">Open (No Password)</option>
          </select>
        </div>
      </div>
      <div class="toggle-wrap">
        <div class="toggle-info">
          <div class="toggle-label">Hidden Network</div>
          <div class="toggle-desc">Enable if the SSID is not broadcast</div>
        </div>
        <label class="toggle">
          <input type="checkbox" id="f-wifi-hidden" onchange="QREngine.livePreview()"/>
          <span class="toggle-slider"></span>
        </label>
      </div>`,

    location: () => `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Latitude</label>
          <input class="form-input" id="f-lat" type="number" step="any" placeholder="28.6139" oninput="QREngine.livePreview()"/>
        </div>
        <div class="form-group">
          <label class="form-label">Longitude</label>
          <input class="form-input" id="f-lng" type="number" step="any" placeholder="77.2090" oninput="QREngine.livePreview()"/>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Location Label (optional)</label>
        <input class="form-input" id="f-loc-label" placeholder="New Delhi, India" oninput="QREngine.livePreview()"/>
      </div>
      <button class="btn btn-outline btn-sm" onclick="QRTemplates.useCurrentLocation()">📍 Use My Current Location</button>`,

    event: () => `
      <div class="form-group">
        <label class="form-label">Event Title</label>
        <input class="form-input" id="f-ev-title" placeholder="Team Meeting" oninput="QREngine.livePreview()"/>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Start Date & Time</label>
          <input class="form-input" id="f-ev-start" type="datetime-local" oninput="QREngine.livePreview()"/>
        </div>
        <div class="form-group">
          <label class="form-label">End Date & Time</label>
          <input class="form-input" id="f-ev-end" type="datetime-local" oninput="QREngine.livePreview()"/>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Location</label>
        <input class="form-input" id="f-ev-loc" placeholder="Conference Room / Online" oninput="QREngine.livePreview()"/>
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea class="form-input form-textarea" id="f-ev-desc" placeholder="Event details..." oninput="QREngine.livePreview()"></textarea>
      </div>`,

    upi: () => `
      <div class="form-group">
        <label class="form-label">UPI ID / VPA</label>
        <input class="form-input" id="f-upi-id" placeholder="yourname@upi" oninput="QREngine.livePreview()"/>
      </div>
      <div class="form-group">
        <label class="form-label">Payee Name</label>
        <input class="form-input" id="f-upi-name" placeholder="John Doe" oninput="QREngine.livePreview()"/>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Amount (₹)</label>
          <input class="form-input" id="f-upi-amt" type="number" step="0.01" min="0" placeholder="0.00" oninput="QREngine.livePreview()"/>
        </div>
        <div class="form-group">
          <label class="form-label">Transaction Note</label>
          <input class="form-input" id="f-upi-note" placeholder="Payment for..." oninput="QREngine.livePreview()"/>
        </div>
      </div>`,

    crypto: () => `
      <div class="form-group">
        <label class="form-label">Cryptocurrency</label>
        <select class="form-input form-select" id="f-crypto-type" onchange="QREngine.livePreview()">
          <option value="bitcoin">Bitcoin (BTC)</option>
          <option value="ethereum">Ethereum (ETH)</option>
          <option value="litecoin">Litecoin (LTC)</option>
          <option value="solana">Solana (SOL)</option>
          <option value="dogecoin">Dogecoin (DOGE)</option>
          <option value="usdt">USDT (Tether)</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Wallet Address</label>
        <input class="form-input" id="f-crypto-addr" placeholder="0x..." oninput="QREngine.livePreview()" style="font-family:var(--mono);font-size:0.82rem"/>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Amount (optional)</label>
          <input class="form-input" id="f-crypto-amt" type="number" step="any" placeholder="0.001" oninput="QREngine.livePreview()"/>
        </div>
        <div class="form-group">
          <label class="form-label">Label (optional)</label>
          <input class="form-input" id="f-crypto-label" placeholder="Payment" oninput="QREngine.livePreview()"/>
        </div>
      </div>`,

    social: () => `
      <div class="form-group">
        <label class="form-label">Platform</label>
        <select class="form-input form-select" id="f-soc-pl" onchange="QREngine.livePreview()">
          <option>Instagram</option>
          <option>TikTok</option>
          <option>YouTube</option>
          <option>Twitter / X</option>
          <option>LinkedIn</option>
          <option>Facebook</option>
          <option>WhatsApp</option>
          <option>Telegram</option>
          <option>Discord</option>
          <option>GitHub</option>
          <option>Pinterest</option>
          <option>Snapchat</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Profile URL or Username</label>
        <input class="form-input" id="f-soc-url" placeholder="https://instagram.com/yourhandle" oninput="QREngine.livePreview()"/>
      </div>`,

    youtube: () => `
      <div class="form-group">
        <label class="form-label">YouTube URL</label>
        <input class="form-input" id="f-yt" type="url" placeholder="https://youtu.be/dQw4w9WgXcQ" oninput="QREngine.livePreview()"/>
      </div>
      <div class="form-group">
        <label class="form-label">Start at (seconds, optional)</label>
        <input class="form-input" id="f-yt-start" type="number" min="0" placeholder="0" oninput="QREngine.livePreview()"/>
      </div>`,

    app: () => `
      <div class="form-group">
        <label class="form-label">App Name</label>
        <input class="form-input" id="f-app-name" placeholder="My Awesome App" oninput="QREngine.livePreview()"/>
      </div>
      <div class="form-group">
        <label class="form-label">Google Play Store URL</label>
        <input class="form-input" id="f-app-and" type="url" placeholder="https://play.google.com/store/apps/details?id=..." oninput="QREngine.livePreview()"/>
      </div>
      <div class="form-group">
        <label class="form-label">Apple App Store URL</label>
        <input class="form-input" id="f-app-ios" type="url" placeholder="https://apps.apple.com/app/..." oninput="QREngine.livePreview()"/>
      </div>`,

    file: () => {
      const savedCustom = localStorage.getItem('qrforge_custom_base_url') || '';
      return `
      <div class="form-group">
        <label class="form-label">Upload File (PDF, Image, Document, Video)</label>
        <div class="file-drop" id="file-drop-area" onclick="document.getElementById('f-file-input').click()"
             ondragover="event.preventDefault();this.classList.add('dragging')"
             ondragleave="this.classList.remove('dragging')"
             ondrop="QRTemplates.handleFileDrop(event)">
          <div style="font-size:2.5rem">📄</div>
          <div style="font-weight:600;color:var(--text2)">Click or drag file here</div>
          <div class="text-xs text-muted">Any file type — Up to 500 MB</div>
          <input type="file" id="f-file-input" style="display:none" onchange="QRTemplates.handleFileUpload(this)" accept="*/*"/>
        </div>

        <div id="file-info" style="display:${window._uploadedFileUrl ? 'flex' : 'none'};margin-top:12px;padding:12px;background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.25);border-radius:var(--r-sm);flex-direction:column;gap:10px">
          <div style="display:flex;align-items:center;gap:10px;width:100%">
            <span style="font-size:1.3rem">📎</span>
            <span id="file-name" style="flex:1;font-weight:600;word-break:break-all">${window._uploadedFileName || ''}</span>
            <button type="button" onclick="QRTemplates.clearFile()" class="btn btn-icon btn-sm" title="Remove file" style="color:var(--red)">✕</button>
          </div>
          
          <div id="file-url-container" style="display:${window._uploadedFileUrl ? 'block' : 'none'};width:100%">
            <label class="form-label" style="font-size:0.75rem;margin-bottom:4px;color:var(--text2)">QR Code Destination URL:</label>
            <div style="display:flex;gap:6px">
              <input class="form-input" id="file-url-input" readonly value="${window._uploadedFileUrl || ''}" style="font-family:var(--mono);font-size:0.78rem" />
              <button type="button" class="btn btn-sm btn-outline" onclick="QRTemplates.copyFileUrl()">📋 Copy</button>
              <a id="file-url-link" href="${window._uploadedFileUrl || '#'}" target="_blank" class="btn btn-sm btn-outline">↗ Test</a>
            </div>
          </div>
        </div>

        <!-- Network / Base URL Configuration -->
        <div style="margin-top:14px;padding:10px 12px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:var(--r-sm)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-size:0.8rem;font-weight:600;color:var(--text2)">📡 Sharing Host / Base URL</span>
            <span id="network-detection-badge" class="badge" style="font-size:0.7rem;background:rgba(59,130,246,0.15);color:var(--blue)">Detecting IP...</span>
          </div>
          <div style="display:flex;gap:6px">
            <input class="form-input" id="f-file-custom-host" placeholder="http://192.168.x.x:8080 or tunnel URL" value="${savedCustom}" style="font-family:var(--mono);font-size:0.8rem" />
            <button type="button" class="btn btn-sm btn-outline" onclick="QRTemplates.applyCustomHost()">Apply</button>
          </div>
          <div class="input-hint" style="margin-top:6px;font-size:0.75rem">
            Default uses your computer's local Wi-Fi IP. For mobile data / remote sharing, paste a tunnel link (e.g. localtunnel/ngrok).
          </div>
        </div>

        <!-- Phone Connection Helper & Troubleshooting -->
        <div style="margin-top:14px;padding:12px 14px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-radius:var(--r-sm);font-size:0.82rem">
          <div style="font-weight:600;color:#f59e0b;margin-bottom:8px;display:flex;align-items:center;gap:6px">
            <span>⚠️ Phone says "Service can't be reached"?</span>
          </div>
          <div style="color:var(--text2);line-height:1.5;display:flex;flex-direction:column;gap:6px">
            <div><strong>1. Same Wi-Fi Required:</strong> Phone must be connected to the <u>same Wi-Fi network</u> as this PC. <em>Turn off Mobile Data (4G/5G)</em> on your phone, as mobile data cannot reach local IP addresses.</div>
            <div><strong>2. Windows Network Profile:</strong> In Windows <em>Settings &gt; Network &amp; internet &gt; Wi-Fi</em>, set network type to <strong>Private network</strong> so Windows allows incoming phone connections.</div>
            <div><strong>3. Share across Mobile Data / Internet:</strong> Run <code>npx localtunnel --port 8080</code> in your PC terminal, copy the <code>https://...loca.lt</code> link into the Sharing Host box above, and click Apply.</div>
          </div>
        </div>
      </div>`;
    },

    barcode: () => `
      <div class="form-group">
        <label class="form-label">Barcode Type</label>
        <select class="form-input form-select" id="f-bc-type" onchange="QREngine.livePreview()">
          <option value="CODE128">Code 128 (Universal)</option>
          <option value="EAN13">EAN-13 (Retail)</option>
          <option value="UPCA">UPC-A (North America)</option>
          <option value="CODE39">Code 39</option>
          <option value="ITF14">ITF-14 (Shipping)</option>
          <option value="EAN8">EAN-8 (Small Retail)</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Barcode Data</label>
        <input class="form-input" id="f-bc-data" value="123456789012" placeholder="12345678" oninput="QREngine.livePreview()" style="font-family:var(--mono)"/>
        <div class="input-hint">EAN-13: exactly 13 digits. Code 128: any text.</div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Bar Color</label>
          <input class="form-input" id="f-bc-fg" type="color" value="#000000" oninput="QREngine.livePreview()" style="height:42px;padding:4px"/>
        </div>
        <div class="form-group">
          <label class="form-label">Background</label>
          <input class="form-input" id="f-bc-bg" type="color" value="#ffffff" oninput="QREngine.livePreview()" style="height:42px;padding:4px"/>
        </div>
      </div>`,
  },

  // ── QR Data Builders ──
  buildData(type) {
    const v = id => (document.getElementById(id)?.value || '').trim();
    const chk = id => document.getElementById(id)?.checked;

    switch (type) {
      case 'url':
        return v('f-url');

      case 'text':
        return v('f-text');

      case 'biolink': {
        const name = v('f-bio-name') || 'My Links';
        const tag  = v('f-bio-tagline') || '';
        const rows = document.querySelectorAll('#bio-links-container .form-row');
        const links = [];
        rows.forEach(row => {
          const ins = row.querySelectorAll('input');
          if (ins[1]?.value?.trim()) {
            links.push(`${ins[0]?.value?.trim() || 'Link'}: ${ins[1].value.trim()}`);
          }
        });
        return [name, tag, ...links].filter(Boolean).join('\n');
      }

      case 'email': {
        const to  = v('f-email-to');
        const sub = v('f-email-sub');
        const body= v('f-email-body');
        if (!to) return '';
        let s = `mailto:${to}`;
        const params = [];
        if (sub)  params.push(`subject=${encodeURIComponent(sub)}`);
        if (body) params.push(`body=${encodeURIComponent(body)}`);
        if (params.length) s += '?' + params.join('&');
        return s;
      }

      case 'phone':
        return v('f-phone') ? `tel:${v('f-phone')}` : '';

      case 'sms': {
        const no  = v('f-sms-no');
        const msg = v('f-sms-msg');
        if (!no) return '';
        return `sms:${no}${msg ? `?body=${encodeURIComponent(msg)}` : ''}`;
      }

      case 'vcard': {
        const fn = v('f-vc-fn'), ln = v('f-vc-ln');
        if (!fn && !ln) return '';
        return [
          'BEGIN:VCARD',
          'VERSION:3.0',
          `N:${ln};${fn}`,
          `FN:${fn} ${ln}`,
          v('f-vc-ph')    ? `TEL:${v('f-vc-ph')}` : '',
          v('f-vc-em')    ? `EMAIL:${v('f-vc-em')}` : '',
          v('f-vc-org')   ? `ORG:${v('f-vc-org')}` : '',
          v('f-vc-title') ? `TITLE:${v('f-vc-title')}` : '',
          v('f-vc-web')   ? `URL:${v('f-vc-web')}` : '',
          v('f-vc-addr')  ? `ADR:;;${v('f-vc-addr')};;;;` : '',
          'END:VCARD'
        ].filter(Boolean).join('\n');
      }

      case 'wifi': {
        const ssid = v('f-wifi-ssid');
        if (!ssid) return '';
        const enc  = v('f-wifi-enc') || 'WPA';
        const pass = v('f-wifi-pass');
        const hidden = chk('f-wifi-hidden') ? 'true' : 'false';
        return `WIFI:T:${enc};S:${ssid};P:${pass};H:${hidden};;`;
      }

      case 'location': {
        const lat = v('f-lat'), lng = v('f-lng');
        if (!lat || !lng) return '';
        const label = v('f-loc-label');
        return label ? `geo:${lat},${lng}?q=${encodeURIComponent(label)}` : `geo:${lat},${lng}`;
      }

      case 'event': {
        const title = v('f-ev-title');
        if (!title) return '';
        const fmt = (dt) => dt ? dt.replace(/[-:T]/g, '').slice(0,15) : '';
        return [
          'BEGIN:VEVENT',
          `SUMMARY:${title}`,
          `DTSTART:${fmt(v('f-ev-start'))}`,
          `DTEND:${fmt(v('f-ev-end'))}`,
          v('f-ev-loc')  ? `LOCATION:${v('f-ev-loc')}` : '',
          v('f-ev-desc') ? `DESCRIPTION:${v('f-ev-desc')}` : '',
          'END:VEVENT'
        ].filter(Boolean).join('\n');
      }

      case 'upi': {
        const id = v('f-upi-id');
        if (!id) return '';
        let s = `upi://pay?pa=${id}`;
        if (v('f-upi-name')) s += `&pn=${encodeURIComponent(v('f-upi-name'))}`;
        if (v('f-upi-amt'))  s += `&am=${v('f-upi-amt')}`;
        if (v('f-upi-note'))s += `&tn=${encodeURIComponent(v('f-upi-note'))}`;
        s += '&cu=INR';
        return s;
      }

      case 'crypto': {
        const addr = v('f-crypto-addr');
        if (!addr) return '';
        const type   = v('f-crypto-type') || 'bitcoin';
        const amt    = v('f-crypto-amt');
        const label  = v('f-crypto-label');
        let s = `${type}:${addr}`;
        const params = [];
        if (amt)   params.push(`amount=${amt}`);
        if (label) params.push(`label=${encodeURIComponent(label)}`);
        if (params.length) s += '?' + params.join('&');
        return s;
      }

      case 'social':
        return v('f-soc-url') || v('f-soc-pl');

      case 'youtube': {
        const url   = v('f-yt');
        const start = v('f-yt-start');
        if (!url) return '';
        if (start && parseInt(start) > 0) {
          return url + (url.includes('?') ? '&' : '?') + `t=${start}`;
        }
        return url;
      }

      case 'app':
        return v('f-app-and') || v('f-app-ios') || '';

      case 'file':
        return window._uploadedFileUrl || '';

      case 'barcode':
        return v('f-bc-data');

      default:
        return '';
    }
  },

  // ── Helper: Add Bio Link Row ──
  addBioLink() {
    const c = document.getElementById('bio-links-container');
    const row = document.createElement('div');
    row.className = 'form-row';
    row.style.marginBottom = '8px';
    row.innerHTML = `
      <input class="form-input" placeholder="Label" oninput="QREngine.livePreview()"/>
      <input class="form-input" placeholder="https://..." oninput="QREngine.livePreview()"/>
    `;
    c.appendChild(row);
  },

  // ── Helper: Geolocation ──
  useCurrentLocation() {
    if (!navigator.geolocation) {
      App.toast('⚠️', 'Geolocation not supported', 'warn'); return;
    }
    navigator.geolocation.getCurrentPosition(pos => {
      document.getElementById('f-lat').value = pos.coords.latitude.toFixed(6);
      document.getElementById('f-lng').value = pos.coords.longitude.toFixed(6);
      QREngine.livePreview();
      App.toast('📍', 'Location acquired', 'success');
    }, () => {
      App.toast('⚠️', 'Location access denied', 'warn');
    });
  },

  // ── File Upload ──
  async handleFileUpload(input) {
    const file = input.files?.[0];
    if (!file) return;
    await QRTemplates._uploadFile(file);
  },

  async handleFileDrop(ev) {
    ev.preventDefault();
    document.getElementById('file-drop-area').classList.remove('dragging');
    const file = ev.dataTransfer.files?.[0];
    if (!file) return;
    await QRTemplates._uploadFile(file);
  },

  async _uploadFile(file) {
    const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;
    const info = document.getElementById('file-info');
    const name = document.getElementById('file-name');

    if (!file) return;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      document.getElementById('f-file-input').value = '';
      if (name) name.textContent = `❌ File exceeds 500 MB limit`;
      if (info) info.style.display = 'flex';
      window._uploadedFileUrl = '';
      window._uploadedFileId = '';
      window._uploadedFileName = '';
      App.toast('⚠️', 'File is too large. Maximum size is 500 MB.', 'warn');
      return;
    }

    const sizeText = (file.size / (1024 * 1024)).toFixed(file.size > 1024 * 1024 ? 2 : 1);
    if (name) name.textContent = `Uploading ${file.name} (${sizeText} MB)...`;
    if (info) {
      info.style.display = 'flex';
    }
    App.toast('⏳', 'Uploading large file for QR sharing...', 'info');

    try {
      const fd = new FormData();
      fd.append('file', file);

      const customBase = (document.getElementById('f-file-custom-host')?.value || localStorage.getItem('qrforge_custom_base_url') || '').trim().replace(/\/$/, '');
      const headers = {};
      if (customBase) {
        headers['x-custom-base-url'] = customBase;
      }

      const res  = await fetch('/api/files', { method: 'POST', body: fd, headers });
      const data = await res.json();
      if (res.ok && data.url) {
        window._uploadedFileUrl = data.url;
        window._uploadedFileId = data.id;
        window._uploadedFileName = `${file.name} (${sizeText} MB)`;
        if (name) name.textContent = `✅ ${window._uploadedFileName}`;
        
        const urlContainer = document.getElementById('file-url-container');
        const urlInput = document.getElementById('file-url-input');
        const urlLink = document.getElementById('file-url-link');
        if (urlContainer) urlContainer.style.display = 'block';
        if (urlInput) urlInput.value = data.url;
        if (urlLink) urlLink.href = data.url;

        App.toast('✅', 'Large file uploaded and ready to share.', 'success');
        QREngine.livePreview();
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch {
      if (name) name.textContent = `❌ Upload failed. Try again.`;
      window._uploadedFileUrl = '';
      window._uploadedFileId = '';
      window._uploadedFileName = '';
      App.toast('❌', 'Upload failed. Check the file or try a smaller file.', 'error');
    }
  },

  async copyFileUrl() {
    const input = document.getElementById('file-url-input');
    if (!input || !input.value) return;
    try {
      await navigator.clipboard.writeText(input.value);
      App.toast('📋', 'Download URL copied to clipboard!', 'success');
    } catch {
      input.select();
      document.execCommand('copy');
      App.toast('📋', 'Download URL copied!', 'success');
    }
  },

  applyCustomHost() {
    const val = (document.getElementById('f-file-custom-host')?.value || '').trim().replace(/\/$/, '');
    if (val) {
      localStorage.setItem('qrforge_custom_base_url', val);
      App.toast('✅', `Custom Base URL applied: ${val}`, 'success');
    } else {
      localStorage.removeItem('qrforge_custom_base_url');
      App.toast('ℹ️', 'Reset to automatic network IP', 'info');
    }

    if (window._uploadedFileId) {
      const base = val || window._detectedLanUrl || window.location.origin;
      window._uploadedFileUrl = `${base}/api/files/${window._uploadedFileId}`;
      const urlInput = document.getElementById('file-url-input');
      const urlLink = document.getElementById('file-url-link');
      if (urlInput) urlInput.value = window._uploadedFileUrl;
      if (urlLink) urlLink.href = window._uploadedFileUrl;
      QREngine.livePreview();
    }
  },

  async detectNetwork() {
    try {
      const res = await fetch('/api/network');
      if (!res.ok) return;
      const data = await res.json();
      const badge = document.getElementById('network-detection-badge');
      const hostInput = document.getElementById('f-file-custom-host');
      if (data.lanAddress) {
        window._detectedLanUrl = `http://${data.lanAddress}:${data.port || 8080}`;
        if (badge) {
          badge.textContent = `LAN: ${data.lanAddress}`;
          badge.title = `Your PC's IP on Wi-Fi: ${data.lanAddress}`;
        }
        if (hostInput && !hostInput.value) {
          hostInput.placeholder = window._detectedLanUrl;
        }
      } else if (badge) {
        badge.textContent = `Port ${data.port || 8080}`;
      }
    } catch {
      // ignore network detection error
    }
  },

  clearFile() {
    const input = document.getElementById('f-file-input');
    if (input) input.value = '';
    const info = document.getElementById('file-info');
    if (info) info.style.display = 'none';
    window._uploadedFileUrl = '';
    window._uploadedFileId = '';
    window._uploadedFileName = '';
    QREngine.livePreview();
  }
};

const QRTemplates = QRTypes;
