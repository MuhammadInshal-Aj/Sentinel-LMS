/**
 * Sentinel LMS - Configuration
 * Centralized API configuration with environment detection
 */

const CONFIG = {
    // API Configuration
    API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'  // Development
        : 'https://your-production-domain.com',  // Production (update this when deploying)
    
    // Supabase Configuration (for direct client access if needed)
    SUPABASE_URL: 'https://dtvdoyigadkdjkvjahna.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0dmRveWlnYWRrZGprdmphaG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NjgzMzksImV4cCI6MjA4NTM0NDMzOX0.VYoYd4Gkdt8kalCusROFZ1J-7Ha1N9ojF2hGJlnkHsE',
    
    // App Configuration
    APP_NAME: 'Sentinel LMS',
    VERSION: '1.0.0',
    
    // Feature Flags (enable/disable features)
    FEATURES: {
        TOKEN_SYSTEM: true,
        COURSE_UNLOCKING: true,
        CERTIFICATES: false,  // Not yet implemented
        LEADERBOARD: false    // Not yet implemented
    },
    
    // Token Rewards (centralized for consistency)
    TOKEN_REWARDS: {
        LESSON: 20,
        SIMULATION: 50,
        CHECKPOINT: 100,
        MODULE_COMPLETE: 200,
        COURSE_COMPLETE: 500
    },
    
    // Course Unlock Costs
    UNLOCK_COSTS: {
        INTERMEDIATE: 500,
        ADVANCED: 1000
    }
};

// Make available globally
window.CONFIG = CONFIG;

// For backward compatibility with existing code
window.API_URL = CONFIG.API_URL;

console.log(`🛡️ Sentinel LMS v${CONFIG.VERSION} - Environment: ${CONFIG.API_URL.includes('localhost') ? 'Development' : 'Production'}`);