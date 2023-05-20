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

async function getProductsBySubCategory(req, res) {
  try {
    const { name } = req.params;

    console.log(name);
    const productsSnapshot = await db
      .collection('products')
      .where('sub_category', '==', name)
      .get();

    const products = [];

    productsSnapshot.forEach((doc) => {
      const { title, category, sub_category, quantity, price } = doc.data();
      products.push({ title, category, sub_category, quantity, price });
    });

    const response = {
      status: 200,
      message: 'Products retrieved successfully',
      data: products,
    };

    res.json(response);
  } catch (error) {
    console.error('Error while getting products by subcategory:', error);

    const response = {
      status: 500,
      message: 'An error occurred while getting products by subcategory',
      error: error.message,
    };

    res.status(500).json(response);
  }
}

async function getProductById(req, res) {
  try {
    const { productId } = req.params;

    const productDoc = await db.collection('products').doc(productId).get();

    if (!productDoc.exists) {
      const response = {
        status: 404,
        message: 'Product not found',
      };
      return res.status(404).json(response);
    }

    const productData = productDoc.data();

    const response = {
      status: 200,
      message: 'Product details retrieved successfully',
      data: productData,
    };

    res.json(response);
  } catch (error) {
    console.error('Error while getting product details:', error);

    const response = {
      status: 500,
      message: 'An error occurred while getting product details',
      error: error.message,
    };

    res.status(500).json(response);
  }
}

async function getUserProfile(req, res) {
  try {
    const { username } = req.params;

    // Mencari data profil renter berdasarkan username
    const profileQuery = await db
      .collection('renters')
      .where('username', '==', username)
      .limit(1)
      .get();

    if (profileQuery.empty) {
      const response = {
        status: 404,
        message: 'Profile not found',
      };
      return res.status(404).json(response);
    }

    const profileDoc = profileQuery.docs[0];
    const profileData = profileDoc.data();

    const response = {
      status: 200,
      message: 'Profile retrieved successfully',
      data: profileData,
    };

    res.json(response);
  } catch (error) {
    console.error('Error while getting user profile:', error);

    const response = {
      status: 500,
      message: 'An error occurred while getting user profile',
      error: error.message,
    };

    res.status(500).json(response);
  }
}
async function updateProfile(req, res) {
  try {
    const { username } = req.params;
    const { name, address, phone, gender } = req.body;

    // Cari data profile renter berdasarkan username
    const profileSnapshot = await db
      .collection('renters')
      .where('username', '==', username)
      .get();

    if (profileSnapshot.empty) {
      const response = {
        status: 404,
        message: 'Profile not found',
      };
      return res.status(404).json(response);
    }

    const profileRef = profileSnapshot.docs[0].ref;

    // Perbarui data profile renter pada database
    await profileRef.update({
      name,
      address,
      phone,
      gender,
    });

    const response = {
      status: 200,
      message: 'Profile updated successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error while updating user profile:', error);

    const response = {
      status: 500,
      message: 'An error occurred while updating user profile',
      error: error.message,
    };

    res.status(500).json(response);
  }
}

module.exports = {
  getDashboardData,
  searchProduct,
  getAllCategories,
  getSubCategoriesByName,
  getProductsBySubCategory,
  getProductById,
  getUserProfile,
  updateProfile,
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
