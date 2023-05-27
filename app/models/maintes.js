const imageSelector = document.getElementById('image-selector');
const selectedImageElement = document.getElementById('selected-image');
const predictionElement = document.getElementById('prediction');
const uploadButton = document.getElementById('upload-button');

// import model
let model;
const classes = ['CAMERA', 'LCD', 'MATRAS', 'PS', 'SEPATU', 'SPEAKER', 'TAS', 'TENDA'];

async function loadModel() {
    model = await tf.loadLayersModel('Deploy_VGG16_TFJS/model.json');
    console.log('Model berhasil dimuat.');
}

async function classifyImage() {
    await loadModel();

    const imageFile = imageSelector.files[0];
    const img = new Image();
    const reader = new FileReader();

    reader.onload = function(e) {
        img.onload = function() {
            tf.tidy(() => {
                const resizedImage = tf.image.resizeBilinear(tf.browser.fromPixels(img), [150, 150]).toFloat();
                const input = resizedImage.expandDims();
                const predictions = model.predict(input);
                const classIndex = predictions.argMax(1).dataSync()[0];
                const className = getClassLabel(classIndex);
                showPrediction(img, className);
            });
        };
        img.src = e.target.result;
    };

    reader.readAsDataURL(imageFile);
}

function getClassLabel(classIndex) {
    return classes[classIndex];
}

function showPrediction(image, className) {
    selectedImageElement.src = image.src;
    const classInput = document.getElementById('class-input');
    const inputClassName = classInput.value.trim().toUpperCase();

    if (!classes.includes(inputClassName)) {
        predictionElement.innerHTML = `Barang ${inputClassName} tidak tersedia.`;
        uploadButton.style.display = 'none';
        return;
    }

    const predictedClassName = className.toUpperCase();
    let output = '';

    if (inputClassName === predictedClassName) {
        output = `Gambar ${className} berhasil diunggah.`;
        uploadButton.style.display = 'block';
    } else {
        output = `Gambar tersebut bukan ${inputClassName}, melainkan ${className}.`;
        uploadButton.style.display = 'none';
    }

    predictionElement.innerHTML = output;
}

function checkClass() {
    const classInput = document.getElementById('class-input');
    const inputClassName = classInput.value.trim().toUpperCase();

    if (classes.includes(inputClassName)) {
        predictionElement.innerHTML = `Silahkan uplod gambar ${inputClassName}`;
        uploadButton.style.display = 'none';
    } else {
        predictionElement.innerHTML = `Barang ${inputClassName} tidak tersedia.`;
        uploadButton.style.display = 'none';
    }
}

imageSelector.addEventListener('change', classifyImage);
document.getElementById('class-input').addEventListener('input', checkClass);
