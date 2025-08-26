// Uploader: drag & drop, file input, paste, URL, cloud share link handling
// Экспортируем функции для инициализации
(function(global){
  const stats = global.__QR_STATS__ || (global.__QR_STATS__ = {});
  stats.imports = 0;

  function initUploader(onImage){
    const dropArea = document.getElementById('drop-area');
    const choose = document.getElementById('choose-file');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    dropArea.addEventListener('dragover', e=>{
      e.preventDefault();
      dropArea.classList.add('dragover');
      setProgress(10);
    });
    dropArea.addEventListener('dragleave', ()=>{ dropArea.classList.remove('dragover'); setProgress(0); });
    dropArea.addEventListener('drop', e=>{
      e.preventDefault(); dropArea.classList.remove('dragover');
      const f = e.dataTransfer.files && e.dataTransfer.files[0];
      if(f) { handleFile(f, onImage); }
    });

    choose.addEventListener('click', ()=> fileInput.click());
    fileInput.addEventListener('change', ()=> {
      if(fileInput.files && fileInput.files[0]) handleFile(fileInput.files[0], onImage);
    });

    // paste via keyboard clipboard API
    document.addEventListener('paste', async (ev)=>{
      try{
        const items = ev.clipboardData && ev.clipboardData.items;
        if(!items) return;
        for(const it of items){
          if(it.type && it.type.startsWith('image/')){
            const blob = it.getAsFile();
            await createFlyingThumbFromBlob(blob);
            handleFile(blob, onImage);
            return;
          }
        }
      }catch(e){ console.warn('paste error', e); }
    });

    // paste button uses async clipboard.read() if available
    const pasteBtn = document.getElementById('paste-btn');
    pasteBtn.addEventListener('click', async ()=>{
      if(navigator.clipboard && navigator.clipboard.read){
        try{
          const items = await navigator.clipboard.read();
          for(const item of items){
            for(const type of item.types){
              if(type.startsWith('image/')){
                const blob = await item.getType(type);
                await createFlyingThumbFromBlob(blob);
                handleFile(blob, onImage);
                return;
              }
            }
          }
          alert('В буфере нет изображения или сайт не разрешил доступ к буферу.');
        }catch(e){
          alert('Невозможно прочитать буфер напрямую (ограничения браузера). Попробуй Ctrl+V.');
        }
      }else{
        alert('API буфера недоступен в этом браузере. Попробуй Ctrl+V или вставь изображение вручную.');
      }
    });

    // URL loader
    const urlBtn = document.getElementById('url-btn');
    urlBtn.addEventListener('click', ()=>{
      const url = document.getElementById('url-input').value.trim();
      if(!url) return;
      const direct = tryResolveCloudUrlToDirectDownload(url);
      fetchImageAsDataUrl(direct).then(dataUrl=>{
        addPreview(dataUrl, 'url');
        onImage(dataUrl);
      }).catch(e=>{
        alert('Не удалось загрузить изображение по ссылке: '+e.message);
      });
    });

    // cloud import buttons
    document.querySelectorAll('.cloud-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const svc = btn.dataset.service;
        const raw = prompt('Вставь share-ссылку ' + svc);
        if(!raw) return;
        const direct = tryResolveCloudUrlToDirectDownload(raw);
        fetchImageAsDataUrl(direct).then(dataUrl=>{
          addPreview(dataUrl, svc);
          onImage(dataUrl);
        }).catch(e=> alert('Ошибка загрузки: '+e.message));
      });
    });

    // clear history
    document.getElementById('clear-history').addEventListener('click', ()=>{
      document.getElementById('preview-list').innerHTML = '';
      updateStat('imports', 0);
    });
  }

  /* helpers */
  function handleFile(fileOrBlob, onImage){
    setProgress(20);
    const reader = new FileReader();
    reader.onload = e=>{
      const dataUrl = e.target.result;
      addPreview(dataUrl, 'local');
      updateStat('imports', (window.__QR_STATS__?.imports || 0) + 1);
      onImage(dataUrl);
      setProgress(0);
    };
    reader.readAsDataURL(fileOrBlob);
  }

  function fetchImageAsDataUrl(url){
    setProgress(30);
    return fetch(url, {mode:'cors'}).then(r=>{
      if(!r.ok) throw new Error('HTTP '+r.status);
      return r.blob();
    }).then(blob => new Promise((res, rej)=>{
      const rd = new FileReader();
      rd.onload = ()=> res(rd.result);
      rd.onerror = rej;
      rd.readAsDataURL(blob);
    })).finally(()=> setProgress(0));
  }

  function addPreview(dataUrl, tag){
    const list = document.getElementById('preview-list');
    const item = document.createElement('div');
    item.className = 'preview-item';
    const img = document.createElement('img');
    img.src = dataUrl;
    const cap = document.createElement('div');
    cap.className = 'caption';
    cap.textContent = tag + ' · ' + new Date().toLocaleTimeString();
    item.appendChild(img);
    item.appendChild(cap);
    list.prepend(item);

    // clicking preview triggers re-scan
    item.addEventListener('click', ()=> {
      // tiny pulse animation
      item.animate([{transform:'scale(1)'},{transform:'scale(0.98)'},{transform:'scale(1)'}],{duration:220});
      document.querySelector('#qr-result').textContent = 'Сканирую...';
      // call global handler if exists
      if(window.__HANDLE_IMAGE__) window.__HANDLE_IMAGE__(dataUrl);
    });
  }

  function tryResolveCloudUrlToDirectDownload(raw){
    // Google Drive share links -> direct:
    // https://drive.google.com/file/d/FILEID/view?usp=sharing  => https://drive.google.com/uc?export=download&id=FILEID
    // https://drive.google.com/open?id=FILEID -> same
    // Dropbox: https://www.dropbox.com/s/xxxxx/filename.png?dl=0 -> ?dl=1
    // OneDrive: https://1drv.ms/u/s!xxx -> try appending &download=1 or converting to direct via ?download=1
    try{
      const u = new URL(raw);
      const host = u.hostname.toLowerCase();
      if(host.includes('drive.google.com')){
        // extract id
        const m = raw.match(/\/d\/([^/]+)/) || raw.match(/[?&]id=([^&]+)/);
        if(m && m[1]) return `https://drive.google.com/uc?export=download&id=${m[1]}`;
      }
      if(host.includes('dropbox.com')){
        // change dl=0 to dl=1
        if(u.searchParams.has('dl')) u.searchParams.set('dl','1');
        else u.searchParams.set('raw','1');
        u.hash = '';
        return u.toString();
      }
      if(host.includes('1drv.ms') || host.includes('onedrive.live.com')){
        // OneDrive short links often redirect to real file - fetch will follow redirect
        // but try to use ?download=1
        if(!u.searchParams.has('download')) u.searchParams.set('download','1');
        return u.toString();
      }
      // fallback: return original
      return raw;
    }catch(e){
      return raw;
    }
  }

  function setProgress(pct){
    const fill = document.querySelector('.progress-fill');
    if(fill) fill.style.width = Math.max(0, Math.min(100, pct)) + '%';
  }

  async function createFlyingThumbFromBlob(blob){
    // create temporary image element, place at mouse location center-ish, fly to center
    try{
      const url = URL.createObjectURL(blob);
      const img = document.createElement('img');
      img.className = 'flying-thumb';
      img.src = url;
      document.body.appendChild(img);
      // place at center of viewport top-left as fallback
      img.style.left = (window.innerWidth/2 - 60) + 'px';
      img.style.top = (window.innerHeight/2 - 60) + 'px';
      // small delay to paint
      await new Promise(r=>setTimeout(r,50));
      img.style.setProperty('--x','0px');
      img.style.setProperty('--y','0px');
      img.classList.add('to-center');
      // keep for animation, then remove
      setTimeout(()=>{ img.remove(); URL.revokeObjectURL(url); }, 700);
    }catch(e){ console.warn('fly thumb err', e); }
  }

  function updateStat(key, value){
    window.__QR_STATS__ = window.__QR_STATS__ || {};
    window.__QR_STATS__[key] = value;
    document.getElementById('stat-' + key).textContent = value;
  }

  // expose
  global.initUploader = initUploader;
  global.tryResolveCloudUrlToDirectDownload = tryResolveCloudUrlToDirectDownload;
  global.updateStat = updateStat;
})(window);
