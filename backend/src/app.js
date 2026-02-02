const express = require('express');
const cors = require('cors'); // Prevents "Block" errors from the browser
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

// 1. Initialize Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// 2. Middleware
app.use(cors()); // Allows your HTML file to talk to this server
app.use(express.json());

// 3. The Registration API (The "Handshake")
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
        });

        if (authError) throw authError;

        // Save the "Designation Name" (Username) into our profiles table
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([
                { id: authData.user.id, username: username, email: email }
            ]);

        if (profileError) throw profileError;

        res.status(201).json({ message: "Clearance Granted. Check your email for verification!" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Health check route
app.get('/', (req, res) => {
  res.json({ status: 'Sentinel Backend: Online' });
});

module.exports = app;


// --- AUTHORIZATION ROUTE (Login) ---
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        // Success! Send back the session/user data
        res.status(200).json({ 
            message: "Access Granted, Agent.", 
            user: data.user,
            session: data.session 
        });
    } catch (error) {
        res.status(401).json({ error: "Authorization Failed: " + error.message });
    }
});