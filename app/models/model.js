import sharp from 'sharp';
import * as tf from '@tensorflow/tfjs-node';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

// File paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const modelPath = join(__dirname, 'model', 'model.json');

<<<<<<< HEAD
<<<<<<< HEAD
// List of categories
const categories = [
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 4bbf4c5 (update)
=======
// List of subCategories
const subCategories = [
>>>>>>> 3ca9182 (fix typo)
=======
// List of subCategories
const subCategories = [
>>>>>>> abc379b91e37f77ce336fbf888b6eb035f1f722f
  'camera',
  'lcd',
  'matras',
  'ps',
  'sepatu',
  'speaker',
  'tas',
  'tenda',
<<<<<<< HEAD
];

const predictionModel = async (file, sub_category) => {
  try {
    // Proses gambar yang diunggah menggunakan sharp
    const image = sharp(file.buffer).resize(150, 150);
    const buffer = await image.toBuffer();

    // Load model dari file JSON
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
    const predictedSubCategorie = subCategories[predictedClass];

    // Bandingkan kategori prediksi dengan kategori yang diberikan
    if (predictedSubCategorie === sub_category) {
      // Prediksi sesuai dengan kategori yang diberikan
      return { success: true, predictedSubCategorie };
    } else {
      // Prediksi tidak sesuai dengan kategori yang diberikan
      const errorMessage = `Failed, the image is ${predictedSubCategorie}, not ${sub_category}`;
      return { success: false, errorMessage };
    }
  } catch (error) {
    console.error(error.message);
    return { success: false, errorMessage: error.message };
=======
  'CAMERA',
  'LCD',
  'MATRAS',
  'PS',
  'SEPATU',
  'SPEAKER',
  'TAS',
  'TENDA',
=======
>>>>>>> 4bbf4c5 (update)
];

const predictionModel = async (file, sub_category) => {
  try {
    // Proses gambar yang diunggah menggunakan sharp
    const image = sharp(file.buffer).resize(150, 150);
    const buffer = await image.toBuffer();

    // Load model dari file JSON
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
    const predictedSubCategorie = subCategories[predictedClass];

    // Bandingkan kategori prediksi dengan kategori yang diberikan
    if (predictedSubCategorie === sub_category) {
      // Prediksi sesuai dengan kategori yang diberikan
      return { success: true, predictedSubCategorie };
    } else {
      // Prediksi tidak sesuai dengan kategori yang diberikan
      const errorMessage = `Failed, the image is ${predictedSubCategorie}, not ${sub_category}`;
      return { success: false, errorMessage };
    }
  } catch (error) {
<<<<<<< HEAD
<<<<<<< HEAD
    console.error('Error while processing the image:', error);

    const response = badResponse(
      500,
      'An error occurred while processing the image',
      error.message
    );
    return res.status(500).json(response);
>>>>>>> 14ea090 (update work)
=======
    // Handle error saat memproses prediksi
    // ...
=======
    console.error(error.message);
>>>>>>> abc379b91e37f77ce336fbf888b6eb035f1f722f
    return { success: false, errorMessage: error.message };
>>>>>>> 4bbf4c5 (update)
  }
};

export default predictionModel;
