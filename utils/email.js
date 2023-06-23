const nodemailer = require('nodemailer');

const sendEmail = async options => {
  // 1) create transporter (service that will send email itself)
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // 2) Define email options
  const mailOptions = {
    from: 'Zygimantas Vaitkunas <test@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
  };

  // 3) send email
  await transporter.sendMail(mailOptions); // returns promise
};

module.exports = sendEmail;
