(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  document.querySelectorAll('[data-share-link]').forEach(button => button.addEventListener('click', async () => {
    const status = button.parentElement.querySelector('.share-status');
    if (!/^https?:$/.test(location.protocol)) {
      status.textContent = '本地预览不能共享，请打开发布后的网址。';
      return;
    }
    const url = new URL(location.href); url.searchParams.delete('export');
    try {
      await navigator.clipboard.writeText(url.href);
      status.textContent = '链接已复制，可以发给别人。';
    } catch {
      status.textContent = `请复制此链接：${url.href}`;
    }
  }));
  const gallery = document.querySelector('[data-gallery-layout]');
  if (gallery) {
    document.querySelectorAll('[data-gallery-variant]').forEach(button => button.addEventListener('click', () => {
      const variant = button.dataset.galleryVariant;
      gallery.dataset.galleryLayout = variant;
      document.querySelectorAll('[data-gallery-variant]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      document.querySelectorAll('[data-thumb]').forEach(thumb => { thumb.hidden = thumb.dataset.thumb !== variant; });
      document.querySelectorAll('.preview-link').forEach(link => {
        const target = new URL(link.href); target.searchParams.set('view', variant); link.href = target.href;
      });
      document.querySelectorAll('[data-collect-png]').forEach(link => {
        link.href = `export/${link.dataset.collectPng}-${variant}.png`;
        link.textContent = `↓ 下载${variant === 'a' ? '竖版' : '横版'} PNG`;
      });
      document.querySelectorAll('[data-collect-svg]').forEach(link => { link.href = `export/${link.dataset.collectSvg}-${variant}.svg`; });
    }));
  }

  const viewer = document.querySelector('#viewer');
  if (!viewer) return;
  const slug = document.body.dataset.flow;
  const readingToggle = document.querySelector('#reading-toggle');
  let variant = params.get('view') === 'b' ? 'b' : 'a';
  let reading = params.get('mode') === 'read';
  function updateVariant(next, updateUrl = true) {
    variant = next;
    document.querySelectorAll('[data-variant]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.variant === variant)));
    document.querySelectorAll('[data-variant-panel]').forEach(p => { p.hidden = p.dataset.variantPanel !== variant; });
    document.querySelector('#svg-download').href = `../../export/${slug}-${variant}.svg`;
    document.querySelector('#png-download').href = `../../export/${slug}-${variant}.png`;
    const openPng = document.querySelector('#open-png');
    if (openPng) openPng.href = `../../export/${slug}-${variant}.png`;
    document.querySelector('#size-label').textContent = variant === 'a' ? '1080 × 1350 · 竖版传播版' : '1920 × 1080 · 横版官网版';
    if (updateUrl) {
      const url = new URL(location.href); url.searchParams.set('view', variant);
      try { history.replaceState(null, '', url.href); } catch { /* file:// previews can disallow history mutations */ }
    }
  }
  function updateReading(next) {
    reading = next; document.body.classList.toggle('is-reading', reading);
    readingToggle.setAttribute('aria-pressed', String(reading));
    readingToggle.textContent = reading ? '返回图版' : '清晰阅读';
    const url = new URL(location.href);
    if (reading) url.searchParams.set('mode', 'read'); else url.searchParams.delete('mode');
    try { history.replaceState(null, '', url.href); } catch { /* see updateVariant */ }
  }
  document.querySelectorAll('[data-variant]').forEach(button => button.addEventListener('click', () => {
    updateVariant(button.dataset.variant); updateReading(false);
  }));
  readingToggle.addEventListener('click', () => updateReading(!reading));
  window.addEventListener('popstate', () => {
    const p = new URLSearchParams(location.search); updateVariant(p.get('view') === 'b' ? 'b' : 'a', false); updateReading(p.get('mode') === 'read');
  });
  updateVariant(variant, false); updateReading(reading);

  if (params.has('export')) document.body.classList.add('export-mode');

  // A self-contained SVG, with only vector primitives and text, is rendered at 2×.
  // Normal PNG downloads use the pre-rendered delivery files, preserving approved typography.
  document.querySelector('#png-hd').addEventListener('click', async event => {
    const button = event.currentTarget, status = document.querySelector('#export-status');
    const exportVariant = variant;
    button.disabled = true; status.textContent = '正在生成高清 PNG…';
    try {
      await document.fonts.ready;
      const svg = document.querySelector(`[data-variant-panel="${exportVariant}"] svg`).cloneNode(true);
      const width = Number(svg.getAttribute('width')), height = Number(svg.getAttribute('height'));
      // The official site's image policy allows data URLs, keeping export local.
      const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg));
      const image = new Image();
      await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = svgUrl; });
      const canvas = document.createElement('canvas'); canvas.width = width * 2; canvas.height = height * 2;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('无法创建绘图画布');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('PNG 生成失败')), 'image/png'));
      const pngUrl = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = pngUrl; link.download = `${slug}-${exportVariant}@2x.png`; link.click();
      setTimeout(() => URL.revokeObjectURL(pngUrl), 10000);
      status.textContent = `已生成 ${width * 2} × ${height * 2} 高清 PNG。`;
    } catch (error) {
      status.textContent = '高清导出失败，请使用“下载 PNG”获取标准图版。';
      console.error('PNG export failed:', error);
    } finally {
      button.disabled = false;
    }
  });
})();
