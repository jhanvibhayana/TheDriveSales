const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 3000;

// Connect to your local MongoDB database
mongoose.connect('mongodb://127.0.0.1:27017/salesacademy', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB database.');
});

// Define a Mongoose schema for user registration data
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        default: "",
    },
    age: Number,
    email: String,
    education: {
        type: String,
        default: "",
    },
    contact: {
        type: String,
        default: "",
    },


    // Add other fields here
});

const User = mongoose.model('User', userSchema);

// Use body-parser middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files (your HTML form)
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Handle form submission
app.post('/register', (req, res) => {
    const userData = req.body;

    // Create a new User document and save it to the database
    const newUser = new User(userData);
    newUser.save()
        .then(() => {
            console.log('User data saved successfully.');
            res.send('Registration successful!');
        })
        .catch((err) => {
            console.error('Error saving user data:', err);
            res.status(500).send('Internal Server Error');
        });
});

app.post('/save-data', (req, res) => {
    const email = req.body.email;
    console.log(req.body.email);
    // Create a new User document with just the email field and save it to the database
    const newUser = new User({ email });
    newUser.save()
        .then(() => {
            console.log('User email saved successfully.');
            res.send('Email saved!');
        })
        .catch((err) => {
            console.error('Error saving user email:', err);
            res.status(500).send('Internal Server Error');
        });
});
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



// Function to send reminder emails to users with incomplete data
async function sendReminderEmails() {
    try {
        // Query the database for users with incomplete data (e.g., missing name or phone)
        const incompleteUsers = await User.find({
            $or: [
                { name: "" },
                { age: { $exists: false } },
                { email: "" },
                { education: "" },
                { contact: "" },
            ]
        });

        if (incompleteUsers.length === 0) {
            console.log('No users with incomplete data found.');
            return;
        }

        // Create a transporter for sending emails
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                type: 'OAuth2',
                user: 'jhanvibhayana10@gmail.com',
                pass: '',
                clientId: process.env.OAUTH_CLIENTID,
                clientSecret: process.env.OAUTH_CLIENT_SECRET,
                refreshToken: process.env.OAUTH_REFRESH_TOKEN
            },
        });

        // Compose the email message
        const mailOptions = {
            from: 'jhanvibhayana10@gmail.com',
            subject: 'Complete Your Registration',
            text: 'Please complete your registration to Sales Academy by filling in the missing information.',
        };

        // Send reminder emails to users with incomplete data
        for (const user of incompleteUsers) {
            mailOptions.to = user.email;
            await transporter.sendMail(mailOptions);
            console.log(`Reminder email sent to ${user.email}`);
        }

        console.log('Reminder emails sent successfully!');
    } catch (error) {
        console.error('Error sending reminder emails:', error);
    }
}

// You can call the sendReminderEmails function whenever you want to send reminder emails.
// Example:
sendReminderEmails();
