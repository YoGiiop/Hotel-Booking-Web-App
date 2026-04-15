import transporter from "../configs/nodemailer.js";
import Booking from "../models/Booking.js";
import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";
import User from "../models/User.js";
import stripe from "stripe";

const isDeliverableEmail = (email = "") => {
  if (!email) return false;
  if (email.endsWith("@placeholder.local")) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const normalizeDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
};

const getMailFromHeader = () => {
  const senderAddress = process.env.SENDER_EMAIL || process.env.GMAIL_USER;
  const senderName = process.env.SENDER_NAME || "QuickStay";

  if (!senderAddress) {
    return undefined;
  }

  return `${senderName} <${senderAddress}>`;
};

const getClerkUserProfile = async (userId) => {
  if (!userId || !process.env.CLERK_SECRET_KEY) return null;

  try {
    const response = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const email = data?.email_addresses?.find((item) => item.id === data.primary_email_address_id)?.email_address
      || data?.email_addresses?.[0]?.email_address
      || null;
    const username = [data?.first_name, data?.last_name].filter(Boolean).join(" ") || data?.username || null;

    return { email, username };
  } catch {
    return null;
  }
};

const resolveBookingEmailUser = async (user) => {
  if (!user?._id) return user;
  if (isDeliverableEmail(user.email)) return user;

  const clerkProfile = await getClerkUserProfile(user._id);

  if (!isDeliverableEmail(clerkProfile?.email)) {
    return user;
  }

  const updates = { email: clerkProfile.email };

  if (clerkProfile.username && (!user.username || user.username === "User")) {
    updates.username = clerkProfile.username;
  }

  const updatedUser = await User.findByIdAndUpdate(user._id, updates, { new: true });
  return updatedUser || { ...user, ...updates };
};

const sendBookingConfirmationEmail = async ({ user, booking, roomData }) => {
  const recipientUser = await resolveBookingEmailUser(user);
  const ownerEmail = roomData?.hotel?.owner?.email;

  if (!isDeliverableEmail(recipientUser?.email)) {
    return;
  }

  const mailOptions = {
    from: getMailFromHeader(),
    to: recipientUser.email,
    ...(isDeliverableEmail(ownerEmail) ? { replyTo: ownerEmail } : {}),
    subject: "Hotel Booking Details",
    html: `
      <h2>Your Booking Details</h2>
      <p>Dear ${recipientUser.username || "User"},</p>
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
    const roomData = await Room.findById(room).populate({
      path: "hotel",
      populate: {
        path: "owner",
        model: "User",
        select: "email username",
      },
    });
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
    const ownerHotels = await Hotel.find({ owner: req.user._id });
    const ownerHotelIds = ownerHotels.map((hotel) => hotel._id.toString());
    const { hotelId, startDate, endDate } = req.query;

    if (ownerHotelIds.length === 0) {
      return res.json({ success: false, message: "No Hotel found" });
    }

    const hotelIds = hotelId && ownerHotelIds.includes(hotelId)
      ? [hotelId]
      : ownerHotelIds;

    const bookingQuery = { hotel: { $in: hotelIds } };

    if (startDate || endDate) {
      bookingQuery.createdAt = {};

      if (startDate) {
        const normalizedStartDate = normalizeDate(startDate);
        if (!normalizedStartDate) {
          return res.json({ success: false, message: "Invalid start date" });
        }
        bookingQuery.createdAt.$gte = normalizedStartDate;
      }

      if (endDate) {
        const normalizedEndDate = normalizeDate(endDate);
        if (!normalizedEndDate) {
          return res.json({ success: false, message: "Invalid end date" });
        }
        normalizedEndDate.setHours(23, 59, 59, 999);
        bookingQuery.createdAt.$lte = normalizedEndDate;
      }
    }

    const totalRooms = await Room.countDocuments({ hotel: { $in: hotelIds } });
    const bookings = await Booking.find(bookingQuery).populate("room hotel user").sort({ createdAt: -1 });
    // Total Bookings
    const totalBookings = bookings.length;
    // Total Revenue
    const totalRevenue = bookings.reduce((acc, booking) => acc + booking.totalPrice, 0);
    const totalProfit = bookings
      .filter((booking) => booking.isPaid && booking.status !== "cancelled")
      .reduce((acc, booking) => acc + booking.totalPrice, 0);

    res.json({ success: true, dashboardData: { totalBookings, totalRooms, totalRevenue, totalProfit, bookings } });
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
      success_url: `${origin}/loader/my-bookings?session_id={CHECKOUT_SESSION_ID}`,
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

export const verifyStripePayment = async (req, res) => {
  try {
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.json({ success: false, message: "Session ID is required" });
    }

    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripeInstance.checkout.sessions.retrieve(sessionId);
    const bookingId = session?.metadata?.bookingId;

    if (!bookingId) {
      return res.json({ success: false, message: "Booking not found for this payment" });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    if (booking.user !== req.user._id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (session.payment_status === "paid") {
      booking.isPaid = true;
      booking.paymentMethod = "Stripe";
      if (booking.status === "pending") {
        booking.status = "confirmed";
      }
      await booking.save();

      return res.json({ success: true, isPaid: true });
    }

    res.json({ success: true, isPaid: false, message: "Payment is not completed yet" });
  } catch (error) {
    res.json({ success: false, message: error.message || "Payment verification failed" });
  }
}