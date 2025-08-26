async function scanQR(imageData) {
  const qrScanner = new QrScanner(
    document.createElement("video"),
    () => {},
    { returnDetailedScanResult: true }
  );
  return await QrScanner.scanImage(imageData).catch(() => null);
}
