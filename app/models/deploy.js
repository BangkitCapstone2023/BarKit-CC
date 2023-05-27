import pkg from 'canvas';
const { createCanvas, loadImage } = pkg;
import multer from 'multer';
import { readFileSync } from 'fs';
import path from 'path';
import * as tf from '@tensorflow/tfjs';

const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

// File paths
const __filename = path.resolve();
const __dirname = path.dirname(__filename);
const modelPath = 'D:/VSCODE/CAPSTONE PROJECG/Barkit-CC/app/models/model.json';

// List of categories
const categories = [
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
        const response = {
          status: 500,
          message: 'An error occurred while uploading the file',
        };
        return res.status(500).json(response);
      }

      const file = req.file; // File can be accessed directly from req.file

      // Continue with file processing
      const image = await loadImage(file.buffer);
      const canvas = createCanvas(150, 150);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0, 150, 150);

      // Convert the canvas image to a buffer
      const buffer = canvas.toBuffer('image/jpeg');

      // Load the model from the JSON file
      const modelData = readFileSync(modelPath, 'utf-8');
      const modelJson = JSON.parse(modelData);
      const model = await tf.loadLayersModel(
        'file://D:/VSCODE/CAPSTONE PROJECG/Barkit-CC/app/models/model.json'
      );

      // Convert the image buffer to a tensor
      const imageData = tf.node.decodeImage(buffer);
      const input = imageData
        .resizeNearestNeighbor([150, 150])
        .toFloat()
        .div(255)
        .expandDims();

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
      } else {
        console.log(
          `Failed, the image is ${predictedCategory}, not ${req.body.category}`
        );
      }

      // Delete the file after processing is complete
      // fs.unlinkSync(file.path);

      // Return the response
      const response = {
        status: 200,
        message: 'Image processed successfully',
        predictedCategory: predictedCategory,
      };
      return res.status(200).json(response);
    });
  } catch (error) {
    console.error('Error while processing the image:', error);

    const response = {
      status: 500,
      message: 'An error occurred while processing the image',
      error: error.message,
    };
    return res.status(500).json(response);
  }
};

export default predictionModel;
