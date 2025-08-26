(function(global){
  function showResult(resultObj){
    const res = document.getElementById('qr-result');
    const meta = document.getElementById('result-meta');
    if(!resultObj){
      res.textContent = 'QR не найден';
      meta.textContent = 'Сканирование завершено — нет данных.';
      meta.style.color = '#b53c3c';
      animatePulse(res);
      return;
    }
    res.textContent = resultObj.text || String(resultObj);
    meta.textContent = 'Время: ' + (resultObj.time ? resultObj.time + ' мс' : '—');
    meta.style.color = '#2b7cff';
    // copy to clipboard suggestion animation
    animateCopyHint(res);
  }

  function animatePulse(el){
    el.animate([{transform:'scale(1)'},{transform:'scale(1.06)'},{transform:'scale(1)'}],{duration:420});
  }

  function animateCopyHint(el){
    // краткое моргание и подсказка
    const a = el.animate([{opacity:1},{opacity:0.6},{opacity:1}],{duration:520});
    a.onfinish = ()=>{/* nothing */};
  }

  global.showResult = showResult;
})(window);
