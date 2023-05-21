const admin = require('firebase-admin');
const Response = require('../utils/response');
const { db } = require('../config/configFirebase');
// Register Lessor
async function registerLessor(req, res) {
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
    // Check if the user exists
    const userSnapshot = await db
      .collection('renters')
      .where('username', '==', req.params.username)
      .get();
    if (userSnapshot.empty) {
      throw new Error(`User '${req.params.username}' not found`);
    }

    var userData = userSnapshot.docs[0].data();
    const fullName = userData.fullName; // Get the renter fullName
    const username = userData.username;
    const email = userData.email;

    const renterId = userSnapshot.docs[0].id; // Get the renter ID

    const lessorSnapshot = await db
      .collection('lessors')
      .where('renterId', '==', renterId)
      .get();
    if (!lessorSnapshot.empty) {
      throw new Error(`User '${req.params.username}' is already a lessor`);
    }
    // Save additional data to Firestore if not empty
    const userDocRef = db.collection('lessors').doc();
    const lessorId = userDocRef.id; // Generate a new lessor ID
    var userData = {
      lessorId, // Add lessor ID
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

    await userDocRef.set(userData);
    console.log(`Success Store Lessor Data to Firestore ${username}`);

    // Update isLessor attribute in user document
    const renterRef = db.collection('renters').doc(renterId);
    await renterRef.update({ isLessor: true });

    // // Get renter data
    // const renterSnapshot = await renterRef.get();
    // const renterData = renterSnapshot.data();

    const response = Response.successResponse(
      201,
      `Success Create Lessor ${username}`,
      userData
    );
    res.status(201).json(response);
    console.log(`Success Create Lessor ${username}`);
  } catch (error) {
    console.error(error);
    const response = Response.badResponse(
      400,
      'An error occurred while register lessor',
      error.message
    );
    return res.status(400).send(response);
  }
}

