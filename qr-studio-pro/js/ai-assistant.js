'use strict';

const AIAssistant = {
  open() {
    const overlay = document.getElementById('ai-overlay');
    if (!overlay) return;
    const name = window.App?.state?.user?.name?.trim()?.split(/\s+/)[0] || 'Creator';
    const greeting = document.getElementById('ai-greeting');
    if (greeting) greeting.textContent = `Hello ${name}! What would you like to create or understand?`;
    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('show'));
  },

  close() {
    const overlay = document.getElementById('ai-overlay');
    if (!overlay) return;
    overlay.classList.remove('show');
    setTimeout(() => { overlay.style.display = 'none'; }, 300);
  },

  answer(text) {
    const output = document.getElementById('ai-answer');
    if (output) output.textContent = text;
  },

  explainQR() {
    const state = QREngine.state;
    const type = QRTypes.list.find(item => item.id === state.currentType)?.label || state.currentType;
    const logoAdvice = state.logoDataUrl ? 'A logo is enabled, so ECC is kept at the stronger H level.' : 'No logo is enabled, so you can use any ECC level.';
    this.answer(`This is a ${type} QR code. It uses ECC-${state.eccLevel}, ${state.dotStyle} modules, and a ${state.eyeOuter} outer eye with a ${state.eyeInner} inner eye. ${logoAdvice}\n\nFor the most reliable scanning: keep strong contrast, leave a clear quiet zone around the code, and test the exported image on more than one phone.`);
  },

  explainFileShare() {
    this.answer('File sharing uploads the selected file to the local QRForge backend, which returns a download URL. The QR code stores that URL, not the file itself. The current server accepts files up to 500 MB. Keep the server running while people need to download the file. For public sharing, deploy the backend with HTTPS and persistent storage.');
  },

  suggestDesign() {
    const state = QREngine.state;
    const hasLogo = Boolean(state.logoDataUrl);
    this.answer(`Suggested design:\n\n1. Use ECC-H${hasLogo ? ' because your logo is enabled' : ' if you plan to add a logo'}.\n2. Keep the foreground dark and the background light for dependable scanning.\n3. Try rounded modules with an extra-rounded eye for a modern look.\n4. Use a logo no larger than about 22% of the QR canvas.\n5. Test the final PNG or SVG before printing or sharing.`);
  },

  ask() {
    const question = document.getElementById('ai-question')?.value.trim().toLowerCase();
    if (!question) {
      this.answer('Ask a question about QR design, scanning, file sharing, encryption, exports, or the current settings.');
      return;
    }

    if (/file|upload|500|share/.test(question)) return this.explainFileShare();
    if (/logo|brand|design|color|style|eye|dot/.test(question)) return this.suggestDesign();
    if (/encrypt|password|secure|safe/.test(question)) {
      return this.answer('Use password protection for sensitive text, then test the encrypted QR with the built-in scanner. Never put passwords or private keys directly into an ordinary unencrypted QR code.');
    }
    if (/scan|camera|accuracy|read/.test(question)) {
      return this.answer('For reliable scanning, use high contrast, a quiet margin, ECC-M or higher, and avoid covering finder eyes or too much of the center with a logo. Test on a real phone camera before sharing.');
    }
    if (/export|png|svg|webp|download/.test(question)) {
      return this.answer('Use PNG for general sharing, SVG for print and design tools, and WebP for smaller web assets. Always scan the exported file rather than only the live preview.');
    }
    this.answer('I can explain QR types, logo and eye settings, scanning reliability, encryption, exports, and 500 MB file sharing. Cloud image generation and web image search are not included in the free local mode.');
  },

  previewImage(input) {
    const file = input.files?.[0];
    const preview = document.getElementById('ai-image-preview');
    if (!file || !preview || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = event => {
      preview.src = event.target.result;
      preview.classList.remove('hidden');
      const logoInput = document.getElementById('logo-upload-input');
      if (logoInput) {
        const transfer = new DataTransfer();
        transfer.items.add(file);
        logoInput.files = transfer.files;
        QREngine.handleLogoUpload(logoInput);
      }
    };
    reader.readAsDataURL(file);
  }
};
