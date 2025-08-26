initUploader(handleImage);
initURLLoader(handleImage);
initPasteHandler(handleImage);

function handleImage(image) {
  scanQR(image).then(result => {
    if (result) {
      document.getElementById("qr-result").textContent = result;
      playBeep();
    } else {
      document.getElementById("qr-result").textContent = "QR не найден";
    }
  });
}
