const dropInput = document.querySelector(".drop-input");
const defaultState = document.getElementById("default-state");
const previewState = document.getElementById("preview-state");
const previewImage = document.getElementById("preview-image");
const resultSpinner = document.getElementById("result-spinner");
const results = document.getElementById("results");
const makeValue = document.getElementById("make-value");
const modelValue = document.getElementById("model-value");
const fileInput = document.getElementById("file-input");

let currentImageFile;
let make;
let model;

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
});

function loadFile(file) {
    currentImageFile = file;

    previewImage.onload = async () => {
        defaultState.style.display = 'none';
        previewState.style.display = 'flex';
        results.style.display = "none";

        await runModel(previewImage);
        
        displayResults();
    };

    previewImage.src = URL.createObjectURL(file);
}

function setMakeAndModel(predictedName) {
    make = predictedName.split('_')[0];

    let modelCharIndex = predictedName.indexOf('_') + 1;
    let rawModelName = predictedName.substring(modelCharIndex);
    model = rawModelName.replaceAll("_", " ");
}

function displayResults() {
    results.style.display = "flex";

    makeValue.textContent = make;
    modelValue.textContent = model;
}

// ONNX Runtime Web

let session;
let classNames = [];

async function loadModel() {
    session = await ort.InferenceSession.create("model/model.onnx");
    console.log("ONNX model loaded");
}

async function loadClasses() {
    const response = await fetch("model/classes.json");
    classNames = await response.json();

    console.log("Classes loaded:", classNames.length);
}

const modelPromise = loadModel();
const classesPromise = loadClasses();

async function runModel(imageElement) {
    resultSpinner.style.display = "flex";
    
    await new Promise(resolve => {
        requestAnimationFrame(() => {
            requestAnimationFrame(resolve);
        });
    });

    // Wait for model + classes to finish loading
    await Promise.all([modelPromise, classesPromise]);

    // Create hidden canvas
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = 224;
    canvas.height = 224;

    // Resize image to 224x224
    ctx.drawImage(imageElement, 0, 0, 224, 224);

    // Get pixel data
    const imageData = ctx.getImageData(0, 0, 224, 224);
    const { data } = imageData;

    // Create Float32Array for tensor
    // Shape: [1, 3, 224, 224]
    const floatData = new Float32Array(1 * 3 * 224 * 224);

    // ImageNet normalization
    const mean = [0.485, 0.456, 0.406];
    const std = [0.229, 0.224, 0.225];

    // Convert RGBA -> normalized CHW tensor
    for (let y = 0; y < 224; y++) {
        for (let x = 0; x < 224; x++) {
            const pixelIndex = (y * 224 + x) * 4;

            const r = data[pixelIndex] / 255;
            const g = data[pixelIndex + 1] / 255;
            const b = data[pixelIndex + 2] / 255;

            const index = y * 224 + x;

            // CHW format
            floatData[index] = (r - mean[0]) / std[0];
            floatData[224 * 224 + index] = (g - mean[1]) / std[1];
            floatData[2 * 224 * 224 + index] = (b - mean[2]) / std[2];
        }
    }

    // Create tensor
    const tensor = new ort.Tensor(
        "float32",
        floatData,
        [1, 3, 224, 224]
    );

    // Run inference
    const feeds = {
        input: tensor
    };

    const resultsMap = await session.run(feeds);

    // Get output
    const output = resultsMap.output.data;

    // Find top prediction
    let maxIndex = 0;

    for (let i = 1; i < output.length; i++) {
        if (output[i] > output[maxIndex]) {
            maxIndex = i;
        }
    }
    
    const predictedName = classNames[maxIndex];
    setMakeAndModel(predictedName);

    console.log("Index:", maxIndex, "\nName:", predictedName);

    resultSpinner.style.display = "none";
}
