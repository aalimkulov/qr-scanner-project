export function playBeepIfEnabled(enabled=true){
  if(!enabled) return;
  try{
    const audio = new Audio('assets/beep.wav');
    audio.play().catch(()=>{/* автоплей может блокироваться */});
  }catch(e){
    console.warn('sound play error', e);
  }
}
