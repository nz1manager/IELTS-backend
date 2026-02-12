// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 1. Google loginni boshlash
app.get('/auth/google', (req, res) => {
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=https://ielts-backend-5b7q.onrender.com/auth/google/callback&response_type=code&scope=profile%20email`;
  res.redirect(url);
});

// 2. Google-dan qaytish (Siz kiritgan Redirect URI)
app.get('/auth/google/callback', (req, res) => {
  // Login muvaffaqiyatli bo'lsa, foydalanuvchini saytingizga qaytarish
  // ?login=success qo'shimchasi bilan
  res.redirect('https://nz1manager.github.io/IELTS-actual/?login=success');
});

app.get('/', (req, res) => res.send('Server is Up!'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
