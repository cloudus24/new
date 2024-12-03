const nodemailer = require("nodemailer");

/**
 * Sends an OTP or verification email.
 *
 * @param {string} email - The recipient's email address.
 * @param {string} subject - The subject of the email.
 * @param {string} htmlContent - The HTML content of the email.
 * @returns {Promise<void>}
 */
const sendOtpInEmail = async (email, subject, htmlContent) => {
  try {
    // Configure the transporter
    const transporter = nodemailer.createTransport({
      service: "gmail", // Use your email provider
      auth: {
        user: process.env.node_MailerEmailId, // Your email
        pass: process.env.node_MailerPassword, // Your email app password
      },
    });

    // Email options
    const mailOptions = {
      from: `"Your App Name" <${process.env.node_MailerEmailId}>`,
      to: email,
      subject,
      html: htmlContent,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${email}`);
  } catch (error) {
    console.error("Error sending email: ", error);
    throw new Error("Failed to send email");
  }
};

module.exports = sendOtpInEmail;
