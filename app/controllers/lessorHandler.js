import { badResponse, successResponse } from '../utils/response.js';
import { db } from '../config/configFirebase.js';

// Register Lessor Handler
const registerLessor = async (req, res) => {
  const lessor = {
    email: req.body.email,
    username: req.body.username,
    fullName: req.body.fullName,
    storeFullName: req.body.storeFullName,
    storeAddress: req.body.storeAddress,
    storeEmail: req.body.storeEmail,
    storePhone: req.body.storePhone,
    storeStatus: req.body.storeStatus,
    kurirId: req.body.kurirId,
  };

  const { uid } = req.user;

  try {
    const requiredFields = [
      'storeFullName',
      'storeAddress',
      'storeEmail',
      'storePhone',
    ];

    // Cek Required Fields
    const missingFields = requiredFields.filter((field) => !lessor[field]);
    if (missingFields.length > 0) {
      const errorMessage = missingFields
        .map((field) => `${field} is required`)
        .join('. ');

      const response = badResponse(400, errorMessage);
      return res.status(400).json(response);
    }

    // Check renters exist
    const renterSnapshot = await db
      .collection('renters')
      .where('username', '==', req.params.username)
      .get();
    if (renterSnapshot.empty) {
      const response = badResponse(
        404,
        `User '${req.params.username}' not found`
      );
      return res.status(404).json(response);
    }

    // Check Auth Token
    const renter_id = renterSnapshot.docs[0].id;
    if (renter_id !== uid) {
      const response = badResponse(403, 'Not allowed');
      return res.status(403).json(response);
    }

    const renterData = renterSnapshot.docs[0].data();
    const { fullName, username, email } = renterData;

    const lessorSnapshot = await db
      .collection('lessors')
      .where('renter_id', '==', renter_id)
      .get();

    // Check if renter already lessor
    if (!lessorSnapshot.empty) {
      const response = badResponse(
        409,
        `User '${req.params.username}' is already a lessor`
      );
      return res.status(409).json(response);
    }

    // Save data to firestore
    const lessorDocRef = db.collection('lessors').doc();

    const lessor_id = lessorDocRef.id;
    const lessorData = {
      lessor_id,
      email,
      username,
      fullName,
      renter_id,
      storeFullName: lessor.storeFullName,
      storeAddress: lessor.storeAddress,
      storeEmail: lessor.storeEmail,
      storePhone: lessor.storePhone,
      storeActive: true,
      kurirId: lessor.kurirId || '',
    };

    await lessorDocRef.set(lessorData);

    // Update isLessor attribute in user document
    const renterRef = db.collection('renters').doc(renter_id);
    await renterRef.update({ isLessor: true });

    const responseData = { ...lessorData, renter: renterData };
    const response = successResponse(
      201,
      `Success Create Lessor ${username}`,
      responseData
    );
    res.status(201).json(response);
  } catch (error) {
    console.error(error);
    const response = badResponse(
      500,
      'Error while create lessor',
      error.message
    );
    return res.status(500).json(response);
  }
};

// Lessor Profile Handler
const getLessorProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const { uid } = req.user;
    // Check if the lessor exists
    const lessorSnapshot = await db
      .collection('lessors')
      .where('username', '==', username)
      .get();

    if (lessorSnapshot.empty) {
      const response = badResponse(404, `Lessor '${username}' not found`);
      return res.status(404).json(response);
    }

    const lessorData = lessorSnapshot.docs[0].data();

    // Check Auth Token
    if (lessorData.renter_id !== uid) {
      const response = badResponse(403, 'Not allowed');
      return res.status(403).json(response);
    }

    const renterSnapshot = await db
      .collection('renters')
      .where('username', '==', username)
      .get();

    const renterData = renterSnapshot.docs[0].data();

    const responseData = { ...lessorData, renter: renterData };
    const response = successResponse(
      200,
      'Success Get Lessor Profile',
      responseData
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting lessor:', error);

    const response = badResponse(
      500,
      'Error while getting lessor',
      error.message
    );
    return res.status(500).json(response);
  }
};

// Update Profile Lessor Handler
const updateLessor = async (req, res) => {
  try {
    const { username } = req.params;
    const { uid } = req.user;
    const { storeFullName, storeAddress, storeEmail, storePhone, kurir } =
      req.body;

    // Check if the lessor exists
    const lessorSnapshot = await db
      .collection('lessors')
      .where('username', '==', username)
      .get();

    if (lessorSnapshot.empty) {
      const response = badResponse(404, `Lessor '${username}' not found`);
      return res.status(404).json(response);
    }

    const lessorData = lessorSnapshot.docs[0].data();

    // Check Auth Token
    if (lessorData.renter_id !== uid) {
      const response = badResponse(403, 'Not allowed');
      return res.status(403).json(response);
    }
    const lessorId = lessorSnapshot.docs[0].id;

    // Update  lessor data
    await db
      .collection('lessors')
      .doc(lessorId)
      .update({
        storeFullName,
        storeAddress,
        storeEmail,
        storePhone,
        kurir: kurir ? kurir : lessorData.kurirId,
      });

    const updateData = {
      lessor_id: lessorId,
      username,
      storeFullName,
      storeAddress,
      storeEmail,
      storePhone,
      kurir: kurir ? kurir : lessorData.kurirId,
    };

    const renterSnapshot = await db
      .collection('renters')
      .where('username', '==', username)
      .get();

    const renterData = renterSnapshot.docs[0].data();

    const responseData = { ...updateData, renter: renterData };
    const response = successResponse(
      200,
      'Success Update Lessor Data',
      responseData
    );
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while updating lessor:', error);

    const response = badResponse(
      500,
      'Error while updating lessor:',
      error.message
    );
    return res.status(500).json(response);
  }
};

