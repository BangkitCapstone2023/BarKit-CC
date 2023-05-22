import { badResponse, successResponse } from '../utils/response.js';
import { db } from '../config/configFirebase.js';

// Register Lessor
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

  try {
    const requiredFields = [
      'storeFullName',
      'storeAddress',
      'storeEmail',
      'storePhone',
    ];
    const missingFields = requiredFields.filter((field) => !lessor[field]);
    if (missingFields.length > 0) {
      const errorMessage = missingFields
        .map((field) => `${field} is required`)
        .join('. ');

      const response = badResponse(404, errorMessage);
      return res.status(404).json(response);
    }

    // Check if the renter exists
    const userSnapshot = await db
      .collection('renters')
      .where('username', '==', req.params.username)
      .get();
    if (userSnapshot.empty) {
      const response = badResponse(
        404,
        `User '${req.params.username}' not found`
      );
      return res.status(404).json(response);
    }

    // Get Renter Data
    let userData;
    userSnapshot.forEach((doc) => {
      userData = doc.data();
    });
    const { fullName, username, email } = userData;

    const renterId = userSnapshot.docs[0].id;

    const lessorSnapshot = await db
      .collection('lessors')
      .where('renterId', '==', renterId)
      .get();

    if (!lessorSnapshot.empty) {
      const response = badResponse(
        409,
        `User '${req.params.username}' is already a lessor`
      );
      return res.status(404).json(response);
    }

    // Save additional data to Firestore if not empty
    const lessorDocRef = db.collection('lessors').doc();
    // Generate a new lessor ID
    const lessorId = lessorDocRef.id;
    const lessorData = {
      lessorId,
      email,
      username,
      fullName,
      renterId,
      storeFullName: lessor.storeFullName,
      storeAddress: lessor.storeAddress,
      storeEmail: lessor.storeEmail,
      storePhone: lessor.storePhone,
      storeActive: true,
      kurirId: lessor.kurirId || '',
    };

    await lessorDocRef.set(lessorData);
    console.log(`Success Store Lessor Data to Firestore ${username}`);

    // Update isLessor attribute in user document
    const renterRef = db.collection('renters').doc(renterId);
    await renterRef.update({ isLessor: true });

    const responseData = { ...lessorData, renter: userData };
    const response = successResponse(
      201,
      `Success Create Lessor ${username}`,
      responseData
    );
    res.status(201).json(response);
    console.log(`Success Create Lessor ${username}`);
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

const getLessorProfile = async (req, res) => {
  try {
    const username = req.params.username;

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

    const response = successResponse(
      200,
      'Success Get Lessor Profile',
      lessorData
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

const updateLessor = async (req, res) => {
  try {
    const username = req.params.username;
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

    const lessorId = lessorSnapshot.docs[0].id;

    // Update  lessor data
    await db.collection('lessors').doc(lessorId).update({
      storeFullName,
      storeAddress,
      storeEmail,
      storePhone,
      kurir,
    });

    const updateData = {
      lessorId,
      username,
      storeFullName,
      storeAddress,
      storeEmail,
      storePhone,
      kurir,
    };

    const response = successResponse(
      200,
      'Success Update Lessor Data',
      updateData
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

const getOrdersByLessor = async (req, res) => {
  try {
    const { username } = req.params;

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

const getLessorOrderById = async (req, res) => {
  try {
    const { username, orderId } = req.params;

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

    const response = successResponse(
      200,
      'Order retrieved successfully',
      orderData
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

// Mengubah status order dan menambahkan catatan (optional)
const updateOrderStatusAndNotes = async (req, res) => {
  try {
    const { username, orderId } = req.params;
    const { status, notes } = req.body;

    const lessorSnapshot = await db
      .collection('lessors')
      .where('username', '==', username)
      .get();

    if (lessorSnapshot.empty) {
      const response = badResponse(404, `Lessor '${username}' not found`);
      return res.status(404).json(response);
    }

    const lessorId = lessorSnapshot.docs[0].id;

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
      const response = badResponse(404, 'Invalid status value');
      return res.status(404).json(response);
    }

    // Persiapan data yang akan diupdate
    const updateData = { status };
    if (notes) {
      updateData.notes = notes;
    }

    await orderRef.update(updateData);

    return res.json(response);
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

// Konfirmasi pengiriman orderan
const shippedOrder = async (req, res) => {
  try {
    const { username, orderId } = req.params;
    const { confirm, notes } = req.body;

    const lessorSnapshot = await db
      .collection('lessors')
      .where('username', '==', username)
      .get();

    if (lessorSnapshot.empty) {
      const response = badResponse(404, `Lessor '${username}' not found`);
      return res.status(404).json(response);
    }

    const lessorId = lessorSnapshot.docs[0].id;

    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      const response = badResponse(404, 'Order not found');
      return res.status(404).json(response);
    }

    const orderData = orderDoc.data();

    // Pastikan orderan masih dalam status 'pending'
    if (orderData.status !== 'pending') {
      const response = badResponse(403, 'Order cannot be modified');
      return res.status(403).json(response);
    }

    if (confirm) {
      // Update status orderan menjadi 'shipped' dan tambahkan catatan opsional
      const updatedData = { status: 'shipped' };
      if (notes !== undefined) {
        updatedData.notes = notes;
      }

      await orderRef.update(updatedData);

      const response = successResponse(200, 'Order shipment confirmed');

      return res.json(response);
    } else {
      const response = badResponse(404, 'Order shipment confirmation declined');
      return res.status(404).json(response);
    }
  } catch (error) {
    console.error('Error while confirming order shipment:', error);

    const response = badResponse(
      500,
      'Error while confirming order shipment:',
      error.message
    );
    return res.status(500).json(response);
  }
};

// Konfirmasi pengiriman orderan
const cancelOrder = async (req, res) => {
  try {
    const { username, orderId } = req.params;
    const { confirm, notes } = req.body;

    const lessorSnapshot = await db
      .collection('lessors')
      .where('username', '==', username)
      .get();

    if (lessorSnapshot.empty) {
      const response = badResponse(404, `Lessor '${username}' not found`);
      return res.status(404).json(response);
    }

    const lessorId = lessorSnapshot.docs[0].id;

    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      const response = badResponse(404, 'Order not found');
      return res.status(404).json(response);
    }

    const orderData = orderDoc.data();

    // Pastikan orderan masih dalam status 'pending'
    if (orderData.status !== 'shipped') {
      const response = badResponse(
        409,
        'Status cannot be modified because already shipped'
      );
      return res.status(403).json(response);
    }

    if (confirm) {
      // Update status orderan menjadi 'shipped' dan tambahkan catatan opsional
      const updatedData = { status: 'cancelled' };
      if (notes !== undefined) {
        updatedData.notes = notes;
      }

      await orderRef.update(updatedData);

      const response = successResponse(200, 'Order Canclled');
      return res.status(200).json(response);
    } else {
      const response = badResponse(
        404,
        'Order cancelled confirmation declined'
      );

      return res.json(response);
    }
  } catch (error) {
    console.error('Error while confirming order shipment:', error);

    const response = badResponse(
      500,
      'Error while confirming order shipment',
      error.message
    );
    return res.status(500).json(response);
  }
};

export {
  registerLessor,
  getLessorProfile,
  updateLessor,
  getOrdersByLessor,
  getLessorOrderById,
  updateOrderStatusAndNotes,
  shippedOrder,
  cancelOrder,
};
