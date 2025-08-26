// Скрипт, использующий qr-scanner library (qr-scanner.min.js)
// Предполагается, что QrScanner глобально доступен (в libs/qr-scanner.min.js)
(function(global){
  const stats = global.__QR_STATS__ || (global.__QR_STATS__ = {});
  stats.success = 0;
  stats.fail = 0;
  stats.times = [];

  async function scanQR(dataUrl){
    // start timer
    const t0 = performance.now();
    try{
      // QrScanner.scanImage умеет принимать data URL, URL, или элемент
      const result = await QrScanner.scanImage(dataUrl, {returnDetailedScanResult: false});
      const t1 = performance.now();
      const dt = Math.round(t1 - t0);
      stats.times.push(dt);
      stats.success = (stats.success || 0) + 1;
      updateStatsUI();
      return {text: result, time: dt};
    }catch(err){
      const t1 = performance.now();
      const dt = Math.round(t1 - t0);
      stats.times.push(dt);
      stats.fail = (stats.fail || 0) + 1;
      updateStatsUI();
      return null;
    }
  }

  function avgTimes(){
    if(!stats.times || stats.times.length===0) return 0;
    const sum = stats.times.reduce((a,b)=>a+b,0);
    return Math.round(sum / stats.times.length);
  }

  function updateStatsUI(){
    document.getElementById('stat-success').textContent = stats.success || 0;
    document.getElementById('stat-fail').textContent = stats.fail || 0;
    document.getElementById('stat-avg').textContent = avgTimes();
  }

  global.scanQR = scanQR;
})(window);
