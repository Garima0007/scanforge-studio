/* ============================================================
   QRForge Pro – Main Application Controller & State Engine
   ============================================================ */

'use strict';

const App = {
  state: {
    currentPage:   'generate',
    savedQRs:      [],
    scanHistory:   [],
    user:          null,
    authenticated: false,
    users:         [],
  },

  // ── Bootstrap ──
  init() {
    this._loadState();
    this._initInteractiveBackground();
    this._checkSession();
    this._initNavListeners();
    this._renderTypeGrid();
    this._loadFormForType('url');
    Presets.renderThemeGrid();
    Presets.renderFrameGrid();
    Presets.renderIconGrid();
    Analytics.load();
    History.render();
    Scanner._renderScanHistory();
    this._initTiltEffect();
    this._initRippleEffect();

    // Generate initial live preview immediately
    setTimeout(() => {
      QREngine.livePreview(50);
    }, 100);
  },

  // ── Local Storage State Persistence ──
  _loadState() {
    this.state.savedQRs    = JSON.parse(localStorage.getItem('qrpro_savedQRs')    || '[]');
    this.state.scanHistory = JSON.parse(localStorage.getItem('qrpro_scanHistory') || '[]');
    this.state.users       = JSON.parse(localStorage.getItem('qrpro_users')       || '[]');
  },

  persist(key) {
    if (key === 'savedQRs')    localStorage.setItem('qrpro_savedQRs',    JSON.stringify(this.state.savedQRs));
    if (key === 'scanHistory') localStorage.setItem('qrpro_scanHistory', JSON.stringify(this.state.scanHistory));
    if (key === 'users')       localStorage.setItem('qrpro_users',       JSON.stringify(this.state.users));
  },

  // ── Refresh UI ──
  refreshUI() {
    const el = document.getElementById('history-count');
    if (el) el.textContent = this.state.savedQRs.length;
    History.render();
    Analytics.load();
  },

  // ── Session ──
  async _checkSession() {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'same-origin' });
      if (response.ok) {
        const data = await response.json();
        this.state.user = data.user;
        this.state.authenticated = true;
        this._enterApp('generate');
        return;
      }
    } catch {}
    this._showLanding();
  },

  _saveSession(page) {
    if (this.state.authenticated) localStorage.setItem('qrpro_lastPage', page || this.state.currentPage);
  },

  // ── Seamless Instant Studio Launcher (No forced sign-up!) ──
  launchStudio(page = 'generate') {
    if (!this.state.user) {
      this.state.user = { name: 'Pro Creator', email: 'guest@qrforge.pro' };
      this.state.authenticated = true;
    }
    this._enterApp(page);
    QREngine.livePreview(50);
  },

  // ── Landing / App Transition ──
  _showLanding() {
    const lp = document.getElementById('landing-page');
    if (lp) lp.style.display = 'flex';
    const ma = document.getElementById('main-app');
    if (ma) { ma.classList.remove('active'); ma.style.display = 'none'; }
  },

  _enterApp(page = 'generate') {
    const lp = document.getElementById('landing-page');
    if (lp) lp.style.display = 'none';
    const auth = document.getElementById('auth-overlay');
    if (auth) auth.style.display = 'none';

    const ma = document.getElementById('main-app');
    if (ma) {
      ma.style.display = 'flex';
      setTimeout(() => ma.classList.add('active'), 10);
    }

    this._updateUserUI();
    this.showPage(page);
  },

  _updateUserUI() {
    const u = this.state.user;
    if (!u) return;
    const navName = document.getElementById('nav-user-name');
    if (navName) navName.textContent = u.name;
    const hist = document.getElementById('history-count');
    if (hist) hist.textContent = this.state.savedQRs.length;

    const seed = u.email;
    const avatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(seed)}`;
    document.querySelectorAll('.user-avatar img').forEach(img => img.src = avatarUrl);
  },

  // ── Auth Modal Controller ──
  authMode: 'login',

  switchAuthMode(mode) {
    this.authMode = mode;
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === mode));
    const btn = document.getElementById('auth-submit-btn');
    if (btn) btn.textContent = mode === 'signup' ? 'Create Account' : 'Log In';
    document.getElementById('auth-name-group')?.classList.toggle('hidden', mode === 'login');
    const err = document.getElementById('auth-error');
    if (err) err.textContent = '';
  },

  openAuth() {
    const overlay = document.getElementById('auth-overlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    setTimeout(() => overlay.classList.add('show'), 10);
  },

  closeAuth() {
    const overlay = document.getElementById('auth-overlay');
    if (!overlay) return;
    overlay.classList.remove('show');
    setTimeout(() => overlay.style.display = 'none', 300);
  },

  async submitAuth() {
    const email = document.getElementById('auth-email')?.value?.trim();
    const pw    = document.getElementById('auth-password')?.value;
    const name  = document.getElementById('auth-name')?.value?.trim();
    const errEl = document.getElementById('auth-error');

    if (!email || !pw) { if (errEl) errEl.textContent = 'Please fill in all fields'; return; }
    if (!email.includes('@')) { if (errEl) errEl.textContent = 'Invalid email address'; return; }

    const btn = document.getElementById('auth-submit-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spin">⚙️</span> Please wait…';
    }

    try {
      const endpoint = this.authMode === 'signup' ? '/api/auth/register' : '/api/auth/login';
      const payload = this.authMode === 'signup' ? { name, email, password: pw } : { email, password: pw };
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Authentication failed.');

      this.state.user = data.user;
      this.state.authenticated = true;
      this._saveSession('generate');
      this._enterApp('generate');
      this.toast(this.authMode === 'signup' ? '🎉' : '👋', this.authMode === 'signup' ? `Account created! Welcome, ${name.split(' ')[0]}!` : `Welcome back, ${data.user.name.split(' ')[0]}!`, 'success');
    } catch (error) {
      if (errEl) errEl.textContent = error.message;
      if (btn) { btn.disabled = false; btn.textContent = this.authMode === 'signup' ? 'Create Account' : 'Log In'; }
    }
  },

  logout() {
    this.state.user = null;
    this.state.authenticated = false;
    fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).finally(() => {
      this._showLanding();
      this.toast('🚪', 'Logged out successfully', 'info');
    });
  },

  // ── Navigation & Page Routing ──
  showPage(page) {
    this.state.currentPage = page;

    // Tabs
    document.querySelectorAll('.app-nav-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.page === page);
    });

    // Page containers
    document.querySelectorAll('.app-page').forEach(p => {
      const isTarget = p.id === `page-${page}`;
      p.classList.toggle('active', isTarget);
      if (isTarget) {
        p.classList.remove('page-transition-enter');
        void p.offsetWidth;
        p.classList.add('page-transition-enter');
      }
    });

    if (page === 'scan') {
      Scanner.startCamera().catch(() => {});
    } else {
      Scanner.stopCamera();
    }

    if (page === 'analytics') Analytics.load();
    if (page === 'history')   History.render();

    this._saveSession(page);
  },

  _initNavListeners() {
    document.querySelectorAll('.app-nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const page = tab.dataset.page;
        if (page) this.showPage(page);
      });
    });
  },

  // ── QR Types Grid ──
  _renderTypeGrid() {
    const grid = document.getElementById('type-grid');
    if (!grid) return;
    grid.innerHTML = QRTypes.list.map(t => `
      <button class="type-btn ${t.id === QREngine.state.currentType ? 'active' : ''}"
              data-type="${t.id}"
              onclick="App._loadFormForType('${t.id}')">
        <span class="type-icon">${t.icon}</span>${t.label}
      </button>`).join('');
  },

  _loadFormForType(id) {
    QREngine.setType(id);
    this._renderTypeGrid();
  },

  // ── Interactive Neural Constellation Background ──
  _initInteractiveBackground() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const mouse = { x: -1000, y: -1000, radius: 140 };

    window.addEventListener('mousemove', e => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    window.addEventListener('mouseleave', () => {
      mouse.x = -1000;
      mouse.y = -1000;
    });

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const count = Math.min(75, Math.floor(window.innerWidth / 22));
    const particles = Array.from({ length: count }, () => ({
      x:      Math.random() * canvas.width,
      y:      Math.random() * canvas.height,
      vx:     (Math.random() - 0.5) * 0.45,
      vy:     (Math.random() - 0.5) * 0.45,
      baseR:  Math.random() * 2 + 1,
      r:      Math.random() * 2 + 1,
      color:  Math.random() > 0.5 ? '99, 102, 241' : '6, 182, 212',
      alpha:  Math.random() * 0.45 + 0.15,
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw particle nodes & physics
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Float motion
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Mouse repulsion & spring
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);

        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          p.x += (dx / dist) * force * 2.5;
          p.y += (dy / dist) * force * 2.5;
          p.r = p.baseR * 1.6;
        } else {
          p.r = p.baseR;
        }

        // Draw node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
        ctx.fill();

        // Connect nearby nodes with glowing laser lines
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const distNodes = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (distNodes < 115) {
            const lineAlpha = (1 - distNodes / 115) * 0.18;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${lineAlpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(render);
    };

    render();
  },

  // ── 3D Interactive Card Tilt on QR Preview ──
  _initTiltEffect() {
    const card = document.querySelector('.qr-preview-container');
    if (!card) return;

    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      const rotX = (-y * 14).toFixed(2);
      const rotY = (x * 14).toFixed(2);

      const canvasWrap = document.getElementById('qr-canvas-wrap');
      if (canvasWrap) {
        canvasWrap.style.transform = `perspective(750px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02, 1.02, 1.02)`;
        canvasWrap.style.boxShadow = `${-rotY * 1.5}px ${rotX * 1.5 + 20}px 50px rgba(99, 102, 241, 0.35)`;
      }
    });

    card.addEventListener('mouseleave', () => {
      const canvasWrap = document.getElementById('qr-canvas-wrap');
      if (canvasWrap) {
        canvasWrap.style.transform = 'perspective(750px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        canvasWrap.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.35)';
      }
    });
  },

  // ── Tactile Button Ripple Effect ──
  _initRippleEffect() {
    document.addEventListener('click', e => {
      const btn = e.target.closest('.btn');
      if (!btn) return;

      const rect = btn.getBoundingClientRect();
      const circle = document.createElement('span');
      const diameter = Math.max(rect.width, rect.height);
      const radius = diameter / 2;

      circle.style.width  = `${diameter}px`;
      circle.style.height = `${diameter}px`;
      circle.style.left   = `${e.clientX - rect.left - radius}px`;
      circle.style.top    = `${e.clientY - rect.top - radius}px`;
      circle.className    = 'ripple-circle';

      const existing = btn.querySelector('.ripple-circle');
      if (existing) existing.remove();

      btn.appendChild(circle);
      setTimeout(() => circle.remove(), 600);
    });
  },

  // ── Top Progress Bar ──
  showProgress() {
    const p = document.getElementById('progress-bar');
    if (p) {
      p.style.width = '0%';
      p.style.opacity = '1';
      setTimeout(() => p.style.width = '70%', 50);
    }
  },

  hideProgress() {
    const p = document.getElementById('progress-bar');
    if (p) {
      p.style.width = '100%';
      setTimeout(() => {
        p.style.opacity = '0';
        p.style.width = '0%';
      }, 350);
    }
  },

  setProgress(pct) {
    const p = document.getElementById('progress-bar');
    if (p) p.style.width = `${pct}%`;
  },

  // ── Dynamic Toast Notifications ──
  _toastTimer: null,
  toast(icon, msg, type = 'info') {
    clearTimeout(this._toastTimer);
    const toast      = document.getElementById('toast');
    const iconEl     = document.getElementById('toast-icon-el');
    const msgEl      = document.getElementById('toast-msg');
    const progressEl = document.getElementById('toast-progress');
    if (!toast) return;

    if (iconEl) {
      iconEl.textContent = icon;
      iconEl.className = `toast-icon ${type}`;
    }
    if (msgEl) msgEl.textContent = msg;

    if (progressEl) {
      progressEl.style.animation = 'none';
      void progressEl.offsetWidth;
      progressEl.style.animation = '';
    }

    toast.classList.add('show');
    this._toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  },
};


/* ============================================================
   QRForge Pro – History Manager
   ============================================================ */

const History = {
  filter: '',

  render() {
    const list = App.state.savedQRs.filter(q =>
      !this.filter ||
      q.name.toLowerCase().includes(this.filter) ||
      q.data.toLowerCase().includes(this.filter)
    );

    const container = document.getElementById('qr-history-list');
    if (!container) return;

    const countEl = document.getElementById('history-count');
    if (countEl) countEl.textContent = App.state.savedQRs.length;

    if (!list.length) {
      container.innerHTML = `
        <div style="text-align:center;padding:4rem 2rem;color:var(--text3)">
          <div style="font-size:3rem;margin-bottom:1rem">📭</div>
          <p>No saved QR codes found. Create your first one!</p>
        </div>`;
      return;
    }

    container.innerHTML = list.map(q => {
      const type = QRTypes.list.find(t => t.id === q.type);
      const thumb = q.snapshot
        ? `<img src="${q.snapshot}" alt="${q.name}" style="width:100%;height:100%;object-fit:contain;border-radius:4px"/>`
        : `<span style="font-size:1.5rem">${type?.icon || '⬛'}</span>`;

      return `
        <div class="qr-card" id="qr-card-${q.id}">
          <div class="qr-card-thumb">${thumb}</div>
          <div class="qr-card-info">
            <div class="qr-card-name">${q.name}</div>
            <div class="qr-card-url">${q.data.slice(0, 60)}${q.data.length > 60 ? '…' : ''}</div>
            <div class="qr-card-meta">
              <span class="badge ${q.dynamic ? 'badge-dynamic' : 'badge-static'}">${q.dynamic ? 'Dynamic' : 'Static'}</span>
              ${q.password ? '<span class="badge badge-locked">🔒 Protected</span>' : ''}
              <span class="badge badge-active">Active</span>
              <span class="text-xs text-muted">📊 ${q.scans} scans · ${q.created}</span>
            </div>
          </div>
          <div class="qr-card-actions">
            <button class="btn btn-icon" onclick="event.stopPropagation();History.download(${q.id})" title="Download">⬇️</button>
            <button class="btn btn-icon" onclick="event.stopPropagation();History.share(${q.id})" title="Share">🔗</button>
            <button class="btn btn-icon" onclick="event.stopPropagation();History.delete(${q.id})" title="Delete" style="color:var(--red)">🗑️</button>
          </div>
        </div>`;
    }).join('');
  },

  search(q) {
    this.filter = q.toLowerCase();
    this.render();
  },

  delete(id) {
    App.state.savedQRs = App.state.savedQRs.filter(q => q.id !== id);
    App.persist('savedQRs');
    this.render();
    Analytics.load();
    const countEl = document.getElementById('history-count');
    if (countEl) countEl.textContent = App.state.savedQRs.length;
    App.toast('🗑️', 'QR code deleted', 'info');
  },

  download(id) {
    const q = App.state.savedQRs.find(x => x.id === id);
    if (!q?.snapshot) {
      App.toast('⚠️', 'No snapshot available', 'warn');
      return;
    }
    const a = document.createElement('a');
    a.href = q.snapshot;
    a.download = `${q.name}.png`;
    a.click();
    App.toast('⬇️', 'Downloading QR snapshot…', 'info');
  },

  share(id) {
    const q = App.state.savedQRs.find(x => x.id === id);
    if (!q) return;
    navigator.clipboard.writeText(q.data).then(() => App.toast('📋', 'QR content copied!', 'success'));
  },

  clearAll() {
    if (!confirm('Delete all saved QR codes? This cannot be undone.')) return;
    App.state.savedQRs = [];
    App.persist('savedQRs');
    this.render();
    Analytics.load();
    App.toast('🗑️', 'All QR codes cleared', 'info');
  },
};

// ── Initialize App on DOM Ready ──
document.addEventListener('DOMContentLoaded', () => App.init());
