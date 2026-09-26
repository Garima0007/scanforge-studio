/* ============================================================
   QRForge Pro – Advanced QR & Barcode Canvas Rendering Engine
   ============================================================ */

'use strict';

const QREngine = {
  state: {
    currentType:  'url',
    dotStyle:     'square',      // square | dots | rounded | classy | extra-rounded | diamond
    eyeOuter:     'square',      // square | extra-rounded | circle
    eyeInner:     'square',      // square | dot
    eyeOuterColor:null,          // null = use fg/grad
    eyeInnerColor:null,          // null = use fg/grad
    fgColor:      '#000000',
    bgColor:      '#ffffff',
    gradient:     false,
    gradColor1:   '#6366f1',
    gradColor2:   '#06b6d4',
    gradType:     'linear',      // linear | radial
    gradAngle:    135,
    eccLevel:     'M',           // L | M | Q | H
    size:         280,
    margin:       16,
    frame:        'none',        // none | scan | pay | wifi | follow | menu | polaroid | pill
    frameText:    '',
    frameBg:      '#6366f1',
    frameColor:   '#ffffff',
    logoDataUrl:  null,
    logoSize:     0.22,
    logoShape:    'rounded',
    logoBgColor:  '#ffffff',
    logoBorderColor: '#e5e7eb',
    dynamic:      false,
    dynamicSlug:  null,
    password:     null,
    lastQRData:   'https://qrforge.io',
    lastCanvas:   null,
    lastMatrix:   null,
    isBarcodeMode:false,
  },

  _previewTimer: null,

  // ── Live Preview (debounced) ──
  livePreview(delay = 150) {
    clearTimeout(this._previewTimer);
    this._previewTimer = setTimeout(() => this._doRender(false), delay);
  },

  // ── Main Render Pipeline ──
  async _doRender(save = false) {
    const type = this.state.currentType;

    if (type === 'barcode') {
      return this._renderBarcode(save);
    }

    let rawData = QRTypes.buildData(type);
    if (!rawData || rawData.trim().length === 0) {
      rawData = 'https://qrforge.io';
    }

    let data = rawData;

    // Password encryption via AES-256-GCM
    if (this.state.password) {
      try {
        const enc = await CryptoEngine.encrypt(rawData, this.state.password);
        data = 'qrpro://enc/v1/' + enc;
      } catch (e) {
        console.error('Encryption error', e);
      }
    }

    // Dynamic slug routing
    if (this.state.dynamic && this.state.dynamicSlug) {
      data = `https://qrforge.io/r/${this.state.dynamicSlug}`;
    }

    this.state.lastQRData = data;
    this._drawQR(data, save);
  },

  // ── Draw QR to Canvas ──
  _drawQR(data, save) {
    const wrap = document.getElementById('qr-canvas-wrap');
    if (!wrap) return;

    // Use hidden offscreen container for QRCode.js
    const tmp = document.createElement('div');
    tmp.style.cssText = 'position:absolute;left:-9999px;top:-9999px;visibility:hidden;width:300px;height:300px;';
    document.body.appendChild(tmp);

    let qrObj;
    const ecc = QRCode.CorrectLevel[this.state.eccLevel] || QRCode.CorrectLevel.M;

    try {
      qrObj = new QRCode(tmp, {
        text:         data,
        width:        this.state.size,
        height:       this.state.size,
        colorDark:    '#000000',
        colorLight:   '#ffffff',
        correctLevel: this.state.logoDataUrl ? QRCode.CorrectLevel.H : ecc
      });
    } catch (err) {
      console.warn('QRCode creation fallback for long data', err);
      try {
        qrObj = new QRCode(tmp, {
          text:         data,
          width:        this.state.size,
          height:       this.state.size,
          colorDark:    '#000000',
          colorLight:   '#ffffff',
          correctLevel: QRCode.CorrectLevel.L
        });
      } catch (e) {
        tmp.remove();
        App.toast('❌', 'Content too long for QR code. Try shorter text.', 'error');
        return;
      }
    }

    // Extract exact boolean matrix from QRCode instance
    let matrix = null;
    let moduleCount = 0;

    if (qrObj._oQRCode && typeof qrObj._oQRCode.getModuleCount === 'function') {
      moduleCount = qrObj._oQRCode.getModuleCount();
      matrix = [];
      for (let r = 0; r < moduleCount; r++) {
        const row = [];
        for (let c = 0; c < moduleCount; c++) {
          row.push(qrObj._oQRCode.isDark(r, c));
        }
        matrix.push(row);
      }
    } else {
      // Fallback: extract from generated canvas element
      const tmpCanvas = tmp.querySelector('canvas');
      if (tmpCanvas) {
        matrix = this._extractMatrixFromCanvas(tmpCanvas);
        moduleCount = matrix ? matrix.length : 25;
      }
    }

    tmp.remove();

    if (!matrix || matrix.length === 0) {
      console.error('Failed to construct QR matrix');
      return;
    }

    this.state.lastMatrix = matrix;

    // Create main high-DPI rendering canvas
    const size     = this.state.size;
    const margin   = this.state.margin;
    const fullSize = size + margin * 2;

    const dpr    = window.devicePixelRatio || 1;
    const canvas = document.createElement('canvas');
    canvas.id    = 'qr-main-canvas';
    canvas.width = fullSize * dpr;
    canvas.height= fullSize * dpr;
    canvas.style.width    = `${fullSize}px`;
    canvas.style.height   = `${fullSize}px`;
    canvas.style.display  = 'block';
    canvas.style.maxWidth = '100%';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // 1. Draw Background
    ctx.fillStyle = this.state.bgColor;
    ctx.fillRect(0, 0, fullSize, fullSize);

    // 2. Custom Draw QR Matrix (Dots, Shapes, Eyes, Gradients)
    this._renderMatrixToCanvas(ctx, matrix, moduleCount, size, margin);

    // 3. Draw Center Logo if enabled
    if (this.state.logoDataUrl) {
      this._drawLogo(ctx, fullSize);
    }

    // 4. Draw Call-to-Action Marketing Frame if enabled
    let finalCanvas = canvas;
    if (this.state.frame && this.state.frame !== 'none') {
      finalCanvas = this._renderFramedCanvas(canvas, this.state.frame, dpr);
    }

    // Mount canvas into DOM
    const old = document.getElementById('qr-main-canvas');
    if (old) old.remove();
    document.getElementById('qr-placeholder')?.classList.add('hidden');
    wrap.appendChild(finalCanvas);

    // Trigger reveal animation
    finalCanvas.classList.remove('qr-reveal');
    void finalCanvas.offsetWidth;
    finalCanvas.classList.add('qr-reveal');

    this.state.lastCanvas = finalCanvas;

    // Update metadata badges
    this._updatePreviewMeta(data);

    if (save) {
      this._saveToHistory(data);
      this._fireConfetti();
      App.toast('✅', 'QR Code generated & saved!', 'success');
    }
  },

  // ── Render Matrix to Canvas ──
  _renderMatrixToCanvas(ctx, matrix, count, size, margin) {
    const cellSize = size / count;

    // Setup fill style (Gradient or Solid)
    let fillStyle;
    if (this.state.gradient) {
      if (this.state.gradType === 'radial') {
        const cx = margin + size / 2;
        const cy = margin + size / 2;
        const grad = ctx.createRadialGradient(cx, cy, size * 0.05, cx, cy, size * 0.72);
        grad.addColorStop(0, this.state.gradColor1);
        grad.addColorStop(1, this.state.gradColor2);
        fillStyle = grad;
      } else {
        const rad = ((this.state.gradAngle || 135) - 90) * Math.PI / 180;
        const cx = margin + size / 2;
        const cy = margin + size / 2;
        const half = size / 2;
        const x0 = cx - Math.cos(rad) * half;
        const y0 = cy - Math.sin(rad) * half;
        const x1 = cx + Math.cos(rad) * half;
        const y1 = cy + Math.sin(rad) * half;
        const grad = ctx.createLinearGradient(x0, y0, x1, y1);
        grad.addColorStop(0, this.state.gradColor1);
        grad.addColorStop(1, this.state.gradColor2);
        fillStyle = grad;
      }
    } else {
      fillStyle = this.state.fgColor;
    }

    // Logo cutout bounds
    let logoBounds = null;
    if (this.state.logoDataUrl) {
      const mid = Math.floor(count / 2);
      const halfL = Math.ceil((count * (this.state.logoSize || 0.22)) / 2) + 1;
      logoBounds = { r0: mid - halfL, r1: mid + halfL, c0: mid - halfL, c1: mid + halfL };
    }

    // Helper: is cell inside one of the 3 corner eyes (finder patterns)
    const isEyeModule = (r, c) => {
      // Top-Left (0..6, 0..6)
      if (r < 7 && c < 7) return true;
      // Top-Right (0..6, count-7..count-1)
      if (r < 7 && c >= count - 7) return true;
      // Bottom-Left (count-7..count-1, 0..6)
      if (r >= count - 7 && c < 7) return true;
      return false;
    };

    // Helper: is cell in the 1-module white separator ring around eyes
    const isEyeSeparator = (r, c) => {
      if (r <= 7 && c <= 7) return true;
      if (r <= 7 && c >= count - 8) return true;
      if (r >= count - 8 && c <= 7) return true;
      return false;
    };

    ctx.fillStyle = fillStyle;

    // 1. Draw Data & Timing Modules (Outside Eyes & Logo)
    const dotStyle = this.state.dotStyle || 'square';

    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        // Skip eyes (handled separately)
        if (isEyeSeparator(r, c)) continue;

        // Skip logo center cutout
        if (logoBounds && r >= logoBounds.r0 && r <= logoBounds.r1 && c >= logoBounds.c0 && c <= logoBounds.c1) {
          continue;
        }

        if (!matrix[r][c]) continue;

        const x = margin + c * cellSize;
        const y = margin + r * cellSize;

        this._drawCellDot(ctx, x, y, cellSize, dotStyle);
      }
    }

    // 2. Draw 3 Corner Eyes (Finder Patterns)
    const eyeOuterColor = this.state.eyeOuterColor || fillStyle;
    const eyeInnerColor = this.state.eyeInnerColor || fillStyle;

    this._drawCornerEye(ctx, margin + 0 * cellSize, margin + 0 * cellSize, cellSize, eyeOuterColor, eyeInnerColor);
    this._drawCornerEye(ctx, margin + (count - 7) * cellSize, margin + 0 * cellSize, cellSize, eyeOuterColor, eyeInnerColor);
    this._drawCornerEye(ctx, margin + 0 * cellSize, margin + (count - 7) * cellSize, cellSize, eyeOuterColor, eyeInnerColor);
  },

  // ── Draw Individual Dot ──
  _drawCellDot(ctx, x, y, size, style) {
    const pad = 0.15;
    const s   = size + 0.3; // Slight 0.3px overlap prevents white hairline gaps

    switch (style) {
      case 'dots':
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size * 0.44, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'rounded':
        this._roundRect(ctx, x + pad, y + pad, size - pad * 2 + 0.2, size - pad * 2 + 0.2, size * 0.28);
        ctx.fill();
        break;

      case 'extra-rounded':
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size * 0.48, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'classy':
        this._roundRect(ctx, x + pad, y + pad, size - pad * 2 + 0.2, size - pad * 2 + 0.2, [size * 0.42, 0, size * 0.42, 0]);
        ctx.fill();
        break;

      case 'diamond':
        ctx.save();
        ctx.translate(x + size / 2, y + size / 2);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-size * 0.38, -size * 0.38, size * 0.76, size * 0.76);
        ctx.restore();
        break;

      case 'square':
      default:
        ctx.fillRect(x, y, s, s);
        break;
    }
  },

  // ── Draw Finder Pattern (Corner Eye) ──
  _drawCornerEye(ctx, x, y, cellSize, outerColor, innerColor) {
    const eyeSize = 7 * cellSize;
    const outerStyle = this.state.eyeOuter || 'square';
    const innerStyle = this.state.eyeInner || 'square';

    // 1. Draw Outer 7x7 Ring
    ctx.fillStyle = outerColor;

    if (outerStyle === 'circle' || outerStyle === 'extra-rounded') {
      const rOuter = eyeSize / 2;
      const rInner = (eyeSize - 2 * cellSize) / 2;
      ctx.beginPath();
      ctx.arc(x + rOuter, y + rOuter, rOuter, 0, Math.PI * 2, false);
      ctx.arc(x + rOuter, y + rOuter, rInner, 0, Math.PI * 2, true);
      ctx.fill();
    } else if (outerStyle === 'rounded') {
      // Rounded box outer with hollow center
      ctx.beginPath();
      this._roundRectPath(ctx, x, y, eyeSize, eyeSize, cellSize * 1.5);
      this._roundRectPath(ctx, x + cellSize, y + cellSize, eyeSize - 2 * cellSize, eyeSize - 2 * cellSize, cellSize * 0.8, true);
      ctx.fill();
    } else {
      // Classic square 7x7 outer box with 5x5 cutout
      ctx.fillRect(x, y, eyeSize, cellSize); // top
      ctx.fillRect(x, y + eyeSize - cellSize, eyeSize, cellSize); // bottom
      ctx.fillRect(x, y + cellSize, cellSize, eyeSize - 2 * cellSize); // left
      ctx.fillRect(x + eyeSize - cellSize, y + cellSize, cellSize, eyeSize - 2 * cellSize); // right
    }

    // 2. Draw Inner 3x3 Center Dot
    ctx.fillStyle = innerColor;
    const inX = x + 2 * cellSize;
    const inY = y + 2 * cellSize;
    const inSize = 3 * cellSize;

    if (innerStyle === 'dot' || innerStyle === 'circle') {
      ctx.beginPath();
      ctx.arc(inX + inSize / 2, inY + inSize / 2, inSize * 0.48, 0, Math.PI * 2);
      ctx.fill();
    } else if (innerStyle === 'rounded') {
      this._roundRect(ctx, inX, inY, inSize, inSize, cellSize * 0.8);
      ctx.fill();
    } else {
      ctx.fillRect(inX, inY, inSize, inSize);
    }
  },

  // ── Draw Center Logo ──
  _drawLogo(ctx, fullSize) {
    if (!this.state.logoDataUrl) return;

    const img = new Image();
    img.src = this.state.logoDataUrl;

    const draw = () => {
      const logoW = fullSize * (this.state.logoSize || 0.22);
      const logoH = logoW;
      const x = (fullSize - logoW) / 2;
      const y = (fullSize - logoH) / 2;
      const pad = 8;
      const shape = this.state.logoShape || 'rounded';
      const badgeW = logoW + pad * 2;
      const badgeH = logoH + pad * 2;

      ctx.save();
      ctx.shadowColor = 'rgba(79, 70, 229, 0.18)';
      ctx.shadowBlur = 18;
      ctx.fillStyle = this.state.logoBgColor || '#ffffff';
      ctx.strokeStyle = this.state.logoBorderColor || '#e5e7eb';
      ctx.lineWidth = 2;

      if (shape === 'circle') {
        ctx.beginPath();
        ctx.arc(x + logoW / 2 + pad, y + logoH / 2 + pad, Math.min(logoW, logoH) / 2 + pad, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (shape === 'square') {
        this._roundRect(ctx, x - pad, y - pad, badgeW, badgeH, 10);
        ctx.fill();
        ctx.stroke();
      } else {
        this._roundRect(ctx, x - pad, y - pad, badgeW, badgeH, Math.min(logoW, logoH) * 0.26);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();

      ctx.save();
      const innerPad = shape === 'circle' ? 6 : 4;
      const drawX = x + innerPad;
      const drawY = y + innerPad;
      const drawW = logoW - innerPad * 2;
      const drawH = logoH - innerPad * 2;
      if (shape === 'circle') {
        ctx.beginPath();
        ctx.arc(x + logoW / 2 + pad, y + logoH / 2 + pad, Math.min(drawW, drawH) / 2, 0, Math.PI * 2);
        ctx.clip();
      }
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();
    };

    if (img.complete) draw();
    else img.onload = draw;
  },

  // ── Render Framed Canvas ──
  _renderFramedCanvas(srcCanvas, frameId, dpr) {
    const frameDef = Presets.frames.find(f => f.id === frameId);
    if (!frameDef || frameId === 'none') return srcCanvas;

    const text    = this.state.frameText || frameDef.text || 'SCAN ME';
    const frameBg = this.state.frameBg || frameDef.bgColor || '#6366f1';
    const textCol = this.state.frameColor || frameDef.textColor || '#ffffff';

    const qrW = srcCanvas.width / dpr;
    const qrH = srcCanvas.height / dpr;

    const bannerH = 54;
    const padX    = 20;
    const isTop   = frameDef.position === 'top';

    const outW = qrW + padX * 2;
    const outH = qrH + bannerH + 28;

    const framed = document.createElement('canvas');
    framed.id    = 'qr-main-canvas';
    framed.width = outW * dpr;
    framed.height= outH * dpr;
    framed.style.width    = `${outW}px`;
    framed.style.height   = `${outH}px`;
    framed.style.display  = 'block';
    framed.style.maxWidth = '100%';

    const fctx = framed.getContext('2d');
    fctx.scale(dpr, dpr);

    // Frame Body background
    fctx.fillStyle = frameBg;
    this._roundRect(fctx, 0, 0, outW, outH, 20);
    fctx.fill();

    // QR Code placement
    const qrX = padX;
    const qrY = isTop ? bannerH + 14 : 14;

    // White backing card for QR
    fctx.fillStyle = '#ffffff';
    this._roundRect(fctx, qrX - 4, qrY - 4, qrW + 8, qrH + 8, 12);
    fctx.fill();

    fctx.drawImage(srcCanvas, 0, 0, srcCanvas.width, srcCanvas.height, qrX, qrY, qrW, qrH);

    // CTA Text & Icon
    fctx.fillStyle = textCol;
    fctx.font = 'bold 15px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    fctx.textAlign = 'center';
    fctx.textBaseline = 'middle';

    const textY = isTop ? bannerH / 2 + 6 : qrY + qrH + bannerH / 2;
    fctx.fillText(text, outW / 2, textY);

    return framed;
  },

  // ── Generate 100% Pure Vector SVG ──
  generateSVG() {
    const matrix = this.state.lastMatrix;
    if (!matrix) return null;

    const count    = matrix.length;
    const size     = this.state.size;
    const margin   = this.state.margin;
    const fullSize = size + margin * 2;
    const cellSize = size / count;

    let defs = '';
    let fill = this.state.fgColor;

    if (this.state.gradient) {
      if (this.state.gradType === 'radial') {
        defs = `<defs>
          <radialGradient id="qrGrad" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stop-color="${this.state.gradColor1}"/>
            <stop offset="100%" stop-color="${this.state.gradColor2}"/>
          </radialGradient>
        </defs>`;
        fill = 'url(#qrGrad)';
      } else {
        const rad = ((this.state.gradAngle || 135) - 90) * Math.PI / 180;
        const x1 = Math.round(50 - Math.cos(rad) * 50);
        const y1 = Math.round(50 - Math.sin(rad) * 50);
        const x2 = Math.round(50 + Math.cos(rad) * 50);
        const y2 = Math.round(50 + Math.sin(rad) * 50);
        defs = `<defs>
          <linearGradient id="qrGrad" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
            <stop offset="0%" stop-color="${this.state.gradColor1}"/>
            <stop offset="100%" stop-color="${this.state.gradColor2}"/>
          </linearGradient>
        </defs>`;
        fill = 'url(#qrGrad)';
      }
    }

    let elements = '';
    const style = this.state.dotStyle || 'square';

    const isEyeSep = (r, c) => {
      if (r <= 7 && c <= 7) return true;
      if (r <= 7 && c >= count - 8) return true;
      if (r >= count - 8 && c <= 7) return true;
      return false;
    };

    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (isEyeSep(r, c)) continue;
        if (!matrix[r][c]) continue;

        const x = margin + c * cellSize;
        const y = margin + r * cellSize;

        if (style === 'dots' || style === 'extra-rounded') {
          const cx = x + cellSize / 2;
          const cy = y + cellSize / 2;
          const rad = (cellSize * 0.44).toFixed(2);
          elements += `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${rad}" fill="${fill}"/>\n`;
        } else if (style === 'rounded') {
          const rad = (cellSize * 0.28).toFixed(2);
          elements += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${cellSize.toFixed(2)}" height="${cellSize.toFixed(2)}" rx="${rad}" fill="${fill}"/>\n`;
        } else {
          elements += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${(cellSize + 0.2).toFixed(2)}" height="${(cellSize + 0.2).toFixed(2)}" fill="${fill}"/>\n`;
        }
      }
    }

    // SVG Corner Eyes
    const addSvgEye = (ox, oy) => {
      const eSize = 7 * cellSize;
      elements += `<rect x="${ox.toFixed(2)}" y="${oy.toFixed(2)}" width="${eSize.toFixed(2)}" height="${eSize.toFixed(2)}" fill="${fill}"/>\n`;
      elements += `<rect x="${(ox + cellSize).toFixed(2)}" y="${(oy + cellSize).toFixed(2)}" width="${(5 * cellSize).toFixed(2)}" height="${(5 * cellSize).toFixed(2)}" fill="${this.state.bgColor}"/>\n`;
      elements += `<rect x="${(ox + 2 * cellSize).toFixed(2)}" y="${(oy + 2 * cellSize).toFixed(2)}" width="${(3 * cellSize).toFixed(2)}" height="${(3 * cellSize).toFixed(2)}" fill="${fill}"/>\n`;
    };

    addSvgEye(margin, margin);
    addSvgEye(margin + (count - 7) * cellSize, margin);
    addSvgEye(margin, margin + (count - 7) * cellSize);

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${fullSize} ${fullSize}" width="${fullSize}" height="${fullSize}">
  ${defs}
  <rect width="${fullSize}" height="${fullSize}" fill="${this.state.bgColor}"/>
  ${elements}
</svg>`;
  },

  // ── Barcode Mode ──
  _renderBarcode(save) {
    const data = QRTypes.buildData('barcode') || '123456789012';
    BarcodeEngine.render(data, save);
  },

  // ── Generate Button Click ──
  async generate() {
    const btn = document.getElementById('gen-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spin">⚙️</span> Generating…';
    }

    App.showProgress();

    try {
      await this._doRender(true);
    } finally {
      setTimeout(() => {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '✨ Generate & Save QR Code';
        }
        App.hideProgress();
      }, 500);
    }
  },

  // ── Multi-Format Download ──
  download(format = 'png', scale = 1) {
    const canvas = this.state.lastCanvas;
    if (!canvas) {
      App.toast('⚠️', 'Generate a QR code first', 'warn');
      return;
    }

    const type = this.state.currentType;

    if (format === 'svg') {
      const svg = this.generateSVG();
      if (!svg) {
        App.toast('⚠️', 'Could not generate vector SVG', 'warn');
        return;
      }
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `qrforge-${type}-${Date.now()}.svg`;
      a.click();
      URL.revokeObjectURL(a.href);
      App.toast('⬇️', 'Vector SVG downloaded!', 'success');
      return;
    }

    // High-Resolution PNG / JPEG / WebP Export
    const dpr = window.devicePixelRatio || 1;
    const baseW = canvas.width / dpr;
    const baseH = canvas.height / dpr;

    const out = document.createElement('canvas');
    out.width  = baseW * scale;
    out.height = baseH * scale;
    const octx = out.getContext('2d');
    octx.imageSmoothingQuality = 'high';
    octx.drawImage(canvas, 0, 0, out.width, out.height);

    const mime = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
    const ext  = format === 'jpeg' ? 'jpg' : format === 'webp' ? 'webp' : 'png';

    const a = document.createElement('a');
    a.href = out.toDataURL(mime, 0.95);
    a.download = `qrforge-${type}-${scale}x-${Date.now()}.${ext}`;
    a.click();

    App.toast('⬇️', `Downloaded ${scale}x ${format.toUpperCase()}`, 'success');
  },

  // ── Copy to Clipboard ──
  async copyToClipboard() {
    const canvas = this.state.lastCanvas;
    if (!canvas) {
      App.toast('⚠️', 'Generate a QR code first', 'warn');
      return;
    }

    try {
      canvas.toBlob(async blob => {
        if (!blob) return;
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        App.toast('📋', 'QR Code copied to clipboard!', 'success');
      });
    } catch (err) {
      console.warn('Clipboard write failed, fallback', err);
      App.toast('⚠️', 'Clipboard access denied or unsupported', 'warn');
    }
  },

  // ── Web Share API ──
  async share() {
    const canvas = this.state.lastCanvas;
    if (!canvas) {
      App.toast('⚠️', 'Generate a QR code first', 'warn');
      return;
    }

    if (navigator.share && navigator.canShare) {
      canvas.toBlob(async blob => {
        const file = new File([blob], 'qrforge.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: 'QRForge Pro QR Code',
              text:  this.state.lastQRData || '',
              files: [file]
            });
            App.toast('🔗', 'Shared successfully!', 'success');
          } catch {}
        }
      });
    } else {
      await navigator.clipboard.writeText(this.state.lastQRData || '');
      App.toast('📋', 'QR link copied to clipboard!', 'success');
    }
  },

  // ── Save to Local Storage History ──
  _saveToHistory(data) {
    const type = QRTypes.list.find(t => t.id === this.state.currentType);
    const snapshot = this.state.lastCanvas?.toDataURL('image/png') || null;

    const entry = {
      id:       Date.now(),
      name:     `${type?.label || 'QR'} #${(App.state.savedQRs.length + 1)}`,
      type:     this.state.currentType,
      data:     data,
      dynamic:  this.state.dynamic,
      slug:     this.state.dynamicSlug,
      password: !!this.state.password,
      eccLevel: this.state.eccLevel,
      snapshot: snapshot,
      scans:    0,
      unique:   0,
      created:  new Date().toLocaleDateString(),
      createdTs:Date.now(),
    };

    App.state.savedQRs.unshift(entry);
    App.persist('savedQRs');
    App.refreshUI();
  },

  // ── Confetti Burst Physics ──
  _fireConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');

    const colors = ['#6366f1', '#06b6d4', '#ec4899', '#f59e0b', '#10b981', '#ffffff'];
    const pieces = Array.from({ length: 65 }, () => ({
      x:    canvas.width / 2 + (Math.random() - 0.5) * 200,
      y:    canvas.height * 0.5,
      vx:   (Math.random() - 0.5) * 16,
      vy:   Math.random() * -18 - 4,
      w:    Math.random() * 9 + 4,
      h:    Math.random() * 6 + 2,
      color:colors[Math.floor(Math.random() * colors.length)],
      rot:  Math.random() * 360,
      rotV: (Math.random() - 0.5) * 12,
      g:    0.45,
      op:   1,
      fade: 0.015 + Math.random() * 0.01,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      pieces.forEach(p => {
        if (p.op <= 0) return;
        alive = true;
        p.x += p.vx; p.vy += p.g; p.y += p.vy;
        p.rot += p.rotV; p.op -= p.fade;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot * Math.PI / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.op);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      if (alive) requestAnimationFrame(animate);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    animate();
  },

  // ── Update Metadata UI ──
  _updatePreviewMeta(data) {
    const type  = QRTypes.list.find(t => t.id === this.state.currentType);
    const short = data.length > 40 ? data.slice(0, 37) + '…' : data;

    const el = document.getElementById('qr-content-label');
    if (el) el.textContent = short;

    const typeEl = document.getElementById('preview-type-badge');
    if (typeEl) typeEl.textContent = type?.label || 'QR';

    const eccEl = document.getElementById('preview-ecc-badge');
    if (eccEl) eccEl.textContent = 'ECC-' + this.state.eccLevel;

    const sizeEl = document.getElementById('preview-size-badge');
    if (sizeEl) sizeEl.textContent = `${this.state.size + this.state.margin * 2}px`;
  },

  // ── Control Setters ──
  setType(id) {
    this.state.currentType = id;
    this.state.isBarcodeMode = (id === 'barcode');

    document.querySelectorAll('.type-btn').forEach(b => b.classList.toggle('active', b.dataset.type === id));

    const area = document.getElementById('form-area');
    if (area && QRTypes.forms[id]) area.innerHTML = QRTypes.forms[id]();

    const type = QRTypes.list.find(t => t.id === id);
    const tb = document.getElementById('preview-type-badge');
    if (tb) tb.textContent = type?.label || 'QR';

    if (id === 'file') {
      setTimeout(() => QRTemplates.detectNetwork?.(), 20);
    }

    this.livePreview(50);
  },

  setDotStyle(style) {
    this.state.dotStyle = style;
    this.livePreview();
  },

  setEyeOuter(style) {
    this.state.eyeOuter = style;
    this.livePreview();
  },

  setEyeInner(style) {
    this.state.eyeInner = style;
    this.livePreview();
  },

  setECC(level) {
    const normalized = String(level).toUpperCase();
    this.state.eccLevel = normalized;
    document.querySelectorAll('.ecc-btn').forEach(btn => {
      const isActive = (btn.dataset.ecc || '').toUpperCase() === normalized || btn.id === `ecc-${normalized.toLowerCase()}`;
      btn.classList.toggle('active', isActive);
    });
    this.livePreview();
  },

  setEcc(level) {
    this.setECC(level);
  },

  setEye(position, style) {
    const normalized = style || 'square';

    if (position === 'outer') {
      this.state.eyeOuter = normalized;
      document.querySelectorAll('[data-eye-role="outer"]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.eyeStyle === normalized);
      });
    }

    if (position === 'inner') {
      this.state.eyeInner = normalized;
      document.querySelectorAll('[data-eye-role="inner"]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.eyeStyle === normalized);
      });
    }

    this.livePreview();
  },

  updateColors() {
    const fg = document.getElementById('fg-color-input');
    const bg = document.getElementById('bg-color-input');
    const g1 = document.getElementById('grad-color1');
    const g2 = document.getElementById('grad-color2');
    if (fg) this.state.fgColor    = fg.value;
    if (bg) this.state.bgColor    = bg.value;
    if (g1) this.state.gradColor1 = g1.value;
    if (g2) this.state.gradColor2 = g2.value;
    this.livePreview();
  },

  toggleGradient(on) {
    this.state.gradient = on;
    document.getElementById('gradient-controls')?.classList.toggle('hidden', !on);
    this.livePreview();
  },

  setGradAngle(v) {
    this.state.gradAngle = parseInt(v);
    const el = document.getElementById('grad-angle-val');
    if (el) el.textContent = v + '°';
    this.livePreview();
  },

  setSize(v) {
    this.state.size = parseInt(v);
    const el = document.getElementById('size-val');
    if (el) el.textContent = v + 'px';
    this.livePreview();
  },

  setLogoShape(shape) {
    this.state.logoShape = shape || 'rounded';
    document.querySelectorAll('.logo-style-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.logoShape === this.state.logoShape);
    });
    this.livePreview();
  },

  handleLogoUpload(input) {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      this.state.logoDataUrl = e.target.result;
      this.state.logoSize    = 0.22;
      this.state.eccLevel    = 'H';
      document.getElementById('ecc-h')?.classList.add('active');
      document.querySelectorAll('.ecc-btn:not(#ecc-h)').forEach(b => b.classList.remove('active'));
      document.getElementById('logo-preview-wrap')?.classList.remove('hidden');
      const prev = document.getElementById('logo-preview-img');
      if (prev) prev.src = e.target.result;
      this.livePreview();
      App.toast('🖼️', 'Logo uploaded! ECC bumped to Level H.', 'success');
    };
    reader.readAsDataURL(file);
  },

  clearLogo() {
    this.state.logoDataUrl = null;
    document.getElementById('logo-preview-wrap')?.classList.add('hidden');
    const up = document.getElementById('logo-upload-input');
    if (up) up.value = '';
    document.querySelectorAll('.logo-icon-btn').forEach(b => b.classList.remove('selected'));
    this.livePreview();
  },

  toggleDynamic(on) {
    this.state.dynamic = on;
    if (on && !this.state.dynamicSlug) {
      this.state.dynamicSlug = 'qrp-' + Math.random().toString(36).slice(2, 9);
    }
    const shortUrlWrap = document.getElementById('dynamic-url-box');
    if (shortUrlWrap) {
      shortUrlWrap.classList.toggle('hidden', !on);
      const link = document.getElementById('dynamic-short-url');
      if (link && this.state.dynamicSlug) link.textContent = `https://qrforge.io/r/${this.state.dynamicSlug}`;
    }
    this.livePreview();
  },

  setPassword(pw) {
    this.state.password = pw || null;
    const eccHint = document.getElementById('pw-ecc-hint');
    if (pw && pw.length > 0) {
      if (eccHint) eccHint.style.display = 'block';
    } else {
      if (eccHint) eccHint.style.display = 'none';
    }
    this._checkPwStrength(pw);
    this.livePreview();
  },

  _checkPwStrength(pw) {
    const bar = document.getElementById('pw-strength-bar');
    if (!bar) return;
    if (!pw) { bar.style.width = '0'; return; }
    let s = 0;
    if (pw.length > 5) s += 30;
    if (pw.length > 10) s += 25;
    if (/[A-Z]/.test(pw)) s += 20;
    if (/[0-9]/.test(pw)) s += 15;
    if (/[^A-Za-z0-9]/.test(pw)) s += 10;
    bar.style.width = s + '%';
    bar.style.background = s < 35 ? '#f87171' : s < 70 ? '#fbbf24' : '#4ade80';
  },

  // ── Canvas Matrix Fallback Helper ──
  _extractMatrixFromCanvas(canvas) {
    try {
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      const data = ctx.getImageData(0, 0, w, h).data;

      // Scan middle row for transitions to find module count
      const midY = Math.floor(h / 2);
      let trans = 0;
      let lastVal = data[(midY * w + 0) * 4] < 128;
      for (let x = 1; x < w; x++) {
        const val = data[(midY * w + x) * 4] < 128;
        if (val !== lastVal) { trans++; lastVal = val; }
      }
      const count = Math.max(21, Math.min(65, Math.round(trans * 1.5)));
      const step = w / count;

      const matrix = [];
      for (let r = 0; r < count; r++) {
        const row = [];
        const py = Math.floor((r + 0.5) * step);
        for (let c = 0; c < count; c++) {
          const px = Math.floor((c + 0.5) * step);
          const idx = (py * w + px) * 4;
          row.push(data[idx] < 128);
        }
        matrix.push(row);
      }
      return matrix;
    } catch {
      return null;
    }
  },

  // ── Canvas Rounded Rect Helper ──
  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    this._roundRectPath(ctx, x, y, w, h, r);
    ctx.closePath();
  },

  _roundRectPath(ctx, x, y, w, h, r, reverse = false) {
    if (typeof r === 'number') r = [r, r, r, r];
    const [tl, tr, br, bl] = r;
    if (reverse) {
      ctx.moveTo(x + w - tr, y);
      ctx.arcTo(x, y, x, y + h, tl);
      ctx.arcTo(x, y + h, x + w, y + h, bl);
      ctx.arcTo(x + w, y + h, x + w, y, br);
      ctx.arcTo(x + w, y, x, y, tr);
    } else {
      ctx.moveTo(x + tl, y);
      ctx.lineTo(x + w - tr, y);
      ctx.arcTo(x + w, y, x + w, y + tr, tr);
      ctx.lineTo(x + w, y + h - br);
      ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
      ctx.lineTo(x + bl, y + h);
      ctx.arcTo(x, y + h, x, y + h - bl, bl);
      ctx.lineTo(x, y + tl);
      ctx.arcTo(x, y, x + tl, y, tl);
    }
  },
};
