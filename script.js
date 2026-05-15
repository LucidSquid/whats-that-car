const dropInput = document.querySelector(".drop-input");
const defaultState = document.getElementById("default-state");
const previewState = document.getElementById("preview-state");
const previewImage = document.getElementById("preview-image");
const results = document.getElementById("results");
const fileInput = document.getElementById("file-input");

let currentFile;

// File handling

window.addEventListener("paste", (event) => {
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const pastedFile = items[i].getAsFile();
            loadFile(pastedFile);
        }
    }
});

dropInput.addEventListener("click", () => {
    fileInput.click();
});

dropInput.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropInput.classList.add("drag-over");
});

dropInput.addEventListener("dragleave", () => {
    dropInput.classList.remove("drag-over");
});

dropInput.addEventListener("drop", (event) => {
    event.preventDefault();
    dropInput.classList.remove("drag-over");
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith("image/"))
        loadFile(file);
});

fileInput.addEventListener("change", (event) => {
    let file = event.target.files[0];
    loadFile(file);
    console.log("Current file is now", currentFile);
});

function loadFile(file) {
    currentFile = file;
    previewImage.src = URL.createObjectURL(file);
    defaultState.style.display = 'none';
    previewState.style.display = 'flex';
    results.style.display = 'block';

    
    // const reader = new FileReader();
    // reader.onload = (e) => {
    //     previewImage.src = e.target.result;
    //     previewName.textContent = file.name;
    //     dropDefault.style.display = 'none';
    //     previewState.style.display = 'flex';
    // };
}

// ONNX.js

