import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { checkAvailabilityAPI, createBooking, getHotelBookings, getUserBookings, stripePayment, verifyStripePayment } from '../controllers/bookingController.js';

const bookingRouter = express.Router();

bookingRouter.post('/check-availability', checkAvailabilityAPI);
bookingRouter.post('/book', protect, createBooking);
bookingRouter.get('/user', protect, getUserBookings);
bookingRouter.get('/hotel', protect, getHotelBookings);
bookingRouter.post('/stripe-payment', protect, stripePayment);
bookingRouter.get('/verify-stripe-payment', protect, verifyStripePayment);

export default bookingRouter;