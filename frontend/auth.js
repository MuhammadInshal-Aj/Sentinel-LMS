/**
 * Sentinel LMS - Authentication Utility
 * Shared authentication functions across all pages
 * Session-based auth storage (cleared on browser close)
 */

const Auth = {
    // Storage keys
    TOKEN_KEY: 'sentinel_token',
    REFRESH_KEY: 'sentinel_refresh_token',
    USER_KEY: 'sentinel_user',

    // Use sessionStorage for security (clears when browser closes)
    storage: sessionStorage,
    legacyStorage: localStorage,

    /**
     * Get stored authentication token
     * @returns {string|null} JWT token or null if not authenticated
     */
    getToken() {
        return this.storage.getItem(this.TOKEN_KEY);
    },

    /**
     * Get stored refresh token
     * @returns {string|null} Refresh token or null
     */
    getRefreshToken() {
        return this.storage.getItem(this.REFRESH_KEY);
    },

    /**
     * Get stored user data
     * @returns {object|null} User object or null
     */
    getUser() {
        const userStr = this.storage.getItem(this.USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    },

    /**
     * Store authentication token, refresh token, and user data
     * @param {string} token - JWT token
     * @param {object} user - User data object
     * @param {string} refreshToken - Refresh token
     */
    setAuth(token, user, refreshToken = null) {
        this.storage.setItem(this.TOKEN_KEY, token);
        if (refreshToken) this.storage.setItem(this.REFRESH_KEY, refreshToken);
        if (user) this.storage.setItem(this.USER_KEY, JSON.stringify(user));
        this.clearLegacy();
    },

    /**
     * Clear all authentication data
     */
    clearAuth() {
        this.storage.removeItem(this.TOKEN_KEY);
        this.storage.removeItem(this.REFRESH_KEY);
        this.storage.removeItem(this.USER_KEY);
        this.clearLegacy();
    },

    /**
     * Remove legacy localStorage tokens to prevent persistent sessions
     */
    clearLegacy() {
        this.legacyStorage.removeItem(this.TOKEN_KEY);
        this.legacyStorage.removeItem(this.REFRESH_KEY);
        this.legacyStorage.removeItem(this.USER_KEY);
    },

    /**
     * Check if user is authenticated
     * @returns {boolean} True if valid token exists
     */
    isAuthenticated() {
        const token = this.getToken();
        if (!token) return false;

        // Basic JWT expiration check (optional enhancement)
        try {
            const payload = this.parseJWT(token);
            const now = Math.floor(Date.now() / 1000);
            return payload && payload.exp > now;
        } catch {
            return !!token; // Fallback: just check if token exists
        }
    },

    /**
     * Parse JWT token payload (without verification - server does that)
     * @param {string} token - JWT token
     * @returns {object} Decoded payload
     */
    parseJWT(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64).split('').map(c =>
                    '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
                ).join('')
            );
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('JWT parse error:', error);
            return null;
        }
    },

    /**
     * Verify authentication and redirect if not authenticated
     * Call this on protected pages
     * @param {string} redirectUrl - URL to redirect to if not authenticated
     */
    requireAuth(redirectUrl = 'login.html') {
        if (!this.isAuthenticated()) {
            console.warn('Authentication required. Redirecting to login...');
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    },

    /**
     * Make authenticated API request
     * @param {string} endpoint - API endpoint (e.g., '/api/user/courses')
     * @param {object} options - Fetch options (method, body, etc.)
     * @returns {Promise<Response>} Fetch response
     */
    async fetchAPI(endpoint, options = {}) {
        const token = this.getToken();

        if (!token) {
            throw new Error('No authentication token found');
        }

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...(options.headers || {})
            }
        };

        try {
            const response = await fetch(`${window.API_URL}${endpoint}`, mergedOptions);

            // Handle unauthorized (token expired or invalid)
            if (response.status === 401) {
                this.clearAuth();
                window.location.href = 'login.html';
                throw new Error('Session expired. Please login again.');
            }

            return response;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },

    /**
     * Make authenticated API request and parse JSON response
     * @param {string} endpoint - API endpoint
     * @param {object} options - Fetch options
     * @returns {Promise<object>} Parsed JSON response
     */
    async fetchJSON(endpoint, options = {}) {
        const response = await this.fetchAPI(endpoint, options);

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }

        return await response.json();
    },

    /**
     * Logout user and redirect
     * @param {string} redirectUrl - URL to redirect after logout
     */
    logout(redirectUrl = 'login.html') {
        this.clearAuth();
        window.location.href = redirectUrl;
    },

    /**
     * Get authorization header object
     * Useful for custom fetch calls
     * @returns {object} Authorization header
     */
    getAuthHeader() {
        const token = this.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }
};

// Make available globally
window.Auth = Auth;

// Clear any legacy localStorage tokens on load
Auth.clearLegacy();

// Auto-check authentication on page load for protected pages
// Pages can opt-out by setting window.SKIP_AUTH_CHECK = true before this script loads
document.addEventListener('DOMContentLoaded', () => {
    if (window.SKIP_AUTH_CHECK) return;

    // List of public pages that don't require authentication
    const publicPages = ['login.html', 'register.html', 'landing.html', 'index.html'];
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Skip auth check for public pages
    if (publicPages.includes(currentPage)) return;

    // For all other pages, require authentication
    if (!Auth.isAuthenticated()) {
        console.warn(`Protected page: ${currentPage}. Redirecting to login...`);
        Auth.logout();
    }
});

console.log('Auth utility loaded');
