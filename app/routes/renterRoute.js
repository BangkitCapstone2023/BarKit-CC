import express from 'express';
const router = express.Router();
import {
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
} from '../controllers/renterHandler.js';

router.get('/', getDashboardData);
router.get('/search', searchProduct);

router.get('/:username/profile', getUserProfile);
router.put('/:username/profile', updateProfile);

router.get('/category', getAllCategories);
router.get('/category/:name', getSubCategoriesByName);

router.get('/subcategory/:name/products', getProductsBySubCategory);
router.get('/products/:productId', getProductById);

router.get('/:username/orders', getOrdersByRenter);
router.post('/:username/orders/:productId', createOrder);
router.get('/:username/orders/:orderId', getDetailOrdersByRenter);
router.put('/:username/orders/:orderId', updateOrder);

export default router;
