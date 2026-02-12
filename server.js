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

// PostgreSQL Connection Pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize Database
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
        console.log('✅ Database initialized: users table ready');
    } catch (error) {
        console.error('❌ Database initialization error:', error);
        process.exit(1);
    }
}

// Initialize DB on startup
initializeDatabase();

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Google OAuth2 - Initiate Login
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

// Google OAuth2 - Callback
app.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    
    if (!code) {
        // Xato bo'lsa ham asosiy sahifaga qaytaradi
        return res.redirect(`${process.env.CLIENT_URL}/?error=no_code`);
    }

    try {
        // Exchange code for access token
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            code,
            redirect_uri: `${process.env.SERVER_URL}/auth/google/callback`,
            grant_type: 'authorization_code'
        });

        const { access_token } = tokenResponse.data;

        // Fetch user info from Google
        const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const { id: google_id, email, name, picture } = userInfoResponse.data;
        
        const nameParts = name ? name.split(' ') : [];
        const first_name = nameParts[0] || '';
        const last_name = nameParts.slice(1).join(' ') || '';

        // Check if user exists
        const existingUser = await pool.query(
            'SELECT * FROM users WHERE email = $1 OR google_id = $2',
            [email, google_id]
        );

        // MUHIM: GitHub Pages uchun redirect manzillaridan /dashboard olib tashlandi
        if (existingUser.rows.length === 0) {
            const newUser = await pool.query(
                `INSERT INTO users (google_id, email, first_name, last_name, avatar, is_profile_complete)
                 VALUES ($1, $2, $3, $4, $5, false)
                 RETURNING id, first_name`,
                [google_id, email, first_name, last_name, picture]
            );

            const userId = newUser.rows[0].id;
            // Yangi foydalanuvchi -> isNew=true
            return res.redirect(
                `${process.env.CLIENT_URL}/?login=success&isNew=true&id=${userId}`
            );
        } else {
            const user = existingUser.rows[0];
            
            if (user.avatar !== picture) {
                await pool.query('UPDATE users SET avatar = $1 WHERE id = $2', [picture, user.id]);
            }

            // Mavjud foydalanuvchi -> isNew=false
            return res.redirect(
                `${process.env.CLIENT_URL}/?login=success&isNew=false&id=${user.id}&name=${encodeURIComponent(user.first_name || '')}`
            );
        }

    } catch (error) {
        console.error('Google OAuth error:', error.response?.data || error.message);
        return res.redirect(`${process.env.CLIENT_URL}/?error=auth_failed`);
    }
});

// API: Complete user profile
app.post('/api/profile', async (req, res) => {
    const { id, first_name, last_name, phone, group_name } = req.body;

    if (!id) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        const result = await pool.query(
            `UPDATE users 
             SET first_name = $1, 
                 last_name = $2, 
                 phone = $3, 
                 group_name = $4,
                 is_profile_complete = true
             WHERE id = $5
             RETURNING id, email, first_name, last_name, phone, group_name, avatar, is_profile_complete`,
            [first_name, last_name, phone, group_name, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ 
            success: true, 
            message: 'Profile completed successfully',
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// API: Get all users (Admin panel)
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, email, first_name, last_name, phone, group_name, avatar, 
                    is_profile_complete, created_at
             FROM users 
             ORDER BY created_at DESC`
        );

        res.json({
            success: true,
            count: result.rows.length,
            users: result.rows
        });

    } catch (error) {
        console.error('Fetch users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔗 OAuth callback URL: ${process.env.SERVER_URL}/auth/google/callback`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing connections...');
    await pool.end();
    process.exit(0);
});
