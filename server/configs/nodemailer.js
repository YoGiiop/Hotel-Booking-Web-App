import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create a transporter object using the SMTP settings
const transporter = nodemailer.createTransport({
    // Brevo Hosting
    // host: 'smtp-relay.brevo.com',
    // port: 587,
    // auth: {
    //     user: process.env.SMTP_USER,
    //     pass: process.env.SMTP_PASS,
    // },

    // Gmail hosting
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
});

// Export the transporter
export default transporter;
