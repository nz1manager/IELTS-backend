const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. Google Auth boshlanishi
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

// 2. Google-dan qaytish va Frontend-ga ma'lumot uzatish
app.get('/auth/google/callback', async (req, res) => {
    // Bu yerda biz hozircha test rejimidamiz, shuning uchun 
    // foydalanuvchini silliq o'tkazish uchun ma'lumotlarni simulyatsiya qilamiz.
    // Yangi Frontend kodi aynan shu parametrlarni kutmoqda:
    const frontendUrl = 'https://nz1manager.github.io/IELTS-actual/';
    
    // Foydalanuvchini Dashboard-ga o'tkazish uchun kerakli parametrlar
    const params = new URLSearchParams({
        login: 'success',
        name: 'IELTS Student', // Haqiqiy Google API ulasak, bu yerga ism keladi
        email: 'user@example.com',
        source: 'google'
    });

    res.redirect(`${frontendUrl}?${params.toString()}`);
});

app.get('/', (req, res) => res.send('Backend is running and ready for IELTS Actual!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
