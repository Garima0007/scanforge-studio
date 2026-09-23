/* ============================================================
   QRForge Pro – Designer Presets, Themes & Frame Library
   ============================================================ */

'use strict';

const Presets = {
  // ── Color Themes ──
  themes: [
    {
      id: 'cyber',
      name: 'Cyberpunk',
      colors: { fg: '#00ffcc', bg: '#0d0d1a', grad1: '#00ffcc', grad2: '#7700ff', gradType: 'linear', angle: 135 },
      dotStyle: 'dots',
      eyeOuter: 'square',
      eyeInner: 'dot',
      gradient: true,
    },
    {
      id: 'obsidian',
      name: 'Obsidian',
      colors: { fg: '#1a1a2e', bg: '#ffffff', grad1: '#1a1a2e', grad2: '#6c63ff', gradType: 'linear', angle: 180 },
      dotStyle: 'square',
      eyeOuter: 'square',
      eyeInner: 'square',
      gradient: false,
    },
    {
      id: 'solar',
      name: 'Solar Gold',
      colors: { fg: '#92400e', bg: '#fffbeb', grad1: '#f59e0b', grad2: '#dc2626', gradType: 'linear', angle: 45 },
      dotStyle: 'rounded',
      eyeOuter: 'square',
      eyeInner: 'dot',
      gradient: true,
    },
    {
      id: 'emerald',
      name: 'Emerald',
      colors: { fg: '#064e3b', bg: '#f0fdf4', grad1: '#10b981', grad2: '#0284c7', gradType: 'linear', angle: 135 },
      dotStyle: 'dots',
      eyeOuter: 'extra-rounded',
      eyeInner: 'dot',
      gradient: true,
    },
    {
      id: 'arctic',
      name: 'Arctic',
      colors: { fg: '#0c4a6e', bg: '#f0f9ff', grad1: '#0ea5e9', grad2: '#8b5cf6', gradType: 'linear', angle: 90 },
      dotStyle: 'extra-rounded',
      eyeOuter: 'extra-rounded',
      eyeInner: 'dot',
      gradient: true,
    },
    {
      id: 'sunset',
      name: 'Sunset',
      colors: { fg: '#7c2d12', bg: '#fff7ed', grad1: '#f97316', grad2: '#ec4899', gradType: 'linear', angle: 135 },
      dotStyle: 'rounded',
      eyeOuter: 'square',
      eyeInner: 'square',
      gradient: true,
    },
    {
      id: 'mono',
      name: 'Monochrome',
      colors: { fg: '#000000', bg: '#ffffff', grad1: '#000000', grad2: '#555555', gradType: 'linear', angle: 0 },
      dotStyle: 'square',
      eyeOuter: 'square',
      eyeInner: 'square',
      gradient: false,
    },
    {
      id: 'ocean',
      name: 'Ocean',
      colors: { fg: '#0f172a', bg: '#f8fafc', grad1: '#0891b2', grad2: '#4f46e5', gradType: 'radial', angle: 0 },
      dotStyle: 'classy',
      eyeOuter: 'extra-rounded',
      eyeInner: 'dot',
      gradient: true,
    },
  ],

  // ── Frame Templates ──
  frames: [
    { id: 'none',    name: 'No Frame',      preview: '⬛' },
    { id: 'scan',    name: 'SCAN ME',       preview: '📱', text: 'SCAN ME', position: 'bottom', bgColor: '#6c63ff', textColor: '#ffffff' },
    { id: 'pay',     name: 'Scan to Pay',   preview: '💳', text: 'SCAN TO PAY', position: 'bottom', bgColor: '#10b981', textColor: '#ffffff' },
    { id: 'wifi',    name: 'Connect WiFi',  preview: '📶', text: 'FREE Wi-Fi', position: 'top', bgColor: '#0ea5e9', textColor: '#ffffff' },
    { id: 'follow',  name: 'Follow Us',     preview: '🔗', text: 'FOLLOW US', position: 'bottom', bgColor: '#ec4899', textColor: '#ffffff' },
    { id: 'menu',    name: 'Scan Menu',     preview: '🍽️', text: 'VIEW MENU', position: 'bottom', bgColor: '#f59e0b', textColor: '#1a1a00' },
    { id: 'polaroid',name: 'Polaroid',      preview: '🖼️', text: '', position: 'none', bgColor: '#ffffff', textColor: '#333333', style: 'polaroid' },
    { id: 'pill',    name: 'Pill Border',   preview: '💊', text: 'SCAN', position: 'bottom', bgColor: '#6c63ff', textColor: '#ffffff', style: 'pill' },
  ],

  // ── Dot Style Definitions ──
  dotStyles: [
    { id: 'square',        label: 'Square',        dots: '■ ■\n■ ■' },
    { id: 'dots',          label: 'Dots',          dots: '● ●\n● ●' },
    { id: 'rounded',       label: 'Rounded',       dots: '▣ ▣\n▣ ▣' },
    { id: 'classy',        label: 'Classy',        dots: '◪ ◪\n◪ ◪' },
    { id: 'extra-rounded', label: 'Extra Round',   dots: '⬤ ⬤\n⬤ ⬤' },
    { id: 'diamond',       label: 'Diamond',       dots: '◆ ◆\n◆ ◆' },
  ],

  // ── Eye Styles ──
  eyeStyles: [
    { id: 'square',        label: 'Square' },
    { id: 'dot',           label: 'Dot' },
    { id: 'extra-rounded', label: 'Rounded' },
  ],

  // ── Built-in Logo Icons ──
  builtinIcons: [
    { id: 'wifi',     emoji: '📶', label: 'Wi-Fi' },
    { id: 'globe',    emoji: '🌐', label: 'Web' },
    { id: 'star',     emoji: '⭐', label: 'Star' },
    { id: 'heart',    emoji: '❤️', label: 'Heart' },
    { id: 'music',    emoji: '🎵', label: 'Music' },
    { id: 'upi',      emoji: '💳', label: 'Pay' },
    { id: 'youtube',  emoji: '▶️', label: 'YouTube' },
    { id: 'github',   emoji: '🐱', label: 'GitHub' },
    { id: 'bitcoin',  emoji: '₿',  label: 'Bitcoin' },
    { id: 'lock',     emoji: '🔒', label: 'Secure' },
  ],

  // ── Apply Theme ──
  apply(themeId) {
    const t = this.themes.find(x => x.id === themeId);
    if (!t) return;

    // Apply colors
    const fg = document.getElementById('fg-color-input');
    const bg = document.getElementById('bg-color-input');
    const g1 = document.getElementById('grad-color1');
    const g2 = document.getElementById('grad-color2');
    if (fg) { fg.value = t.colors.fg; document.getElementById('fg-hex').value = t.colors.fg; }
    if (bg) { bg.value = t.colors.bg; document.getElementById('bg-hex').value = t.colors.bg; }
    if (g1) { g1.value = t.colors.grad1; }
    if (g2) { g2.value = t.colors.grad2; }

    // Apply dot style
    QREngine.state.dotStyle = t.dotStyle;
    QREngine.state.eyeOuter = t.eyeOuter;
    QREngine.state.eyeInner = t.eyeInner;
    QREngine.state.gradient = t.gradient;
    QREngine.state.gradAngle= t.colors.angle;

    // Toggle gradient
    const gradToggle = document.getElementById('toggle-gradient');
    if (gradToggle) gradToggle.checked = t.gradient;
    document.getElementById('gradient-controls')?.classList.toggle('hidden', !t.gradient);

    // Update dot style UI
    document.querySelectorAll('.dot-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.style === t.dotStyle);
    });

    // Update preset buttons
    document.querySelectorAll('.preset-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.theme === themeId);
    });

    QREngine.livePreview();
    App.toast('🎨', `Applied "${t.name}" theme`, 'success');
  },

  // ── Render Theme Grid ──
  renderThemeGrid() {
    const wrap = document.getElementById('preset-grid');
    if (!wrap) return;
    wrap.innerHTML = this.themes.map(t => {
      const grad = `linear-gradient(${t.colors.angle || 135}deg, ${t.colors.grad1}, ${t.colors.grad2})`;
      return `
        <button class="preset-btn" data-theme="${t.id}" onclick="Presets.apply('${t.id}')" title="${t.name}">
          <div style="position:absolute;inset:0;background:${grad}"></div>
          <span>${t.name}</span>
        </button>`;
    }).join('');
  },

  // ── Render Frame Grid ──
  renderFrameGrid() {
    const wrap = document.getElementById('frame-grid');
    if (!wrap) return;
    wrap.innerHTML = this.frames.map(f => `
      <button class="frame-btn ${f.id === 'none' ? 'active' : ''}" data-frame="${f.id}"
              onclick="Presets.selectFrame('${f.id}', this)">
        <span class="frame-mini">${f.preview}</span>
        <span>${f.name}</span>
      </button>`).join('');
  },

  // ── Select Frame ──
  selectFrame(id, btn) {
    QREngine.state.frame = id;
    document.querySelectorAll('.frame-btn').forEach(b => b.classList.remove('active'));
    btn?.classList.add('active');
    QREngine.livePreview();
  },

  // ── Render Built-in Icons ──
  renderIconGrid() {
    const wrap = document.getElementById('builtin-icon-grid');
    if (!wrap) return;
    wrap.innerHTML = this.builtinIcons.map(ic => `
      <button class="logo-icon-btn" data-icon="${ic.id}" title="${ic.label}"
              onclick="Presets.selectBuiltinIcon('${ic.id}', '${ic.emoji}', this)">
        ${ic.emoji}
      </button>`).join('');
  },

  // ── Select Built-in Icon as Logo ──
  selectBuiltinIcon(id, emoji, btn) {
    // Render emoji to canvas, use as logo
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    ctx.font = '80px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 64, 68);
    QREngine.state.logoDataUrl = c.toDataURL();
    QREngine.state.logoSize    = 0.22;
    QREngine.state.eccLevel    = 'H'; // bump for logo
    document.getElementById('ecc-h')?.classList.add('active');
    document.querySelectorAll('.ecc-btn:not(#ecc-h)').forEach(b => b.classList.remove('active'));

    document.querySelectorAll('.logo-icon-btn').forEach(b => b.classList.remove('selected'));
    btn?.classList.add('selected');

    document.getElementById('logo-preview-wrap')?.classList.remove('hidden');
    const prev = document.getElementById('logo-preview-img');
    if (prev) { prev.src = QREngine.state.logoDataUrl; }

    QREngine.livePreview();
    App.toast('✨', `Using ${emoji} as logo`, 'success');
  }
};
