/**
 * Sentinel LMS - API Service Layer
 * Centralizes all backend API calls.
 * Public endpoints (login, register) use raw fetch + CONFIG.API_URL.
 * Authenticated endpoints delegate to Auth.fetchJSON().
 *
 * Depends on: config.js (CONFIG), auth.js (Auth)
 */

const Api = {

    // ─── Public Endpoints ────────────────────────────────────────────────────

    /**
     * Authenticate a user and return session + user data.
     * @param {string} email
     * @param {string} password
     * @returns {Promise<{session: object, user: object}>}
     */
    async login(email, password) {
        const response = await fetch(`${CONFIG.API_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
        return data;
    },

    /**
     * Register a new user account.
     * @param {string} firstName
     * @param {string} lastName
     * @param {string} email
     * @param {string} password
     * @returns {Promise<object>}
     */
    async register(firstName, lastName, email, password) {
        const response = await fetch(`${CONFIG.API_URL}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ first_name: firstName, last_name: lastName, email, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
        return data;
    },

    // ─── Authenticated Endpoints ──────────────────────────────────────────────

    /**
     * Fetch all published tracks (course catalog).
     * @returns {Promise<object[]>}
     */
    async getTracks() {
        return Auth.fetchJSON('/api/tracks');
    },

    /**
     * Fetch a single track with its modules and current user enrollment status.
     * @param {string} slug
     * @returns {Promise<object>}
     */
    async getTrack(slug) {
        return Auth.fetchJSON(`/api/tracks/${slug}`);
    },

    /**
     * Enroll the current user in a track.
     * @param {string} slug
     * @returns {Promise<object>}
     */
    async enrollInTrack(slug) {
        return Auth.fetchJSON(`/api/tracks/${slug}/enroll`, { method: 'POST' });
    },

    /**
     * Check whether the current user is enrolled in a track.
     * @param {string} slug
     * @returns {Promise<{enrolled: boolean}>}
     */
    async getEnrollment(slug) {
        return Auth.fetchJSON(`/api/tracks/${slug}/enrollment`);
    },

    /**
     * Fetch all courses the current user is enrolled in, with progress.
     * @returns {Promise<{myCourses: object[]}>}
     */
    async getUserCourses() {
        return Auth.fetchJSON('/api/user/courses');
    },

    /**
     * Fetch detailed progress for a specific track.
     * @param {string} slug
     * @returns {Promise<object>}
     */
    async getTrackProgress(slug) {
        return Auth.fetchJSON(`/api/user/tracks/${slug}/progress`);
    },

    /**
     * Mark a lesson as complete and award tokens.
     * @param {string} lessonId
     * @returns {Promise<object>}
     */
    async completeLesson(lessonId) {
        return Auth.fetchJSON(`/api/lessons/${lessonId}/complete`, { method: 'POST' });
    },

    /**
     * Fetch the current user's token balance.
     * @returns {Promise<{total_tokens: number, tokens_spent: number, tokens_available: number}>}
     */
    async getUserTokens() {
        return Auth.fetchJSON('/api/user/tokens');
    }
};

// Make available globally
window.Api = Api;

console.log('🌐 API service layer loaded');
