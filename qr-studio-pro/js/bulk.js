/* ============================================================
   QRForge Pro – Bulk Generator & ZIP Export
   ============================================================ */

'use strict';

const Bulk = {
  items:     [],    // { label, data }
  rendered:  [],   // { label, dataUrl }

  // ── Load JSZip dynamically ──
  async _loadJSZip() {
    if (window.JSZip) return;
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src    = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
      s.onload = resolve;
      s.onerror= reject;
      document.head.appendChild(s);
    });
  },

  // ── Parse CSV ──
  parseCSV(input) {
    const reader = new FileReader();
    reader.onload = e => {
      const lines = e.target.result.split('\n').filter(l => l.trim());
      const rows = lines.slice(1).map(l => {
        const cols = l.split(',');
        return {
          label: (cols[0] || '').trim(),
          data:  (cols[1] || cols[0] || '').trim(),
        };
      }).filter(r => r.data);

      this.items = rows.slice(0, 200);
      this._updateItemCount();
      this._renderBulkList();
      App.toast('📂', `Loaded ${this.items.length} rows from CSV`, 'success');
    };
    reader.readAsText(input.files[0]);
  },

  // ── Parse Textarea (one entry per line) ──
  parseTextarea() {
    const val = document.getElementById('bulk-textarea')?.value || '';
    const lines = val.split('\n').map(l => l.trim()).filter(Boolean);
    this.items = lines.slice(0, 200).map((l, i) => ({ label: `Item ${i + 1}`, data: l }));
    this._updateItemCount();
    this._renderBulkList();
    App.toast('✅', `${this.items.length} items loaded`, 'success');
  },

  _updateItemCount() {
    const el = document.getElementById('bulk-count');
    if (el) el.textContent = this.items.length;
  },

  // ── Render preview list (before generation) ──
  _renderBulkList() {
    const list = document.getElementById('bulk-input-list');
    if (!list) return;
    list.innerHTML = this.items.slice(0, 20).map((item, i) => `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
        <span class="text-muted text-xs" style="min-width:28px">#${i + 1}</span>
        <span class="text-sm truncate" style="flex:1">${item.data}</span>
        <button class="btn btn-icon" onclick="Bulk.removeItem(${i})" style="flex-shrink:0">✕</button>
      </div>`).join('') + (this.items.length > 20 ? `<div class="text-muted text-xs" style="padding:8px 0">…and ${this.items.length - 20} more</div>` : '');
  },

  removeItem(i) {
    this.items.splice(i, 1);
    this._updateItemCount();
    this._renderBulkList();
  },

  // ── Generate All QR Codes ──
  async generateAll() {
    if (!this.items.length) {
      App.toast('⚠️', 'No items to generate', 'warn'); return;
    }

    const btn = document.getElementById('bulk-gen-btn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spin">⚙️</span> Generating…'; }
    App.showProgress();

    this.rendered = [];
    const grid = document.getElementById('bulk-grid');
    if (grid) {
      grid.innerHTML = '';
      grid.style.display = 'grid';
    }

    const eccLevel = QREngine.state.eccLevel || 'M';
    const fg       = QREngine.state.fgColor  || '#000000';
    const bg       = QREngine.state.bgColor  || '#ffffff';

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const dataUrl = await this._renderQRToDataUrl(item.data, fg, bg, eccLevel, 200);
      this.rendered.push({ label: item.label, data: item.data, dataUrl });

      if (grid) {
        const el = document.createElement('div');
        el.className = 'bulk-item animate-scaleIn';
        el.style.animationDelay = `${i * 0.04}s`;
        el.innerHTML = `
          <img src="${dataUrl}" alt="${item.label}" style="width:90px;height:90px;border-radius:6px;background:white"/>
          <div class="bulk-label">${item.label || item.data.slice(0, 20)}</div>
          <button class="btn btn-icon" title="Download" onclick="Bulk.downloadSingle(${i})" style="margin-top:4px">⬇️</button>
        `;
        grid.appendChild(el);
      }

      // Update progress
      App.setProgress((i + 1) / this.items.length * 100);
      // Yield to browser for rendering
      if (i % 5 === 0) await new Promise(r => setTimeout(r, 0));
    }

    document.getElementById('bulk-download-bar')?.classList.remove('hidden');
    App.hideProgress();
    if (btn) { btn.disabled = false; btn.textContent = '✨ Generate All QR Codes'; }
    App.toast('✅', `${this.items.length} QR codes generated!`, 'success');
  },

  // ── Render single QR to Data URL ──
  _renderQRToDataUrl(data, fg, bg, ecc, size) {
    return new Promise(resolve => {
      const tmp = document.createElement('div');
      tmp.style.cssText = 'position:absolute;left:-9999px;top:-9999px;visibility:hidden;';
      document.body.appendChild(tmp);
      try {
        new QRCode(tmp, {
          text: data,
          width:  size,
          height: size,
          colorDark:  fg,
          colorLight: bg,
          correctLevel: QRCode.CorrectLevel[ecc] || QRCode.CorrectLevel.M,
        });
        const canvas = tmp.querySelector('canvas');
        if (canvas) {
          const url = canvas.toDataURL('image/png');
          tmp.remove();
          resolve(url);
          return;
        }
        const img = tmp.querySelector('img');
        if (img && img.src) {
          const url = img.src;
          tmp.remove();
          resolve(url);
          return;
        }
        tmp.remove();
        resolve('');
      } catch {
        tmp.remove();
        resolve('');
      }
    });
  },

  // ── Download Single ──
  downloadSingle(i) {
    const item = this.rendered[i];
    if (!item?.dataUrl) return;
    const a = document.createElement('a');
    a.href     = item.dataUrl;
    a.download = `qrpro-${item.label || i + 1}.png`;
    a.click();
  },

  // ── Download all as ZIP ──
  async downloadZip() {
    if (!this.rendered.length) {
      App.toast('⚠️', 'Generate QR codes first', 'warn'); return;
    }

    const btn = document.getElementById('bulk-zip-btn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Building ZIP…'; }

    try {
      await this._loadJSZip();
      const zip = new JSZip();
      const folder = zip.folder('qrpro-bulk');

      for (const item of this.rendered) {
        if (!item.dataUrl) continue;
        const base64 = item.dataUrl.split(',')[1];
        const fname  = `${item.label.replace(/[^a-zA-Z0-9]/g, '_') || 'qr'}.png`;
        folder.file(fname, base64, { base64: true });
      }

      // Add CSV manifest
      const csv = 'Label,Data\n' + this.rendered.map(i => `"${i.label}","${i.data}"`).join('\n');
      folder.file('manifest.csv', csv);

      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `qrpro-bulk-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      App.toast('⬇️', `Downloaded ZIP with ${this.rendered.length} QR codes!`, 'success');
    } catch (e) {
      console.error(e);
      App.toast('❌', 'ZIP export failed. JSZip may not be available.', 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '⬇️ Download All as ZIP'; }
    }
  },

  // ── Print Sheet ──
  printSheet() {
    if (!this.rendered.length) { App.toast('⚠️', 'Generate first', 'warn'); return; }
    const win = window.open('', '_blank');
    const cols = parseInt(document.getElementById('print-cols')?.value || 3);
    const rows = parseInt(document.getElementById('print-rows')?.value || 3);
    const perPage = cols * rows;

    const pages = [];
    for (let i = 0; i < this.rendered.length; i += perPage) {
      pages.push(this.rendered.slice(i, i + perPage));
    }

    const style = `
      body { margin: 0; font-family: Inter, sans-serif; }
      .page { display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: 12px; padding: 20px; page-break-after: always; }
      .item { text-align: center; padding: 10px; border: 1px solid #e0e0e0; border-radius: 8px; }
      .item img { width: 120px; height: 120px; display: block; margin: 0 auto 8px; }
      .item div { font-size: 11px; color: #555; word-break: break-all; }
      @media print { body { -webkit-print-color-adjust: exact; } }
    `;

    win.document.write(`<!DOCTYPE html><html><head><title>QRForge Pro – Print Sheet</title><style>${style}</style></head><body>`);
    pages.forEach(page => {
      win.document.write('<div class="page">');
      page.forEach(item => {
        win.document.write(`<div class="item"><img src="${item.dataUrl}"><div>${item.label || item.data.slice(0, 30)}</div></div>`);
      });
      win.document.write('</div>');
    });
    win.document.write('</body></html>');
    win.document.close();
    win.onload = () => win.print();
  },
};


/* ============================================================
   QRForge Pro – Analytics Dashboard
   ============================================================ */

const Analytics = {
  load() {
    const qrs  = App.state.savedQRs;
    const scans = App.state.scanHistory;

    const totalQRs  = qrs.length;
    const totalScans = scans.length + qrs.reduce((s, q) => s + (q.scans || 0), 0);
    const dynamicCount = qrs.filter(q => q.dynamic).length;
    const avgScans = totalQRs > 0 ? (totalScans / totalQRs).toFixed(1) : 0;

    // Update KPI cards
    this._setKPI('kpi-total-scans',  totalScans.toLocaleString());
    this._setKPI('kpi-total-qrs',    totalQRs.toLocaleString());
    this._setKPI('kpi-dynamic',      dynamicCount.toLocaleString());
    this._setKPI('kpi-avg-scans',    avgScans);

    // Render charts
    this._renderWeeklyChart(scans);
    this._renderTypeBreakdown(qrs);
    this._renderTopQRTable(qrs);
    this._renderRecentScans(scans);
  },

  _setKPI(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  },

  _renderWeeklyChart(scans) {
    const chart = document.getElementById('weekly-chart');
    if (!chart) return;

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = [0, 0, 0, 0, 0, 0, scans.length];
    const max  = Math.max(...data, 1);

    chart.innerHTML = data.map((v, i) => `
      <div class="bar-item">
        <div class="bar-fill"><div class="bar-rect" style="height:${Math.round(v/max*100)}%"></div></div>
        <div class="bar-label">${days[i]}</div>
        <div class="bar-val">${v}</div>
      </div>`).join('');
  },

  _renderTypeBreakdown(qrs) {
    const el = document.getElementById('type-breakdown');
    if (!el) return;
    const counts = {};
    qrs.forEach(q => { counts[q.type] = (counts[q.type] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const total  = qrs.length || 1;

    if (!sorted.length) { el.innerHTML = '<div class="text-muted text-sm">No data yet</div>'; return; }

    const colors = ['var(--accent)', 'var(--teal)', 'var(--pink)', 'var(--amber)', 'var(--green)', 'var(--orange)'];
    el.innerHTML = sorted.map(([type, count], i) => {
      const pct = Math.round(count / total * 100);
      const typeInfo = QRTypes.list.find(t => t.id === type);
      return `
        <div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:4px">
            <span>${typeInfo?.icon || '⬛'} ${typeInfo?.label || type}</span>
            <span style="color:var(--text3)">${count} (${pct}%)</span>
          </div>
          <div style="height:6px;background:var(--surface3);border-radius:99px">
            <div style="width:${pct}%;height:100%;background:${colors[i]};border-radius:99px;transition:width 0.8s ease"></div>
          </div>
        </div>`;
    }).join('');
  },

  _renderTopQRTable(qrs) {
    const el = document.getElementById('top-qr-table');
    if (!el) return;
    if (!qrs.length) {
      el.innerHTML = '<tr><td colspan="5" style="padding:20px;text-align:center;color:var(--text3)">No QR codes yet</td></tr>';
      return;
    }
    el.innerHTML = qrs.slice(0, 8).map(q => {
      const type = QRTypes.list.find(t => t.id === q.type);
      return `
        <tr style="border-bottom:1px solid var(--border)">
          <td style="padding:10px 12px;font-weight:600">${q.name}</td>
          <td style="padding:10px 12px;color:var(--text3)">${type?.icon || ''} ${type?.label || q.type}</td>
          <td style="padding:10px 12px">
            <span class="badge ${q.dynamic ? 'badge-dynamic' : 'badge-static'}">${q.dynamic ? 'Dynamic' : 'Static'}</span>
            ${q.password ? '<span class="badge badge-locked" style="margin-left:4px">🔒</span>' : ''}
          </td>
          <td style="padding:10px 12px;color:var(--green);font-weight:600;text-align:right">${q.scans || 0}</td>
          <td style="padding:10px 12px;color:var(--text3);text-align:right">${q.created}</td>
        </tr>`;
    }).join('');
  },

  _renderRecentScans(scans) {
    const el = document.getElementById('recent-scans-list');
    if (!el) return;
    if (!scans.length) {
      el.innerHTML = '<div class="text-muted text-sm" style="text-align:center;padding:1rem">No scans yet</div>';
      return;
    }
    el.innerHTML = scans.slice(0, 5).map(s => `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
        <span style="font-size:1.2rem">${Scanner._typeIcon(s.type)}</span>
        <div style="flex:1;min-width:0">
          <div class="text-sm truncate">${s.text}</div>
          <div class="text-xs text-muted">${s.type} · ${s.time}</div>
        </div>
      </div>`).join('');
  },
};
