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
<<<<<<< HEAD
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
=======
  'CAMERA',
  'LCD',
  'MATRAS',
  'PS',
  'SEPATU',
  'SPEAKER',
  'TAS',
  'TENDA',
];

const predictionModel = async (req, res) => {
  try {
    upload.single('image')(req, res, async (err) => {
      if (err) {
        console.error('Error while uploading file:', err);
        const response = badResponse(
          500,
          'An error occurred while uploading the file'
        );
        return res.status(500).json(response);
      }

      const file = req.file;

      // Continue with file processing
      const image = await loadImage(file.buffer);
      const canvas = createCanvas(150, 150);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0, 150, 150);

      // Convert the canvas image to a buffer
      const buffer = canvas.toBuffer('image/jpeg');

      // Load the model from the JSON file
      const modelData = readFileSync(modelPath, 'utf-8');
      const model = await tf.loadLayersModel(`file://${modelPath}`);

      // Convert the image buffer to a tensor
      const input = tf.node
        .decodeImage(buffer)
        .resizeNearestNeighbor([150, 150])
        .expandDims()
        .toFloat()
        .div(255);

      // Make predictions using the model
      const predictions = model.predict(input);

      // Get the predicted class
      const predictedClass = predictions.argMax(1).dataSync()[0];
      const predictedCategory = categories[predictedClass];

      // Display the prediction result
      console.log('DETECTION RESULT:');
      console.log();

      if (predictedCategory === req.body.category) {
        console.log(`Successfully uploaded ${predictedCategory}`);
        return res.status(200).json(predictedCategory);
      } else {
        console.log(
          `Failed, the image is ${predictedCategory}, not ${req.body.category}`
        );
        return res
          .status(404)
          .send(
            `Failed, the image is ${predictedCategory}, not ${req.body.category}`
          );
      }

      // Delete the file after processing is complete
      // fs.unlinkSync(file.path);
    });
  } catch (error) {
    console.error('Error while processing the image:', error);

    const response = badResponse(
      500,
      'An error occurred while processing the image',
      error.message
    );
    return res.status(500).json(response);
>>>>>>> 14ea090 (update work)
  }
};

export default predictionModel;
