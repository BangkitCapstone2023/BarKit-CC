import Fuse from 'fuse.js';
import db from '../config/firebase.config.js';
import getRandomElements from '../utils/random.js';
import { badResponse, successResponse } from '../utils/response.js';

// Dashboard Handler
const getDashboardData = async (req, res) => {
  try {
    const productsSnapshot = await db.collection('products').get();
    const products = productsSnapshot.docs.map((doc) => doc.data());

    const categoriesSnapshot = await db.collection('categories').get();
    const categories = [];

    await Promise.all(
      categoriesSnapshot.docs.map(async (categoryDoc) => {
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
      }),
    );

    // Randomly select 10 products
    const randomProducts = getRandomElements(products, 10);

    const responseData = {
      products: randomProducts,
      categories,
    };

    const response = successResponse(
      200,
      'Dashboard data retrieved successfully',
      responseData,
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error:', error);
    const response = badResponse(
      500,
      'An error occurred while fetching dashboard data',
      error.message,
    );
    return res.status(500).json(response);
  }
};

// Search Products Handler
const searchProduct = async (req, res) => {
  try {
    const { title, category, subCategory } = req.query;

    if (!title) {
      const response = badResponse(
        400,
        'Please enter a word to search for a product',
      );
      return res.status(400).json(response);
    }

    // Retrieve all product data from Firestore
    const productsSnapshot = await db.collection('products').get();
    const products = productsSnapshot.docs.map((doc) => doc.data());

    // Create Fuse.js options
    const fuseOptions = {
      keys: ['title'],
      threshold: 0.3,
    };

    // Create a Fuse instance with the product data and options
    const fuse = new Fuse(products, fuseOptions);

    // Perform search using Fuse.js
    const searchResults = fuse.search(title);

    // Filter by category and subCategory
    const filteredResults = searchResults.filter((result) => {
      if (category && subCategory) {
        return result.item.category === category && result.item.sub_category === subCategory;
      }
      if (category) {
        return result.item.category === category;
      }
      if (subCategory) {
        return result.item.sub_category === subCategory;
      }
      return null;
    });
    console.log(filteredResults);

    // Retrieve only the necessary properties from the search results
    const formattedResults = await Promise.all(
      filteredResults.map(async (result) => {
        const lessorSnapshot = await db
          .collection('lessors')
          .doc(result.item.lessor_id)
          .get();
        const lessorData = lessorSnapshot.data();
        const { storeFullName, storeAddress, storePhone } = lessorData;

        const {
          item: { price, quantity, imageUrl },
        } = result;

        return {
          product_id: result.item.product_id,
          title: result.item.title,
          category: result.item.category,
          sub_category: result.item.sub_category,
          price,
          quantity,
          imageUrl,
          storeFullName,
          storeAddress,
          storePhone,
        };
      }),
    );

    if (formattedResults.length === 0) {
      const response = badResponse(
        404,
        'Product not found',
      );
      return res.status(404).json(response);
    }

    const response = successResponse(
      200,
      'Product search successful',
      formattedResults,
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while searching products:', error);

    const response = badResponse(
      500,
      'An error occurred while searching products',
      error.message,
    );
    return res.status(500).json(response);
  }
};

// Get All Categories Handler
const getAllCategories = async (req, res) => {
  try {
    const snapshot = await db.collection('categories').get();
    const categories = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      categories.push({ id: doc.id, name: data.name });
    });

    console.log('Working 7 Juni');

    return res.status(200).json(categories);
  } catch (error) {
    console.error('Error getting categories', error);
    return res.status(500).json({ error: 'Failed to get categories' });
  }
};

// Get All Sub Categories By Category Handler
const getSubCategoriesByCategory = async (req, res) => {
  const { name } = req.params;

  try {
    const categorySnapshoot = await db
      .collection('categories')
      .where('name', '==', name)
      .get();

    if (categorySnapshoot.empty) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const categoryId = categorySnapshoot.docs[0].id;
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

    const fetchLessors = async (doc) => {
      const productData = doc.data();

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
    };

    const fetchProductData = async () => {
      const promises = [];
      productsSnapshot.docs.forEach((doc) => {
        promises.push(fetchLessors(doc));
      });
      await Promise.all(promises);
    };

    await fetchProductData();

    const response = successResponse(200, 'Products retrieved successfully', products);
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting products by subcategory:', error);

    const response = badResponse(
      500,
      'An error occurred while getting products by subcategory',
    );

    return res.status(500).json(response);
  }
};

