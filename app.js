const express = require('express'); // Import express
const bodyParser = require('body-parser'); // Import body-parser
const fs = require('fs'); // Import fs for file operations
const path = require('path'); // Import path for file paths
const nodemailer = require('nodemailer'); // Import nodemailer for sending emails

const app = express(); // Create an instance of Express
const reservationsFile = path.join(__dirname, 'reservation_data.json'); // Path to reservations.json

// Middleware to serve static files
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true })); // For URL-encoded data
app.use(bodyParser.json()); // For JSON data

// Serve the index.html file
app.get('/', (req, res) => {
    console.log('inside app.get function');
    res.sendFile(path.join(__dirname, 'ride-booking.html'));
});

// Handle form submissions
app.post('booking_form', (req, res) => {
    console.log('inside app.post');
    const newReservation = {
        user_name: req.body.first_name,
        last_name: req.body.last_name,
        user_email: req.body.user_email,
        return_pickup_time: req.body.return_pickup_time,
    };

    // Read existing reservations from reservations.json
    fs.readFile(reservationsFile, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading reservation data');
        }

        let reservation_data = [];
        if (data) {
            reservation_data = JSON.parse(data); // Parse existing data if available
        }

        // Add the new reservation
        reservation_data.push(newReservation);

        // Write updated reservations back to the JSON file
        fs.writeFile(reservationsFile, JSON.stringify(reservation_data, null, 2), (err) => {
            if (err) {
                return res.status(500).send('Error saving reservation data');
            }

            // Send a confirmation email to the user
            sendConfirmationEmail(newReservation, (emailErr) => {
                if (emailErr) {
                    return res.status(500).send('Reservation stored, but error sending email');
                }
                console.log('Reservation stored successfully, and email sent!');
            });
        });
    });
});




// Function to send the confirmation email
function sendConfirmationEmail(reservation, callback) {
    // Set up nodemailer transport (use your email provider's SMTP settings)
    const transporter = nodemailer.createTransport({
        service: 'gmail', // Using Gmail, can be replaced with another email service
        auth: {
            user: '', // Replace with your email
            pass: '', // Replace with your email password or app password
        }
    });

    // Define the email options
    const mailOptions = {
        from: '', // Sender's email
        to: reservation.user_email, // Recipient's email (user's email)
        subject: 'Booking Confirmation', // Subject line
        text: `Hi ${reservation.user_name} ${reservation.last_name},\n\nThank you for booking a ride with us! We have successfully received your reservation.\n\nDetails:\nName: ${reservation.user_name} ${reservation.last_name}\nEmail: ${reservation.user_email}\n\nWe look forward to serving you!\n\nBest regards,\nThe Ride Booking Team` // Email body
    };

    // Send the email
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.error('Error sending email:', err);
            return callback(err);
        }
        console.log('Email sent:', info.response);
        callback(null); // No errors, email sent successfully
    });
}

// Start the server
const PORT = 3000; // Define port
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`); // Log the server status
});

