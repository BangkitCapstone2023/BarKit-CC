const admin = require('firebase-admin');
const Response = require('../utils/response');
const { db } = require('../config/configFirebase');

async function getAllLessors(req, res) {
  try {
    // Get all lessors from Firestore
    const lessorsSnapshot = await db.collection('lessors').get();

    const lessorsData = [];

    // Iterate through the lessors snapshot and collect the data
    lessorsSnapshot.forEach((doc) => {
      const lessorData = doc.data();
      lessorsData.push(lessorData);
    });

    const response = Response.successResponse(
      200,
      'Success Get All Lessor',
      lessorsData
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting lessors:', error);
    const response = Response.badResponse(
      500,
      'An error occurred while getting all lessor data',
      error.message
    );
    return res.status(500).send(response);
  }
}

async function deleteLessorById(req, res) {
  const { lessorId } = req.params;

  try {
    // Get the lessor document
    const lessorSnapshot = await db.collection('lessors').doc(lessorId).get();

    if (!lessorSnapshot.exists) {
      throw new Error(`Lessor '${lessorId}' not found`);
    }

    // Get the lessor's username
    const lessorData = lessorSnapshot.data();
    const lessorUsername = lessorData.username;

    const lessorRef = db.collection('lessors').doc(lessorId);
    await lessorRef.delete();

    // Delete all products uploaded by the lessor
    const productsSnapshot = await db
      .collection('products')
      .where('username', '==', lessorUsername)
      .get();

    const batch = db.batch();

    productsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    const response = Response.successResponse(
      200,
      'Lessor and associated products deleted successfully'
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

// async function deleteLessorById(req, res) {
//
//   const { lessorId } = req.params;

//   try {
//     // Delete the lessor document
//     const lessorSnapshot = await db
//       .collection('lessors')
//       .where('lessorId', '==', lessorId)
//       .get();

//     if (lessorSnapshot.empty) {
//       throw new Error(`User '${lessorId}' not found or not a lessors`);
//     }
//     var lessorData = lessorSnapshot.docs[0].data();

//     const userSnapshot = await db
//       .collection('renters')
//       .where('username', '==', lessorData.username)
//       .get();

//     const renterId = userSnapshot.docs[0].id; // Get the renter ID

//     const renterRef = db.collection('renters').doc(renterId);
//     await renterRef.update({ isLessor: false });

//     const lessorRef = db.collection('lessors').doc(lessorId);
//     await lessorRef.delete();

//     const response = Response.successResponse(
//       200,
//       'Lessor deleted successfully'
//     );

//     res.status(200).json(response);
//   } catch (error) {
//     console.error('Error deleting lessor:', error);

//     const response = Response.badResponse(
//       500,
//       'Error deleting lessor',
//       error.message
//     );
//     res.status(500).json(response);
//   }
// }

// ! Error
async function getImageByName(req, res) {
  const { name } = req.params;

  try {
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
    // Mendapatkan instance Firestore
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

async function getAllRenters(req, res) {
  try {
    // Get all renters from Firestore
    const renterSnapshot = await db.collection('renters').get();

    const rentersData = [];

    // Iterate through the renters snapshot and collect the data
    renterSnapshot.forEach((doc) => {
      const renterData = doc.data();
      rentersData.push(renterData);
    });

    const response = Response.successResponse(
      200,
      'Success Get All Renters',
      rentersData
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting all renters:', error);
    const response = Response.badResponse(
      500,
      'An error occurred while getting all renters data',
      error.message
    );
    return res.status(500).send(response);
  }
}

async function deleteRenterById(req, res) {
  const { id } = req.params;

  try {
    // Get the lessor document
    const renterSnapshot = await db.collection('renters').doc(id).get();

    if (!renterSnapshot.exists) {
      throw new Error(`Renter '${id}' not found`);
    } else {
      await db.collection('renters').doc(id).delete();
    }

    const response = Response.successResponse(
      200,
      'Renters deleted successfully'
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

async function addCategory(req, res) {
  const { name } = req.body;

  db.collection('category')
    .add({ name })
    .then((docRef) => {
      res.status(201).json({ category_id: docRef.id, name });
    })
    .catch((error) => {
      console.error('Error creating category', error);
      res.status(500).json({ error: 'Failed to create category' });
    });
}

async function addSubCategory(req, res) {
  const { categoryId } = req.params;
  const { name } = req.body;

  const categoryRef = db.collection('category').doc(categoryId);

  categoryRef
    .collection('sub_category')
    .add({ name })
    .then((docRef) => {
      res.status(201).json({ sub_category_id: docRef.id, name });
    })
    .catch((error) => {
      console.error('Error creating subcategory', error);
      res.status(500).json({ error: 'Failed to create subcategory' });
    });
}

// Mendapatkan semua kategori
const getAllCategories = async (req, res) => {
  try {
    const snapshot = await db.collection('category').get();
    const categories = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      categories.push({ id: doc.id, name: data.name });
    });

    res.status(200).json(categories);
  } catch (error) {
    console.error('Error getting categories', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
};

// Mendapatkan subkategori berdasarkan ID kategori
const getSubCategoriesByCategoryId = async (req, res) => {
  const { categoryId } = req.params;

  try {
    const snapshot = await db
      .collection('category')
      .doc(categoryId)
      .collection('sub_category')
      .get();
    const subCategories = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      subCategories.push({ id: doc.id, name: data.name });
    });

    res.status(200).json(subCategories);
  } catch (error) {
    console.error('Error getting subcategories', error);
    res.status(500).json({ error: 'Failed to get subcategories' });
  }
};

module.exports = {
  getImageByName,
  getAllImages,
  getAllLessors,
  deleteLessorById,
  getAllRenters,
  deleteRenterById,
  addCategory,
  addSubCategory,
  getAllCategories,
  getSubCategoriesByCategoryId,
};
