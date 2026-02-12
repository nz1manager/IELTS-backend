const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');
const querystring = require('querystring');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Middleware sozlamalari
// CLIENT_URL Render panelida https://nz1manager.github.io/IELTS-platform bo'lishi kerak
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));
app.use(express.json());

// 2. Database ulanishi
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Jadvalni tekshirish
async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                google_id VARCHAR(255) UNIQUE,
                email VARCHAR(255) UNIQUE NOT NULL,
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                phone VARCHAR(20),
                group_name VARCHAR(100),
                avatar TEXT,
                is_profile_complete BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Baza tayyor');
    } catch (err) {
        console.error('❌ Baza xatosi:', err);
    }
}
initDB();

// 3. Google OAuth Login boshlash
app.get('/auth/google', (req, res) => {
    const params = querystring.stringify({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: `${process.env.SERVER_URL}/auth/google/callback`,
        response_type: 'code',
        scope: 'email profile',
        prompt: 'consent'
    });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// 4. Google OAuth Callback (Redirect muammosi shu yerda to'g'rilandi)
app.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    // CLIENT_URL oxiridagi slashni olib tashlaymiz xato bermasligi uchun
    const clientUrl = process.env.CLIENT_URL.replace(/\/$/, "");

    if (!code) return res.redirect(`${clientUrl}/?error=no_code`);

    try {
        // Token olish
        const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            code,
            redirect_uri: `${process.env.SERVER_URL}/auth/google/callback`,
            grant_type: 'authorization_code'
        });

        // User ma'lumotlarini Google'dan olish
        const userRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenRes.data.access_token}` }
        });

        const { id: google_id, email, name, picture } = userRes.data;
        const existing = await pool.query('SELECT * FROM users WHERE google_id = $1', [google_id]);

        let userId, isNew;
        if (existing.rows.length === 0) {
            const parts = name ? name.split(' ') : [];
            const newUser = await pool.query(
                `INSERT INTO users (google_id, email, first_name, last_name, avatar) 
                 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                [google_id, email, parts[0] || '', parts.slice(1).join(' ') || '', picture]
            );
            userId = newUser.rows[0].id;
            isNew = true;
        } else {
            userId = existing.rows[0].id;
            isNew = !existing.rows[0].is_profile_complete;
        }

        // GitHub Pages uchun to'g'ri redirect (sub-papkani hisobga oladi)
        res.redirect(`${clientUrl}/?login=success&isNew=${isNew}&id=${userId}`);

    } catch (error) {
        console.error('OAuth Error:', error.message);
        res.redirect(`${clientUrl}/?error=auth_failed`);
    }
});

// 5. Profilni saqlash API
app.post('/api/profile', async (req, res) => {
    const { id, first_name, last_name, phone, group_name } = req.body;
    try {
        const result = await pool.query(
            `UPDATE users 
             SET first_name = $1, last_name = $2, phone = $3, group_name = $4, is_profile_complete = true 
             WHERE id = $5 RETURNING *`,
            [first_name, last_name, phone, group_name, id]
        );
        
        if (result.rows.length > 0) {
            res.json({ success: true, user: result.rows[0] });
        } else {
            res.status(404).json({ success: false, error: "Foydalanuvchi topilmadi" });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 6. Admin uchun userlar ro'yxati
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
        res.json({ success: true, users: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => console.log(`🚀 Server ${PORT}-portda yondi` || "Server error"));
