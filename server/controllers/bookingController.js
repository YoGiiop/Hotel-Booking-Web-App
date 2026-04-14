import transporter from "../configs/nodemailer.js";
import Booking from "../models/Booking.js";
import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";
import stripe from "stripe";

const normalizeDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
};

const sendBookingConfirmationEmail = async ({ user, booking, roomData }) => {
  if (!user?.email) return;

  const mailOptions = {
    from: process.env.SENDER_EMAIL,
    to: user.email,
    subject: "Hotel Booking Details",
    html: `
      <h2>Your Booking Details</h2>
      <p>Dear ${user.username},</p>
      <p>Thank you for your booking! Here are your details:</p>
      <ul>
        <li><strong>Booking ID:</strong> ${booking.id}</li>
        <li><strong>Hotel Name:</strong> ${roomData.hotel.name}</li>
        <li><strong>Location:</strong> ${roomData.hotel.address}</li>
        <li><strong>Date:</strong> ${booking.checkInDate.toDateString()}</li>
        <li><strong>Booking Amount:</strong>  ${process.env.CURRENCY || "$"} ${booking.totalPrice} /night</li>
      </ul>
      <p>We look forward to welcoming you!</p>
      <p>If you need to make any changes, feel free to contact us.</p>
    `,
  };

  // Do not block booking response on SMTP latency.
  const emailTimeoutMs = 8000;
  await Promise.race([
    transporter.sendMail(mailOptions),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Booking email timeout")), emailTimeoutMs)
    ),
  ]);
};

// Function to Check Availablity of Room
const checkAvailability = async ({ checkInDate, checkOutDate, room }) => {

  try {
    const checkIn = normalizeDate(checkInDate);
    const checkOut = normalizeDate(checkOutDate);

    if (!room || !checkIn || !checkOut || checkOut <= checkIn) {
      return false;
    }

    const bookings = await Booking.find({
      room,
      status: { $ne: "cancelled" },
      checkInDate: { $lt: checkOut },
      checkOutDate: { $gt: checkIn },
    });

    const isAvailable = bookings.length === 0;
    return isAvailable;

  } catch (error) {
    console.error(error.message);
    return false;
  }
};

// API to check availability of room
// POST /api/bookings/check-availability
export const checkAvailabilityAPI = async (req, res) => {
  try {
    const { room, checkInDate, checkOutDate } = req.body;
    const checkIn = normalizeDate(checkInDate);
    const checkOut = normalizeDate(checkOutDate);

    if (!room || Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime()) || checkOut <= checkIn) {
      return res.json({ success: false, message: "Invalid availability request" });
    }

    const isAvailable = await checkAvailability({ checkInDate, checkOutDate, room });
    res.json({ success: true, isAvailable });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to create a new booking
// POST /api/bookings/book
export const createBooking = async (req, res) => {
  try {

    const { room, checkInDate, checkOutDate, guests, paymentMethod } = req.body;

    const user = req.user._id;

    const checkIn = normalizeDate(checkInDate);
    const checkOut = normalizeDate(checkOutDate);
    if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime()) || checkOut <= checkIn) {
      return res.json({ success: false, message: "Invalid check-in or check-out date" });
    }

    // Before Booking Check Availability
    const isAvailable = await checkAvailability({
      checkInDate,
      checkOutDate,
      room,
    });

    if (!isAvailable) {
      return res.json({ success: false, message: "Room is not available" });
    }

    // Get totalPrice from Room
    const roomData = await Room.findById(room).populate("hotel");
    if (!roomData || !roomData.hotel) {
      return res.json({ success: false, message: "Room not found" });
    }
    
    // Restrict hotel owners from booking their own hotels
    let totalPrice = roomData.pricePerNight;

      // Restrict hotel owners from booking their own hotels
      if (roomData.hotel.owner && roomData.hotel.owner.toString() === user.toString()) {
        return res.json({ success: false, message: "Owners cannot book their own hotels." });
      }

    // Calculate totalPrice based on nights
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    if (nights < 1) {
      return res.json({ success: false, message: "Booking must be at least 1 night" });
    }

    totalPrice *= nights;

    const booking = await Booking.create({
      user,
      room,
      hotel: roomData.hotel._id.toString(),
      guests: +guests,
      checkInDate,
      checkOutDate,
      totalPrice,
      paymentMethod: paymentMethod || "Pay At Hotel",
    });

    res.json({ success: true, message: "Booking created successfully" });

    void sendBookingConfirmationEmail({ user: req.user, booking, roomData }).catch((mailError) => {
      console.error("Booking email send failed:", mailError.message);
    });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message || "Failed to create booking" });
  }
};

// API to get all bookings for a user
// GET /api/bookings/user
export const getUserBookings = async (req, res) => {
  try {
    const user = req.user._id;
    const bookings = await Booking.find({ user }).populate("room hotel").sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    res.json({ success: false, message: "Failed to fetch bookings" });
  }
};


export const getHotelBookings = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ owner: req.user._id });
    if (!hotel) {
      return res.json({ success: false, message: "No Hotel found" });
    }
    const bookings = await Booking.find({ hotel: hotel._id }).populate("room hotel user").sort({ createdAt: -1 });
    // Total Bookings
    const totalBookings = bookings.length;
    // Total Revenue
    const totalRevenue = bookings.reduce((acc, booking) => acc + booking.totalPrice, 0);

    res.json({ success: true, dashboardData: { totalBookings, totalRevenue, bookings } });
  } catch (error) {
    res.json({ success: false, message: "Failed to fetch bookings" });
  }
};


export const stripePayment = async (req, res) => {
  try {

    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }
    if (booking.user !== req.user._id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    if (booking.isPaid) {
      return res.json({ success: false, message: "Booking is already paid" });
    }

    const roomData = await Room.findById(booking.room).populate("hotel");
    if (!roomData || !roomData.hotel) {
      return res.json({ success: false, message: "Room not found" });
    }
    const totalPrice = booking.totalPrice;

    const origin = req.headers.origin || process.env.CLIENT_URL;
    if (!origin) {
      return res.json({ success: false, message: "Client URL is not configured" });
    }

    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

    // Create Line Items for Stripe
    const line_items = [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: roomData.hotel.name,
          },
          unit_amount: totalPrice * 100,
        },
        quantity: 1,
      },
    ];

    // Create Checkout Session
    const session = await stripeInstance.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${origin}/loader/my-bookings`,
      cancel_url: `${origin}/my-bookings`,
      metadata: {
        bookingId: bookingId.toString(),
      },
    });
    res.json({ success: true, url: session.url });

  } catch (error) {
    res.json({ success: false, message: "Payment Failed" });
  }
}