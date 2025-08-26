function initUploader(callback) {
  const dropArea = document.getElementById("drop-area");
  const fileInput = document.getElementById("file-input");

  dropArea.addEventListener("click", () => fileInput.click());
  dropArea.addEventListener("dragover", e => {
    e.preventDefault();
    dropArea.classList.add("dragover");
  });
  dropArea.addEventListener("dragleave", () => dropArea.classList.remove("dragover"));
  dropArea.addEventListener("drop", e => {
    e.preventDefault();
    dropArea.classList.remove("dragover");
    if (e.dataTransfer.files.length) {
      loadFile(e.dataTransfer.files[0], callback);
    }
  });

  fileInput.addEventListener("change", e => {
    if (e.target.files.length) {
      loadFile(e.target.files[0], callback);
    }
  });
}

function initPasteHandler(callback) {
  document.getElementById("paste-btn").addEventListener("click", async () => {
    const items = await navigator.clipboard.read();
    for (let item of items) {
      for (let type of item.types) {
        if (type.startsWith("image/")) {
          const blob = await item.getType(type);
          loadFile(blob, callback);
          return;
        }
      }
    }
  });
}

function initURLLoader(callback) {
  document.getElementById("url-btn").addEventListener("click", () => {
    const url = document.getElementById("url-input").value;
    if (url) {
      loadImage(url, callback);
    }
  });
}

function loadFile(file, callback) {
  const reader = new FileReader();
  reader.onload = e => callback(e.target.result);
  reader.readAsDataURL(file);
}

function loadImage(url, callback) {
  callback(url);
}
