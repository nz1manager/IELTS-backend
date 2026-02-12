const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. Google-ga yuborish (Tugma bosilganda)
app.get('/auth/google', (req, res) => {
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = {
        redirect_uri: 'https://ielts-backend-5b7q.onrender.com/auth/google/callback',
        client_id: process.env.GOOGLE_CLIENT_ID,
        access_type: 'offline',
        response_type: 'code',
        prompt: 'consent',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
        ].join(' '),
    };

    const qs = new URLSearchParams(options);
    res.redirect(`${rootUrl}?${qs.toString()}`);
});

// 2. Google-dan qaytganda (Foydalanuvchini saytga qaytarish)
app.get('/auth/google/callback', (req, res) => {
    // Bu yerda login muvaffaqiyatli bo'ldi deb hisoblaymiz
    // Va foydalanuvchini sizning Dashboard-ingizga yo'naltiramiz
    res.redirect('https://nz1manager.github.io/IELTS-actual/?login=success');
});

app.get('/', (req, res) => {
    res.send('Server is Up!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