// Delete Lessor Account Handler
const deleteLessorById = async (req, res) => {
  const { lessorId } = req.params;

  try {
    // Get the lessor document
    const lessorSnapshot = await db.collection('lessors').doc(lessorId).get();

    if (!lessorSnapshot.exists) {
      const response = badResponse(500, `Lessor '${lessorId}' not found`);
      return res.status(500).json(response);
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

    const response = successResponse(
      200,
      'Lessor and associated products deleted successfully'
    );

    res.status(200).json(response);
  } catch (error) {
    console.error('Error deleting lessor:', error);

    const response = badResponse(500, 'Error deleting lessor', error.message);
    res.status(500).json(response);
  }
};

// All Order By Lessor Handler
const getOrdersByLessor = async (req, res) => {
  try {
    const { username } = req.params;
    const { uid } = req.user;
    // Check if lessor is exits
    const lessorSnapshot = await db
      .collection('lessors')
      .where('username', '==', username)
      .get();

    if (lessorSnapshot.empty) {
      const response = badResponse(404, `Lessor '${username}' not found`);
      return res.status(404).json(response);
    }

    const lessorData = lessorSnapshot.docs[0].data();

    if (lessorData.renter_id !== uid) {
      const response = badResponse(403, 'Not allowed');
      return res.status(403).json(response);
    }

    const lessorId = lessorSnapshot.docs[0].id;

    // Mencari orderan berdasarkan lessor_id
    const orderSnapshot = await db
      .collection('orders')
      .where('lessor_id', '==', lessorId)
      .get();

    const orders = [];

    // Mengambil setiap orderan yang dimilik lessor
    orderSnapshot.forEach((doc) => {
      const orderData = doc.data();
      orders.push({ order_id: doc.id, ...orderData });
    });

    const response = successResponse(
      200,
      'Orders retrieved successfully',
      orders
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting lessor orders:', error);

    const response = badResponse(
      500,
      'Error while getting lessor orders',
      error.message
    );

    return res.status(500).json(response);
  }
};

// Detail Order Lessor Handler
const getLessorOrderById = async (req, res) => {
  try {
    const { username, orderId } = req.params;
    const { uid } = req.user;
    // Check if lessor is exits
    const lessorSnapshot = await db
      .collection('lessors')
      .where('username', '==', username)
      .get();

    if (lessorSnapshot.empty) {
      const response = badResponse(404, `Lessor '${username}' not found`);
      return res.status(404).json(response);
    }

    const lessorId = lessorSnapshot.docs[0].id;

    const lessorData = lessorSnapshot.docs[0].data();

    if (lessorData.renter_id !== uid) {
      const response = badResponse(
        403,
        'Not allowed this order is not your order'
      );
      return res.status(403).json(response);
    }
    // Mencari order berdasarkan lessor_id dan order_id
    const orderSnapshot = await db
      .collection('orders')
      .where('lessor_id', '==', lessorId)
      .where('order_id', '==', orderId)
      .get();

    if (orderSnapshot.empty) {
      const response = badResponse(404, 'Order not found');
      return res.status(404).json(response);
    }

    const orderData = orderSnapshot.docs[0].data();

    const renterSnapshot = await db
      .collection('renters')
      .where('id', '==', orderData.renter_id)
      .get();

    const renterData = renterSnapshot.docs[0].data();

    const resposeData = { ...orderData, renter: renterData };
    const response = successResponse(
      200,
      'Order retrieved successfully',
      resposeData
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting order:', error);

    const response = badResponse(
      500,
      'Error while getting order',
      error.message
    );
    return res.status(500).json(response);
  }
};

// Update Order Status Lessor Handler
const updateOrderStatusAndNotes = async (req, res) => {
  try {
    const { username, orderId } = req.params;
    const { status, notes } = req.body;
    const { uid } = req.user;

    const lessorSnapshot = await db
      .collection('lessors')
      .where('username', '==', username)
      .get();

    if (lessorSnapshot.empty) {
      const response = badResponse(404, `Lessor '${username}' not found`);
      return res.status(404).json(response);
    }

    const lessorId = lessorSnapshot.docs[0].id;

    const lessorData = lessorSnapshot.docs[0].data();

    if (lessorData.renter_id !== uid) {
      const response = badResponse(
        403,
        'Not allowed this order is not your order'
      );
      return res.status(403).json(response);
    }

    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      const response = badResponse(404, 'Order not found');
      return res.status(404).json(response);
    }

    const orderData = orderDoc.data();

    // Pastikan lessor_id pada orderan sesuai dengan lessor yang mengirim permintaan
    if (orderData.lessor_id !== lessorId) {
      const response = badResponse(
        403,
        'Not allowed to modify antoher lessor order'
      );
      return res.status(403).json(response);
    }

    // Update status orderan sesuai permintaan
    const allowedStatus = ['pending', 'process', 'cancelled', 'shipped'];
    if (!allowedStatus.includes(status)) {
      const response = badResponse(400, 'Invalid status value');
      return res.status(400).json(response);
    }

    // Persiapan data yang akan diupdate
    const updateData = { status };
    if (notes) {
      updateData.notes = notes;
    }

    await orderRef.update(updateData);
    const updatedOrderDoc = await orderRef.get();
    const updatedOrderData = updatedOrderDoc.data();

    const response = successResponse(
      200,
      'Success Update Status Order',
      updatedOrderData
    );
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while updating order status and notes:', error);

    const response = badResponse(
      500,
      'Error while updating order status and notes',
      error.message
    );

    return res.status(500).json(response);
  }
};

export {
  registerLessor,
  getLessorProfile,
  updateLessor,
  deleteLessorById,
  getOrdersByLessor,
  getLessorOrderById,
  updateOrderStatusAndNotes,
};
