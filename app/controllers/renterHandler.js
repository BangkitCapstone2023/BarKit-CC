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

    return res.status(200).json(response);
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
    const filteredResults = searchResults.filter((result) => {
      return category ? result.item.category === category : true;
    });

    // Ambil hanya properti yang diperlukan dari hasil pencarian
    const formattedResults = await Promise.all(
      filteredResults.map(async (result) => {
        const lessorSnapshot = await db
          .collection('lessors')
          .doc(result.item.lessor_id)
          .get();
        const lessorData = lessorSnapshot.data();
        const { storeFullName, storeAddress, storePhone } = lessorData;

        const {
          item: {
            product_id,
            title,
            category,
            sub_category,
            price,
            quantity,
            imageUrl,
          },
        } = result;

        return {
          product_id,
          title,
          category,
          sub_category,
          price,
          quantity,
          imageUrl,
          storeFullName,
          storeAddress,
          storePhone,
        };
      })
    );

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

    return res.status(200).json(categories);
  } catch (error) {
    console.error('Error getting categories', error);
    return res.status(500).json({ error: 'Failed to get categories' });
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
      return res.status(404).json({ error: 'Category not found' });
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

    return res.status(200).json(subCategories);
  } catch (error) {
    console.error('Error getting subcategories', error);
    return res.status(500).json({ error: 'Failed to get subcategories' });
  }
};
const getProductsBySubCategory = async (req, res) => {
  try {
    const { name } = req.params;

    const productsSnapshot = await db
      .collection('products')
      .where('sub_category', '==', name)
      .get();

    const products = [];

    for (const doc of productsSnapshot.docs) {
      const productData = doc.data();

      // Fetch lessor data using lessor_id from the product
      const lessorSnapshot = await db
        .collection('lessors')
        .doc(productData.lessor_id)
        .get();

      if (lessorSnapshot.exists) {
        const lessorData = lessorSnapshot.data();
        const { storeFullName, storeAddress, storePhone } = lessorData;

        products.push({
          product_id: productData.product_id,
          title: productData.title,
          description: productData.description,
          category: productData.category,
          quantity: productData.quantity,
          price: productData.price,
          imageUrl: productData.imageUrl,
          storeFullName,
          storeAddress,
          storePhone,
        });
      }
    }

    const response = successResponse(
      200,
      'Products retrieved successfully',
      products
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting products by subcategory:', error);

    const response = badResponse(
      500,
      'An error occurred while getting products by subcategory',
      error.message
    );

    return res.status(500).json(response);
  }
};

const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;

    const productDoc = await db.collection('products').doc(productId).get();

    if (!productDoc.exists) {
      const response = badResponse(404, 'Product not founs');

      return res.status(404).json(response);
    }

    const productData = productDoc.data();
    const lessorDoc = await db
      .collection('lessors')
      .doc(productData.lessor_id)
      .get();
    const lessorData = lessorDoc.data();
    const {
      fullName,
      storeFullName,
      storeAddress,
      storePhone,
      storeEmail,
      storeActive,
    } = lessorData;

    const lessorResponse = {
      fullName,
      storeFullName,
      storeAddress,
      storePhone,
      storeEmail,
      storeActive,
    };

    const responseData = { ...productData, lessor: lessorResponse };
    const response = successResponse(
      200,
      'Product details retrieved successfully',
      responseData
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting product details', error);
    const response = badResponse(
      500,
      'Error while getting product details',
      error.message
    );

    return res.status(500).json(response);
  }
};

const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const { uid } = req.user;

    // Check Renter
    const profileSnapshot = await db
      .collection('renters')
      .where('username', '==', username)
      .limit(1)
      .get();

    if (profileSnapshot.empty) {
      const response = badResponse(404, 'Profile not found');
      return res.status(404).json(response);
    }

    const renterData = profileSnapshot.docs[0].data();

    // Check Auth Token
    if (renterData.id !== uid) {
      const response = badResponse(403, 'Not allowed');
      return res.status(403).json(response);
    }

    const response = successResponse(
      200,
      'Profile retrieved successfully',
      renterData
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting user profile:', error);
    const response = badResponse(
      500,
      'An error occurred while getting user profile',
      error.message
    );

    return res.status(500).json(response);
  }
};

const updateProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const { uid } = req.user;
    const { name, address, phone, gender } = req.body;

    // Check renter
    const renterSnapshot = await db
      .collection('renters')
      .where('username', '==', username)
      .get();

    if (renterSnapshot.empty) {
      const response = badResponse(404, 'Profile not found');
      return res.status(404).json(response);
    }

    // Check Auth  Token
    const renterData = renterSnapshot.docs[0].data();
    if (renterData.id !== uid) {
      const response = badResponse(403, 'Not allowed');
      return res.status(403).json(response);
    }
    const renterRef = renterSnapshot.docs[0].ref;

    // Perbarui data profile renter pada database
    await renterRef.update({
      name,
      address,
      phone,
      gender,
    });

    // Ambil snapshot terbaru dari data profile yang diperbarui
    const updatedProfileSnapshot = await renterRef.get();
    const updatedProfileData = updatedProfileSnapshot.data();

    const response = successResponse(
      200,
      'Profile updated successfully',
      updatedProfileData
    );
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while updating user profile:', error);

    const response = badResponse(
      500,
      'An error occurred while updating user profile',
      error.message
    );

    return res.status(500).json(response);
  }
};

const deleteRenterById = async (req, res) => {
  try {
    const { renterId } = req.params;

    // Hapus renter dari database
    const renterRef = db.collection('renters').doc(renterId);
    const renterDoc = await renterRef.get();

    if (!renterDoc.exists) {
      const response = badResponse(
        404,
        `Renter with ID '${renterId}' not found`
      );
      return res.status(404).json(response);
    }

    const renterData = renterDoc.data();

    // Hapus renter
    await renterRef.delete();

    // Hapus data lessor yang terkait dengan renter tersebut
    const lessorSnapshot = await db
      .collection('lessors')
      .where('username', '==', renterData.username)
      .get();

    if (!lessorSnapshot.empty) {
      const lessorId = lessorSnapshot.docs[0].id;
      const lessorRef = db.collection('lessors').doc(lessorId);
      await lessorRef.delete();
    }

    const response = successResponse(
      200,
      'Renter and associated lessor deleted successfully'
    );
    return res.json(response);
  } catch (error) {
    console.error('Error while deleting renter:', error);

    const response = badResponse(
      500,
      'An error occurred while deleting renter',
      error.message
    );

    return res.status(500).json(response);
  }
};

const createOrder = async (req, res) => {
  try {
    const { username, productId } = req.params;
    const { uid } = req.user;
    const {
      delivery_address,
      start_rent_date,
      end_rent_date,
      payment_use,
      quantity_order,
      kurir,
    } = req.body;
    console.log(uid);

    // Check Renter
    const renterSnapshot = await db
      .collection('renters')
      .where('username', '==', username)
      .get();

    if (renterSnapshot.empty) {
      const response = badResponse(404, 'Renter not found');
      return res.status(404).json(response);
    }
    const renterData = renterSnapshot.docs[0].data();
    const renter_id = renterData.id;

    // Check Product
    const productSnapshot = await db
      .collection('products')
      .doc(productId)
      .get();
    if (!productSnapshot.exists) {
      const response = badResponse(404, 'Product not found');
      return res.status(404).json(response);
    }

    // Check Auth Token
    if (renterData.id !== uid) {
      const response = badResponse(403, 'Not allowed');
      return res.status(403).json(response);
    }
    const productData = productSnapshot.data();
    const lessor_id = productData.lessor_id;
    const product_id = productId;

    const lessorSnapshot = await db.collection('lessors').doc(lessor_id).get();

    const lessorData = lessorSnapshot.data();

    if (lessorData.username == username) {
      const response = badResponse(403, 'You cant order your own product');
      return res.status(403).json(response);
    }

    // Generate document reference baru
    const orderRef = db.collection('orders').doc();

    // Buat Order Baru
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

    // Insert order baru ke database
    await orderRef.set(newOrder);

    const responseData = {
      ...newOrder,
      lessor: lessorData,
      renter: renterData,
      product: productData,
    };
    const response = successResponse(
      200,
      'Order Created successfully',
      responseData
    );

    res.json(response);
  } catch (error) {
    console.error('Error while creating the order:', error);
    const response = badResponse(
      500,
      'An error occurred while creating the order',
      error.message
    );

    return res.status(500).json(response);
  }
};

