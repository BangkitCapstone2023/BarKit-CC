const admin = require('firebase-admin');
const Response = require('../utils/response');
const { storage, bucketName } = require('../config/configCloudStorage');

async function deleteLessorById(req, res) {
  const db = admin.firestore();
  const { lessorId } = req.params;

  try {
    // Delete the lessor document
    const lessorSnapshot = await db
      .collection('lessors')
      .where('lessorId', '==', lessorId)
      .get();

    if (lessorSnapshot.empty) {
      throw new Error(`User '${lessorId}' not found or not a lessors`);
    }
    var lessorData = lessorSnapshot.docs[0].data();

    const userSnapshot = await db
      .collection('renters')
      .where('username', '==', lessorData.username)
      .get();

    const renterId = userSnapshot.docs[0].id; // Get the renter ID

    const renterRef = db.collection('renters').doc(renterId);
    await renterRef.update({ isLessor: false });

    const lessorRef = db.collection('lessors').doc(lessorId);
    await lessorRef.delete();

    const response = Response.successResponse(
      200,
      'Lessor deleted successfully'
    );

    res.status(200).json(response);
  } catch (error) {
    console.error('Error deleting lessor:', error);

    const response = Response.badResponse(
      500,
      'Error deleting lessor',
      error.message
    );
    res.status(500).json(response);
  }
}

// ! Error
async function getImageByName(req, res) {
  const { name } = req.params;

  try {
    const db = admin.firestore();
    // const productSnapshot = await db.collection('products').get();

    const productSnapshot = await db
      .collection('products')
      // .where('imageUrl', 'array-contains', name)
      .get();
    console.log(productSnapshot);
    if (productSnapshot.empty) {
      const response = Response.badResponse(404, `Image ${name} not found`);
      return res.status(404).send(response);
    }

    const productData = productSnapshot.docs[0].data();
    const imageUrl = productData.imageUrl;
    const image_id = productData.image_id;

    const imageData = { image_id, name, imageUrl };
    const response = Response.successResponse(
      200,
      'Success Get Image',
      imageData
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while retrieving image:', error);
    const response = Response.badResponse(
      500,
      'Error when getting image',
      error.message
    );
    return res.status(500).send(response);
  }
}

async function getAllImages(req, res) {
  try {
    const db = admin.firestore(); // Mendapatkan instance Firestore
    const productsSnapshot = await db.collection('products').get(); // Mendapatkan snapshot produk dari Firestore

    const allImages = [];

    // Iterate through the products snapshot
    productsSnapshot.forEach((productDoc) => {
      const productData = productDoc.data();
      const imageUrl = productData.imageUrl; // Ambil data imageUrl dari field 'imageUrl' di dokument produk

      if (imageUrl) {
        const image_id = productData.image_id; // Ambil data image_id dari field 'image_id' di dokument produk
        allImages.push({ image_id, imageUrl });
      }
    });

    const response = Response.successResponse(
      200,
      'Success Get All Images',
      allImages
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error saat mendapatkan daftar gambar:', error);
    const response = Response.badResponse(
      500,
      'Error when get all images',
      error.message
    );
    return res.status(500).send(response);
  }
}

module.exports = {
  getImageByName,
  getAllImages,
  deleteLessorById,
};
