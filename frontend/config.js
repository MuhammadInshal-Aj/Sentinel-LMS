// Sentinel LMS - API Configuration
// This file automatically detects if you're running locally or in production

const API_CONFIG = {
    // If you're on localhost, use local backend
    // Otherwise, use your deployed backend URL
    getBaseURL: function() {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3000';
        } else {
            // TODO: Replace this with your actual deployed backend URL when ready
            // For example: 'https://sentinel-backend.onrender.com'
            return 'http://localhost:3000'; // Change this later when you deploy
        }
    }
};

// Export for use in other files
const API_URL = API_CONFIG.getBaseURL();