const getOrdersByRenter = async (req, res) => {
  try {
    const { username } = req.params;
    const { uid } = req.user;

    console.log(uid);
    const renterSnapshot = await db
      .collection('renters')
      .where('username', '==', username)
      .get();

    // Check Renter
    if (renterSnapshot.empty) {
      const response = badResponse(404, 'Renter not found');
      return res.status(404).json(response);
    }

    const renterData = renterSnapshot.docs[0].data();
    // Check Auth Token
    if (renterData.id !== uid) {
      const response = badResponse(403, 'Not allowed');
      return res.status(403).json(response);
    }

    const renterId = renterSnapshot.docs[0].id;

    // Mengambil seluruh order berdasarkan renter_id
    const orderRenter = await db
      .collection('orders')
      .where('renter_id', '==', renterId)
      .get();

    // Check Orders By Renter
    if (orderRenter.empty) {
      const response = badResponse(404, 'Renter is dont have order yet');
      return res.status(404).json(response);
    }
    const orders = [];

    // Mengambil seluruh order by renter
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

    const response = successResponse(
      200,
      'Orders retrieved successfully',
      orders
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting orders by renter:', error);
    const response = badResponse(
      500,
      'An error occurred while getting orders by renter',
      error.message
    );

    return res.status(500).json(response);
  }
};

const updateOrder = async (req, res) => {
  try {
    const { uid } = req.user;
    const { username, orderId } = req.params;
    const { delivery_address, kurir, start_rent_date, end_rent_date } =
      req.body;

    console.log(orderId);

    // Mengambil data order berdasarkan orderId
    const orderSnapshoot = db.collection('orders').doc(orderId);
    const orderRef = await orderSnapshoot.get();

    if (!orderRef.exists) {
      const response = badResponse(404, 'Order not found');
      return res.status(404).json(response);
    }
    const orderData = orderRef.data();

    const renterSnapshot = await db
      .collection('renters')
      .doc(orderData.renter_id)
      .get();

    const renterData = renterSnapshot.data();

    // Memastikan order tersebut dimiliki oleh renter yang sesuai
    if (renterData.username !== username || renterData.id !== uid) {
      const response = badResponse(
        403,
        'Access denied. Order does not belong to the renter'
      );
      return res.status(403).json(response);
    }

    // Cek apakah status order masih pending
    if (orderData.status !== 'pending') {
      const response = badResponse(
        403,
        'Order cannot be edited as it is not in pending status',
        error.message
      );
      return res.status(403).json(response);
    }

    // Update data order dengan atribut yang dapat diubah
    await orderSnapshoot.update({
      delivery_address: delivery_address || orderData.delivery_address,
      kurir: kurir || orderData.kurir,
      start_rent_date: start_rent_date || orderData.start_rent_date,
      end_rent_date: end_rent_date || orderData.end_rent_date,
    });

    // Mengambil data terbaru dari order setelah pembaruan
    const updatedOrderDoc = await orderSnapshoot.get();
    const updatedOrderData = updatedOrderDoc.data();

    const response = successResponse(
      200,
      'Order updated successfully',
      updatedOrderData
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while editing the order:', error);

    const response = badResponse(
      500,
      'An error occurred while editing the order',
      error.message
    );

    return res.status(500).json(response);
  }
};

const getDetailOrdersByRenter = async (req, res) => {
  try {
    const { username, orderId } = req.params;
    const { uid } = req.user;

    // Check Order
    const orderSnapshot = await db.collection('orders').doc(orderId).get();

    if (!orderSnapshot.exists) {
      const response = badResponse(404, 'Order not found');
      return res.status(404).json(response);
    }

    const orderData = orderSnapshot.data();

    const productSnapshot = await db
      .collection('products')
      .doc(orderData.product_id)
      .get();

    const productData = productSnapshot.data();

    const lessorSnapshot = await db
      .collection('lessors')
      .doc(orderData.lessor_id)
      .get();

    const lessorData = lessorSnapshot.data();

    const renterSnapshot = await db
      .collection('renters')
      .doc(orderData.renter_id)
      .get();

    const renterData = renterSnapshot.data();

    // Memastikan order tersebut dimiliki oleh renter yang sesuai
    if (renterData.username !== username || renterData.id !== uid) {
      const response = badResponse(
        403,
        'Access denied. Order does not belong to the renter'
      );
      return res.status(403).json(response);
    }

    const reponseData = {
      ...orderData,
      product: productData,
      lessor: lessorData,
    };
    const response = successResponse(
      200,
      'Order retrieved successfully',
      reponseData
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting the order:', error);

    const response = badResponse(
      500,
      'An error occurred while getting the order',
      error.message
    );

    return res.status(500).json(response);
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
  deleteRenterById,
  createOrder,
  getOrdersByRenter,
  getDetailOrdersByRenter,
  updateOrder,
};