async function getLessorProfile(req, res) {
  try {
    const username = req.params.username;

    // Check if the lessor exists
    const lessorSnapshot = await db
      .collection('lessors')
      .where('username', '==', username)
      .get();

    if (lessorSnapshot.empty) {
      throw new Error(`Lessor '${username}' not found`);
    }

    const lessorData = lessorSnapshot.docs[0].data();

    const response = Response.successResponse(
      200,
      'Success Get Lessor Profile',
      lessorData
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while getting lessor:', error);

    const response = Response.badResponse(
      500,
      'An error occurred while getting lessor profile data',
      error.message
    );
    return res.status(500).send(response);
  }
}

async function updateLessor(req, res) {
  try {
    const username = req.params.username;
    const { storeFullName, storeAddress, storeEmail, storePhone } = req.body;

    // Check if the lessor exists
    const lessorSnapshot = await db
      .collection('lessors')
      .where('username', '==', username)
      .get();

    if (lessorSnapshot.empty) {
      throw new Error(`Lessor '${username}'  not found`);
    }

    const lessorId = lessorSnapshot.docs[0].id;

    // Update the lessor data
    await db.collection('lessors').doc(lessorId).update({
      storeFullName,
      storeAddress,
      storeEmail,
      storePhone,
    });

    const updateData = {
      lessorId,
      username,
      storeFullName,
      storeAddress,
      storeEmail,
      storePhone,
    };

    const response = Response.successResponse(
      200,
      'Success Update Lessor Data',
      updateData
    );
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while updating lessor:', error);

    const response = Response.badResponse(
      500,
      'An error occurred while update lessor data',
      error.message
    );
    return res.status(500).send(response);
  }
}

const getOrdersByLessor = async (req, res) => {
  try {
    const { username } = req.params;

    const lessorSnapshot = await db
      .collection('lessors')
      .where('username', '==', username)
      .get();

    if (lessorSnapshot.empty) {
      throw new Error(`Lessor '${username}'  not found`);
    }

    const lessorId = lessorSnapshot.docs[0].id;

    // Mencari orderan berdasarkan lessor_id
    const orderSnapshot = await db
      .collection('orders')
      .where('lessor_id', '==', lessorId)
      .get();

    const orders = [];

    orderSnapshot.forEach((doc) => {
      const orderData = doc.data();
      orders.push({ order_id: doc.id, ...orderData });
    });

    const response = {
      status: 200,
      message: 'Orders retrieved successfully',
      data: orders,
    };

    res.json(response);
  } catch (error) {
    console.error('Error while getting lessor orders:', error);

    const response = {
      status: 500,
      message: 'An error occurred while getting lessor orders',
      error: error.message,
    };

    res.status(500).json(response);
  }
};

const getLessorOrderById = async (req, res) => {
  try {
    const { username, orderId } = req.params;

    const lessorSnapshot = await db
      .collection('lessors')
      .where('username', '==', username)
      .get();

    if (lessorSnapshot.empty) {
      const response = {
        status: 404,
        message: 'Lessor not found',
      };
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
      const response = {
        status: 404,
        message: 'Order not found',
      };
      return res.status(404).json(response);
    }

    const orderData = orderSnapshot.docs[0].data();

    const response = {
      status: 200,
      message: 'Order retrieved successfully',
      data: orderData,
    };

    res.json(response);
  } catch (error) {
    console.error('Error while getting order:', error);

    const response = {
      status: 500,
      message: 'An error occurred while getting order',
      error: error.message,
    };

    res.status(500).json(response);
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
      throw new Error(`Lessor '${username}' not found`);
    }

    const lessorId = lessorSnapshot.docs[0].id;

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

    // Pastikan lessor_id pada orderan sesuai dengan lessor yang mengirim permintaan
    if (orderData.lessor_id !== lessorId) {
      const response = {
        status: 403,
        message: 'Not allowed to modify other lessor order',
      };
      return res.status(403).json(response);
    }

    // Update status orderan sesuai permintaan
    const allowedStatus = ['pending', 'process', 'cancelled', 'shipped'];
    if (!allowedStatus.includes(status)) {
      const response = {
        status: 400,
        message: 'Invalid status value',
      };
      return res.status(400).json(response);
    }

    // Persiapan data yang akan diupdate
    const updateData = { status };
    if (notes) {
      updateData.notes = notes;
    }

    await orderRef.update(updateData);

    const response = {
      status: 200,
      message: 'Order status and notes updated',
    };

    return res.json(response);
  } catch (error) {
    console.error('Error while updating order status and notes:', error);

    const response = {
      status: 500,
      message: 'An error occurred while updating order status and notes',
      error: error.message,
    };

    res.status(500).json(response);
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
      throw new Error(`Lessor '${username}' not found`);
    }

    const lessorId = lessorSnapshot.docs[0].id;

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

    // Pastikan orderan masih dalam status 'pending'
    if (orderData.status !== 'pending') {
      const response = {
        status: 403,
        message: 'Order cannot be modified',
      };
      return res.status(403).json(response);
    }

    if (confirm) {
      // Update status orderan menjadi 'shipped' dan tambahkan catatan opsional
      const updatedData = { status: 'shipped' };
      if (notes !== undefined) {
        updatedData.notes = notes;
      }

      await orderRef.update(updatedData);

      const response = {
        status: 200,
        message: 'Order shipment confirmed',
      };

      return res.json(response);
    } else {
      const response = {
        status: 200,
        message: 'Order shipment confirmation declined',
      };

      return res.json(response);
    }
  } catch (error) {
    console.error('Error while confirming order shipment:', error);

    const response = {
      status: 500,
      message: 'An error occurred while confirming order shipment',
      error: error.message,
    };

    res.status(500).json(response);
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
      throw new Error(`Lessor '${username}' not found`);
    }

    const lessorId = lessorSnapshot.docs[0].id;

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

    // Pastikan orderan masih dalam status 'pending'
    if (orderData.status !== 'shipped') {
      const response = {
        status: 403,
        message: 'Status cannot be modified because already shipped',
      };
      return res.status(403).json(response);
    }

    if (confirm) {
      // Update status orderan menjadi 'shipped' dan tambahkan catatan opsional
      const updatedData = { status: 'cancelled' };
      if (notes !== undefined) {
        updatedData.notes = notes;
      }

      await orderRef.update(updatedData);

      const response = {
        status: 200,
        message: 'Order cancelled ',
      };

      return res.json(response);
    } else {
      const response = {
        status: 200,
        message: 'Order cancelled confirmation declined',
      };

      return res.json(response);
    }
  } catch (error) {
    console.error('Error while confirming order shipment:', error);

    const response = {
      status: 500,
      message: 'An error occurred while confirming order shipment',
      error: error.message,
    };

    res.status(500).json(response);
  }
};

module.exports = {
  registerLessor,
  getLessorProfile,
  updateLessor,
  getOrdersByLessor,
  getLessorOrderById,
  shippedOrder,
  updateOrderStatusAndNotes,
};
