import { badResponse, successResponse } from '../utils/response.js';
import { db } from '../config/configFirebase.js';
import Fuse from 'fuse.js';

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

    const response = successResponse(
      200,
      'Dashboard data retrieved successfully',
      responseData
    );

    return res.json(response);
  } catch (error) {
    console.error('Error:', error);
    const response = badResponse(
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

    const response = successResponse(
      200,
      'Product search successful',
      formattedResults
    );

    return res.json(response);
  } catch (error) {
    console.error('Error while searching products:', error);

    const response = badResponse(
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

const createOrder = async (req, res) => {
  try {
    const { username, productId } = req.params;
    const {
      delivery_address,
      start_rent_date,
      end_rent_date,
      payment_use,
      quantity_order,
      kurir,
    } = req.body;

    // Get renter_id from renters collection based on username
    const renterDoc = await db
      .collection('renters')
      .where('username', '==', username)
      .get();
    if (renterDoc.empty) {
      const response = {
        status: 404,
        message: 'Renter not found',
      };
      return res.status(404).json(response);
    }

    const renterData = renterDoc.docs[0].data();
    const renter_id = renterData.id;

    // Get item_ids from products collection based on productId
    const productDoc = await db.collection('products').doc(productId).get();
    if (!productDoc.exists) {
      const response = {
        status: 404,
        message: 'Product not found',
      };
      return res.status(404).json(response);
    }
    const productData = productDoc.data();
    const lessor_id = productData.lessor_id;
    const product_id = productId;

    const lessorDoc = await db.collection('lessors').doc(lessor_id).get();

    const lessorData = lessorDoc.data();

    // Create a new order document in the orders collection
    const orderRef = db.collection('orders').doc(); // Generate a new document reference

    const newOrder = {
      order_id: orderRef.id,
      renter_id,
      lessor_id,
      product_id,
      delivery_address,
      start_rent_date,
      end_rent_date,
      quantity_order,
      payment_use,
      kurir,
      status: 'pending',
    };

    const responseData = {
      ...newOrder,
      lessor: lessorData,
      renter: renterData,
      product: productData,
    };

    // Insert the new order into the orders collection in the database
    await orderRef.set(newOrder); // Save the new order document

    const response = successResponse(
      200,
      'Order Created successfully',
      responseData
    );

    res.json(response);
  } catch (error) {
    console.error('Error while creating the order:', error);

    const response = {
      status: 500,
      message: 'An error occurred while creating the order',
      error: error.message,
    };

    res.status(500).json(response);
  }
};

const getOrdersByRenter = async (req, res) => {
  try {
    const { username } = req.params;

    const renterDoc = await db
      .collection('renters')
      .where('username', '==', username)
      .get();

    if (renterDoc.empty) {
      const response = {
        status: 404,
        message: 'Renter not found',
      };
      return res.status(404).json(response);
    }

    const renterId = renterDoc.docs[0].id;

    // Mengambil seluruh order berdasarkan renter_id
    const orderRenter = await db
      .collection('orders')
      .where('renter_id', '==', renterId)
      .get();

    if (orderRenter.empty) {
      const response = {
        status: 404,
        message: 'Renter is dont have order yet',
      };
      return res.status(404).json(response);
    }
    const orders = [];

    orderRenter.forEach((doc) => {
      const orderData = doc.data();
      orders.push({
        order_id: doc.id,
        delivery_address: orderData.delivery_address,
        start_rent_date: orderData.start_rent_date,
        end_rent_date: orderData.end_rent_date,
        quantity_order: orderData.quantity_order,
        payment_use: orderData.payment_use,
        kurir: orderData.kurir,
        status: orderData.status,
      });
    });

    const response = {
      status: 200,
      message: 'Orders retrieved successfully',
      data: orders,
    };

    res.json(response);
  } catch (error) {
    console.error('Error while getting orders by renter:', error);

    const response = {
      status: 500,
      message: 'An error occurred while getting orders by renter',
      error: error.message,
    };

    res.status(500).json(response);
  }
};

const updateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log(orderId);
    const { delivery_address, kurir, start_rent_date, end_rent_date } =
      req.body;

    // Mengambil data order berdasarkan orderId
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      const response = {
        status: 404,
        message: 'Order not found',
      };
      return res.status(404).json(response);
    }

    const orderData = orderDoc.data();

    // Cek apakah status order masih pending
    if (orderData.status !== 'pending') {
      const response = {
        status: 403,
        message: 'Order cannot be edited as it is not in pending status',
      };
      return res.status(403).json(response);
    }

    // Update data order dengan atribut yang dapat diubah
    await orderRef.update({
      delivery_address: delivery_address || orderData.delivery_address,
      kurir: kurir || orderData.kurir,
      start_rent_date: start_rent_date || orderData.start_rent_date,
      end_rent_date: end_rent_date || orderData.end_rent_date,
    });

    const response = {
      status: 200,
      message: 'Order updated successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error while editing the order:', error);

    const response = {
      status: 500,
      message: 'An error occurred while editing the order',
      error: error.message,
    };

    res.status(500).json(response);
  }
};

const getDetailOrdersByRenter = async (req, res) => {
  try {
    const { username, orderId } = req.params;

    // Mencari data order berdasarkan orderId dan renterId
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      const response = {
        status: 404,
        message: 'Order not found',
      };
      return res.status(404).json(response);
    }

    const orderData = orderDoc.data();
    const renterRef = db.collection('renters').doc(orderData.renter_id);
    const renterDoc = await renterRef.get();
    const renterData = renterDoc.data();

    // Memastikan order tersebut dimiliki oleh renter yang sesuai
    if (orderData.renter_id !== renterData.id) {
      const response = {
        status: 403,
        message: 'Access denied. Order does not belong to the renter',
      };
      return res.status(403).json(response);
    }

    const response = {
      status: 200,
      message: 'Order retrieved successfully',
      data: orderData,
    };

    res.json(response);
  } catch (error) {
    console.error('Error while getting the order:', error);

    const response = {
      status: 500,
      message: 'An error occurred while getting the order',
      error: error.message,
    };

    res.status(500).json(response);
  }
};

export {
  getDashboardData,
  searchProduct,
  getAllCategories,
  getSubCategoriesByName,
  getProductsBySubCategory,
  getProductById,
  getUserProfile,
  updateProfile,
  createOrder,
  getOrdersByRenter,
  getDetailOrdersByRenter,
  updateOrder,
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

//     const response = successResponse(
//       200,
//       'Product search successful',
//       products
//     );

//     return res.json(response);
//   } catch (error) {
//     console.error('Error while searching products:', error);

//     const response = badResponse(
//       500,
//       'An error occurred while searching products',
//       error.message
//     );
//     return res.status(500).json(response);
//   }
// };
