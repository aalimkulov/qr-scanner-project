// Главная логика: связываем uploader и scanner, статистику и звук
(function(){
  // expose handler so preview items can trigger rescans
  window.__HANDLE_IMAGE__ = async function(dataUrl){
    document.getElementById('qr-result').textContent = 'Сканирую...';
    const start = performance.now();
    const res = await scanQR(dataUrl);
    if(res && res.text){
      // update UI
      showResult(res);
      // play sound if enabled
      const enabled = document.getElementById('sound-enabled').checked;
      try { playBeepIfEnabled(enabled); } catch(e){}
    } else {
      showResult(null);
    }
    // update imports count display (simple)
    const cur = window.__QR_STATS__?.imports || 0;
    document.getElementById('stat-imports').textContent = cur;
  };

  // init uploader
  initUploader(window.__HANDLE_IMAGE__);

  // small animation when hovering drop area
  const drop = document.getElementById('drop-area');
  drop.addEventListener('click', ()=> drop.classList.add('click-anim'));
  drop.addEventListener('animationend', ()=> drop.classList.remove('click-anim'));

  // keyboard paste fallback (Ctrl+V)
  document.addEventListener('keydown', (e)=>{
    if((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==='v'){
      // hint the user to use paste button; actual paste handled by 'paste' event in uploader
      drop.animate([{transform:'scale(1)'},{transform:'scale(1.02)'}],{duration:200});
    }
  });

  // initial stats fill
  document.getElementById('stat-imports').textContent = window.__QR_STATS__?.imports || 0;
  document.getElementById('stat-success').textContent = window.__QR_STATS__?.success || 0;
  document.getElementById('stat-fail').textContent = window.__QR_STATS__?.fail || 0;
  document.getElementById('stat-avg').textContent = 0;

  // helpful UX: click QR-result to copy
  document.getElementById('qr-result').addEventListener('click', async ()=>{
    const text = document.getElementById('qr-result').textContent;
    if(!text || text==='—' || text==='QR не найден') return;
    try{
      await navigator.clipboard.writeText(text);
      const old = document.getElementById('result-meta').textContent;
      document.getElementById('result-meta').textContent = 'Скопировано в буфер';
      setTimeout(()=> document.getElementById('result-meta').textContent = old, 1200);
    }catch(e){
      console.warn('copy failed', e);
    }
  });

})();
