const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');
const querystring = require('querystring');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initializeDatabase() {
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
        console.log('✅ Database ready');
    } catch (error) {
        console.error('❌ DB Error:', error);
    }
}
initializeDatabase();

// Google OAuth2 - Login boshlash
app.get('/auth/google', (req, res) => {
    const params = querystring.stringify({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: `${process.env.SERVER_URL}/auth/google/callback`,
        response_type: 'code',
        scope: 'email profile',
        access_type: 'offline',
        prompt: 'consent'
    });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// Callback - GitHub Pages uchun tozalangan redirect
app.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    const clientUrl = process.env.CLIENT_URL.replace(/\/$/, ""); // Oxiridagi slashni olib tashlaydi

    if (!code) return res.redirect(`${clientUrl}?error=no_code`);

    try {
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            code,
            redirect_uri: `${process.env.SERVER_URL}/auth/google/callback`,
            grant_type: 'authorization_code'
        });

        const userInfo = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
        });

        const { id: google_id, email, name, picture } = userInfo.data;
        const existingUser = await pool.query('SELECT * FROM users WHERE google_id = $1', [google_id]);

        if (existingUser.rows.length === 0) {
            const parts = name ? name.split(' ') : [];
            const newUser = await pool.query(
                `INSERT INTO users (google_id, email, first_name, last_name, avatar) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                [google_id, email, parts[0] || '', parts.slice(1).join(' ') || '', picture]
            );
            return res.redirect(`${clientUrl}?login=success&isNew=true&id=${newUser.rows[0].id}`);
        } else {
            const user = existingUser.rows[0];
            return res.redirect(`${clientUrl}?login=success&isNew=${!user.is_profile_complete}&id=${user.id}&name=${encodeURIComponent(user.first_name || '')}`);
        }
    } catch (error) {
        console.error('Auth error:', error.message);
        res.redirect(`${clientUrl}?error=auth_failed`);
    }
});

app.post('/api/profile', async (req, res) => {
    const { id, first_name, last_name, phone, group_name } = req.body;
    try {
        const result = await pool.query(
            `UPDATE users SET first_name = $1, last_name = $2, phone = $3, group_name = $4, is_profile_complete = true WHERE id = $5 RETURNING *`,
            [first_name, last_name, phone, group_name, id]
        );
        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
        res.json({ success: true, users: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => console.log(`🚀 Server on ${PORT}`));
