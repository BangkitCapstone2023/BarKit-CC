const admin = require('firebase-admin');
const { db } = require('../config/configFirebase');
const Response = require('../utils/response');

const getDashboardData = async (req, res) => {
  try {
    const productsSnapshot = await db.collection('products').get();
    const products = productsSnapshot.docs.map((doc) => doc.data());

    const categoriesSnapshot = await db.collection('categories').get();
    const categories = [];

    for (const categoryDoc of categoriesSnapshot.docs) {
      const categoryData = categoryDoc.data();
      const category = { name: categoryData.name, subcategories: [] };

      const subcategoriesSnapshot = await categoryDoc.ref
        .collection('sub_categories')
        .get();

      subcategoriesSnapshot.forEach((subDoc) => {
        const subcategoryData = subDoc.data();
        const subcategory = { name: subcategoryData.name };
        category.subcategories.push(subcategory);
      });

      categories.push(category);
    }

    // Randomly select 10 products
    const randomProducts = getRandomElements(products, 10);

    const responseData = {
      products: randomProducts,
      categories,
    };

    const response = Response.successResponse(
      200,
      'Dashboard data retrieved successfully',
      responseData
    );

    return res.json(response);
  } catch (error) {
    console.error('Error:', error);
    const response = Response.badResponse(
      500,
      'An error occurred while fetching dashboard data',
      error.message
    );
    return res.status(500).json(response);
  }
};

// Helper function to get random elements from an array
function getRandomElements(arr, count) {
  const shuffled = arr.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

const Fuse = require('fuse.js');

const searchProduct = async (req, res) => {
  try {
    const { title, category } = req.body;

    // Ambil semua data produk dari Firestore
    const productsSnapshot = await db.collection('products').get();
    const products = productsSnapshot.docs.map((doc) => doc.data());

    // Buat opsi Fuse.js
    const fuseOptions = {
      keys: ['title'],
      threshold: 0.3, // Nilai threshold (0 hingga 1) untuk pencocokan pencarian
    };

    // Buat instance Fuse dengan data produk dan opsi
    const fuse = new Fuse(products, fuseOptions);

    // Lakukan pencarian menggunakan Fuse.js
    const searchResults = fuse.search(title);

    // Filter berdasarkan kategori jika diberikan
    const filteredResults = searchResults.filter((result) =>
      category ? result.category === category : true
    );

    console.log(filteredResults);

    // Ambil hanya properti yang diperlukan dari hasil pencarian
    const formattedResults = filteredResults.map((result) => {
      const {
        item: { title, category, sub_category, price },
      } = result;
      return { title, category, sub_category, price };
    });

    const response = Response.successResponse(
      200,
      'Product search successful',
      formattedResults
    );

    return res.json(response);
  } catch (error) {
    console.error('Error while searching products:', error);

    const response = Response.badResponse(
      500,
      'An error occurred while searching products',
      error.message
    );
    return res.status(500).json(response);
  }
};

// Mendapatkan semua kategori
const getAllCategories = async (req, res) => {
  try {
    const snapshot = await db.collection('categories').get();
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
const getSubCategoriesByName = async (req, res) => {
  const { name } = req.params;

  try {
    const snapshot = await db
      .collection('categories')
      .where('name', '==', name)
      .get();

    if (snapshot.empty) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const categoryId = snapshot.docs[0].id;
    const subCategoriesSnapshot = await db
      .collection('categories')
      .doc(categoryId)
      .collection('sub_categories')
      .get();

    const subCategories = [];

    subCategoriesSnapshot.forEach((doc) => {
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
  getDashboardData,
  searchProduct,
  getAllCategories,
  getSubCategoriesByName,
};

// const searchProduct = async (req, res) => {
//   try {
//     const { title, category } = req.body;

//     let query = db.collection('products');

//     if (title) {
//       query = query.where('title', '>=', title).where('title', '<=', title + '\uf8ff');
//     }

//     if (category) {
//       query = query.where('category', '==', category);
//     }

//     const productsSnapshot = await query.get();
//     const products = [];

//     productsSnapshot.forEach((doc) => {
//       const { title, category, sub_category, price } = doc.data();
//       products.push({ title, category, sub_category, price });
//     });

//     const response = Response.successResponse(
//       200,
//       'Product search successful',
//       products
//     );

//     return res.json(response);
//   } catch (error) {
//     console.error('Error while searching products:', error);

//     const response = Response.badResponse(
//       500,
//       'An error occurred while searching products',
//       error.message
//     );
//     return res.status(500).json(response);
//   }
// };
