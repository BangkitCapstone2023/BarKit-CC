import { createCanvas, loadImage } from 'canvas';
import * as tf from '@tensorflow/tfjs-node';
import { badResponse } from '../utils/response.js';
import multer from 'multer';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

// File paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const modelPath = join(__dirname, 'model', 'model.json');

// List of categories
const categories = [
  'camera',
  'lcd',
  'matras',
  'ps',
  'sepatu',
  'speaker',
  'tas',
  'tenda',
];

const predictionModel = async (file, category) => {
  try {
    // Proses gambar yang diunggah
    const image = await loadImage(file.buffer);
    const canvas = createCanvas(150, 150);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, 150, 150);

    // Convert gambar canvas menjadi buffer
    const buffer = canvas.toBuffer('image/jpeg');

    // Load model dari file JSON
    const modelData = readFileSync(modelPath, 'utf-8');
    const model = await tf.loadLayersModel(`file://${modelPath}`);

    // Convert buffer gambar menjadi tensor
    const input = tf.node
      .decodeImage(buffer)
      .resizeNearestNeighbor([150, 150])
      .expandDims()
      .toFloat()
      .div(255);

    // Lakukan prediksi menggunakan model
    const predictions = model.predict(input);

    // Dapatkan kelas yang diprediksi
    const predictedClass = predictions.argMax(1).dataSync()[0];
    const predictedCategory = categories[predictedClass];

    // Bandingkan kategori prediksi dengan kategori yang diberikan
    if (predictedCategory === category) {
      // Prediksi sesuai dengan kategori yang diberikan
      return { success: true, predictedCategory };
    } else {
      // Prediksi tidak sesuai dengan kategori yang diberikan
      const errorMessage = `Failed, the image is ${predictedCategory}, not ${category}`;
      return { success: false, errorMessage };
    }
  } catch (error) {
    // Handle error saat memproses prediksi
    // ...
    return { success: false, errorMessage: error.message };
  }
};

export default predictionModel;
