// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const PORT = process.env.PORT || 3000;

// ----- CORS Configuration (strict) -----
const allowedOrigins = ['https://nz1manager.github.io'];
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps, curl, etc.) â€” optional
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// ----- Google OAuth2 Client -----
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ----- Health check endpoint -----
app.get('/', (req, res) => {
  res.send('IELTS Actual Auth Backend â€” running');
});

// ----- Google token verification endpoint -----
app.post('/api/auth/google', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Missing token' });
    }

    // Verify the token with Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID, // same as frontend client ID
    });

    const payload = ticket.getPayload();
    const userId = payload['sub'];
    const email = payload['email'];
    const name = payload['name'];
    const picture = payload['picture'];

    // Here you can find or create the user in your own database
    // For now we return the verified user info

    return res.status(200).json({
      success: true,
      user: {
        id: userId,
        email,
        name,
        picture,
      },
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
  }
});

// ----- Start server -----
app.listen(PORT, () => {
  console.log(`âœ… Server listening on port ${PORT}`);
});