// Detail Products Handler
const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;

    const productDoc = await db.collection('products').doc(productId).get();

    if (!productDoc.exists) {
      const response = badResponse(404, 'Product not found');

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
      responseData,
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting product details', error);
    const response = badResponse(
      500,
      'Error while getting product details',
      error.message,
    );

    return res.status(500).json(response);
  }
};

// Get User Profile Handler
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
    if (renterData.renter_id !== uid) {
      const response = badResponse(403, 'Not allowed');
      return res.status(403).json(response);
    }

    const responseData = renterData;

    delete responseData.userRecordData;

    const response = successResponse(
      200,
      'Profile retrieved successfully',
      responseData,
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting user profile:', error);
    const response = badResponse(
      500,
      'An error occurred while getting user profile',
      error.message,
    );

    return res.status(500).json(response);
  }
};

// Update User Profile Handler
const updateProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const { uid } = req.user;
    const {
      name,
      address,
      phone,
      gender,
    } = req.body;

    // Check renters
    const renterSnapshot = await db
      .collection('renters')
      .where('username', '==', username)
      .get();

    if (renterSnapshot.empty) {
      const response = badResponse(404, 'Profile not found');
      return res.status(404).json(response);
    }

    // Check Auth Token
    const renterData = renterSnapshot.docs[0].data();
    if (renterData.renter_id !== uid) {
      const response = badResponse(403, 'Not allowed');
      return res.status(403).json(response);
    }

    // Check Input Data For Edit
    const renterRef = renterSnapshot.docs[0].ref;
    const renterUpdateData = {};

    if (name !== undefined && name !== '') {
      renterUpdateData.name = name;
    }

    if (address !== undefined && address !== '') {
      renterUpdateData.address = address;
    }

    if (phone !== undefined && phone !== '') {
      renterUpdateData.phone = phone;
    }

    if (gender !== undefined && gender !== '') {
      renterUpdateData.gender = gender;
    }

    if (Object.keys(renterUpdateData).length === 0) {
      const response = successResponse(
        200,
        'Berhasil update profile tapi tidak ada data yang diupdate',
        renterData,
      );
      return res.status(200).json(response);
    }

    // Perbarui data profile renter pada database
    await renterRef.update(renterUpdateData);

    // Ambil snapshot terbaru dari data profile yang diperbarui
    const updatedProfileSnapshot = await renterRef.get();
    const updatedProfileData = updatedProfileSnapshot.data();

    delete updatedProfileData.userRecordData;

    const response = successResponse(
      200,
      'Profile updated successfully',
      updatedProfileData,
    );
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while updating user profile:', error);

    const response = badResponse(
      500,
      'An error occurred while updating user profile',
      error.message,
    );

    return res.status(500).json(response);
  }
};

// Delete Account Renter Handler
const deleteRenterById = async (req, res) => {
  try {
    const { renterId } = req.params;

    // Check renters
    const renterRef = db.collection('renters').doc(renterId);
    const renterDoc = await renterRef.get();

    if (!renterDoc.exists) {
      const response = badResponse(404, 'Renter not found');
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
      'Renter and associated lessor deleted successfully',
    );
    return res.json(response);
  } catch (error) {
    console.error('Error while deleting renter:', error);

    const response = badResponse(
      500,
      'An error occurred while deleting renter',
      error.message,
    );

    return res.status(500).json(response);
  }
};

// Create New Order Handler
const createOrder = async (req, res) => {
  try {
    const { username, productId } = req.params;
    const { uid } = req.user;
    const {
      deliveryAddress,
      startRentDate,
      endRentDate,
      paymentUse,
      quantityOrder,
      kurir,
    } = req.body;

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
    const renterId = renterData.renter_id;

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
    if (renterId !== uid) {
      const response = badResponse(403, 'Not allowed');
      return res.status(403).json(response);
    }
    const productData = productSnapshot.data();
    const lessorId = productData.lessor_id;

    if (productData.quantity < quantityOrder) {
      const response = badResponse(
        400,
        `The maximum order quantity for this product is ${productData.quantity}`,
      );
      return res.status(400).json(response);
    }

    const lessorSnapshot = await db.collection('lessors').doc(lessorId).get();

    const lessorData = lessorSnapshot.data();

    if (lessorData.username === username) {
      const response = badResponse(403, 'You cant order your own product');
      return res.status(403).json(response);
    }

    if (quantityOrder < 1) {
      const response = badResponse(
        400,
        'The minimum order quantity for this product is 1',
      );
      return res.status(400).json(response);
    }
    // Generate document reference baru
    const orderRef = db.collection('orders').doc();

    // Buat Order Baru
    const newOrder = {
      order_id: orderRef.id,
      renter_id: renterId,
      lessor_id: lessorId,
      product_id: productId,
      delivery_address: deliveryAddress,
      start_rent_date: startRentDate,
      end_rent_date: endRentDate,
      quantity_order: quantityOrder,
      payment_use: paymentUse,
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

    delete responseData.renter.userRecordData;
    const response = successResponse(
      201,
      'Order Created successfully',
      responseData,
    );

    return res.status(201).json(response);
  } catch (error) {
    console.error('Error while creating the order:', error);
    const response = badResponse(
      500,
      'An error occurred while creating the order',
      error.message,
    );

    return res.status(500).json(response);
  }
};

// Get All Orders By Renter Handler
const getOrdersByRenter = async (req, res) => {
  try {
    const { username } = req.params;
    const { uid } = req.user;

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
    if (renterData.renter_id !== uid) {
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
      const response = badResponse(404, 'Renter does not have any orders yet');
      return res.status(404).json(response);
    }

    const ordersPromises = orderRenter.docs.map(async (doc) => {
      const orderData = doc.data();

      // Mengambil data produk terkait
      const productSnapshot = await db
        .collection('products')
        .doc(orderData.product_id)
        .get();

      // Memastikan produk tersedia
      if (productSnapshot.exists) {
        const productData = productSnapshot.data();

        return {
          order_id: doc.id,
          delivery_address: orderData.delivery_address,
          start_rent_date: orderData.start_rent_date,
          end_rent_date: orderData.end_rent_date,
          quantity_order: orderData.quantity_order,
          payment_use: orderData.payment_use,
          kurir: orderData.kurir,
          status: orderData.status,
          title: productData.title,
          description: productData.description,
          price: productData.price,
          imageUrl: productData.imageUrl,
          categori: productData.categori,
          sub_category: productData.sub_category,
        };
      }
      const response = badResponse(
        500,
        'An error occurred while getting orders by renter',
      );
      return res.status(500).json(response);
    });

    const orders = await Promise.all(ordersPromises);

    const response = successResponse(
      200,
      'Orders retrieved successfully',
      orders.filter((order) => order !== undefined),
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting orders by renter:', error);
    const response = badResponse(
      500,
      'An error occurred while getting orders by renter',
      error.message,
    );

    return res.status(500).json(response);
  }
};

// Update Order By Renter Handler
const updateOrder = async (req, res) => {
  try {
    const { uid } = req.user;
    const { username, orderId } = req.params;
    const {
      deliveryAddress,
      kurir,
      startRentDate,
      endRentDate,
    } = req.body;

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
    if (renterData.username !== username || renterData.renter_id !== uid) {
      const response = badResponse(
        403,
        'Access denied. Order does not belong to the renter',
      );
      return res.status(403).json(response);
    }

    // Cek apakah status order masih pending
    if (orderData.status !== 'pending') {
      const response = badResponse(
        403,
        'Order cannot be edited , because is not in pending status',
      );
      return res.status(403).json(response);
    }

    // Update data order dengan atribut yang dapat diubah
    await orderSnapshoot.update({
      delivery_address: deliveryAddress || orderData.delivery_address,
      kurir: kurir || orderData.kurir,
      start_rent_date: startRentDate || orderData.start_rent_date,
      end_rent_date: endRentDate || orderData.end_rent_date,
    });

    // Mengambil data terbaru dari order setelah pembaruan
    const updatedOrderDoc = await orderSnapshoot.get();
    const updatedOrderData = updatedOrderDoc.data();

    const response = successResponse(
      200,
      'Order updated successfully',
      updatedOrderData,
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while editing the order:', error);

    const response = badResponse(
      500,
      'An error occurred while editing the order',
      error.message,
    );

    return res.status(500).json(response);
  }
};

// Get Detail Order By Renter
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
    if (renterData.username !== username || renterData.renter_id !== uid) {
      const response = badResponse(
        403,
        'Access denied. Order does not belong to the renter',
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
      reponseData,
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting the order:', error);

    const response = badResponse(
      500,
      'An error occurred while getting the order',
      error.message,
    );

    return res.status(500).json(response);
  }
};

export {
  getDashboardData,
  searchProduct,
  getAllCategories,
  getSubCategoriesByCategory,
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
