/**
 * Sentinel LMS - API Service Layer
 * Centralizes all backend API calls.
 * Public endpoints (login, register) use raw fetch + CONFIG.API_URL.
 * Authenticated endpoints delegate to Auth.fetchJSON().
 *
 * Depends on: config.js (CONFIG), auth.js (Auth)
 */

async function requestPublicApi(endpoint, options = {}) {
    const baseUrl = String(CONFIG.API_URL || '').replace(/\/+$/, '');

    if (!baseUrl || baseUrl.includes('your-production-domain.com')) {
        throw new Error('The backend API URL is not configured for this deployment. Update CONFIG.API_URL in config.js.');
    }

    const response = await fetch(`${baseUrl}${endpoint}`, options);
    const responseText = await response.text();
    let data = {};

    if (responseText) {
        try {
            data = JSON.parse(responseText);
        } catch (_) {
            if (!response.ok) {
                throw new Error(`Server returned HTTP ${response.status} instead of a valid API response.`);
            }
            throw new Error('Server returned an invalid API response.');
        }
    }

    if (!response.ok) {
        const error = new Error(data.error || `HTTP ${response.status}`);
        error.status = response.status;
        throw error;
    }

    return data;
}

const Api = {

    // ─── Public Endpoints ────────────────────────────────────────────────────

    /**
     * Authenticate a user and return session + user data.
     * @param {string} email
     * @param {string} password
     * @returns {Promise<{session: object, user: object}>}
     */
    async login(email, password) {
        return requestPublicApi('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
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
        return requestPublicApi('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ first_name: firstName, last_name: lastName, email, password })
        });
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
    },

    // ─── Content Delivery ────────────────────────────────────────────────────

    /**
     * Fetch the rendered markdown content and metadata for a lesson.
     * @param {string} lessonId  e.g. "infosec-m01-l01"
     * @returns {Promise<{id, title, content, estimatedTime, objectives}>}
     */
    async getLessonContent(lessonId) {
        return Auth.fetchJSON(`/api/lessons/${lessonId}/content`);
    },

    /**
     * Fetch a simulation scenario with choices for the interactive modal.
     * @param {string} simId  e.g. "infosec-m01-sim01"
     * @returns {Promise<{id, title, scenario, question, choices, tokens, insight}>}
     */
    async getSimulation(simId) {
        return Auth.fetchJSON(`/api/simulations/${simId}`);
    },

    /**
     * Submit a completed simulation (awards tokens, records attempt).
     * @param {string} simId
     * @param {string} choiceId  The choice the student selected
     * @returns {Promise<{tokensEarned, newBalance}>}
     */
    async submitSimulation(simId, choiceId) {
        return Auth.fetchJSON(`/api/simulations/${simId}/submit`, {
            method: 'POST',
            body: JSON.stringify({ choiceId })
        });
    },

    /**
     * Fetch checkpoint questions (static or AI-generated).
     * @param {string} checkpointId  e.g. "infosec-m01-checkpoint"
     * @returns {Promise<{id, title, questions, passingScore, tokens}>}
     */
    async getCheckpoint(checkpointId) {
        return Auth.fetchJSON(`/api/checkpoints/${checkpointId}`);
    },

    /**
     * Submit checkpoint answers, calculate score, award tokens if passed.
     * @param {string} checkpointId
     * @param {Array<{questionIdx, selectedIdx}>} answers
     * @returns {Promise<{score, passed, tokensEarned, newBalance}>}
     */
    async submitCheckpoint(checkpointId, answers) {
        return Auth.fetchJSON(`/api/checkpoints/${checkpointId}/submit`, {
            method: 'POST',
            body: JSON.stringify({ answers })
        });
    },

    // ─── AI Features ─────────────────────────────────────────────────────────

    /**
     * Generate quiz questions for a lesson using AI (Groq API).
     * @param {string} lessonId
     * @returns {Promise<{questions: Array}>}
     */
    async generateQuiz(lessonId) {
        return Auth.fetchJSON('/api/ai/generate-quiz', {
            method: 'POST',
            body: JSON.stringify({ lessonId })
        });
    },

    /**
     * Get a contextual hint for a student stuck on a lesson.
     * @param {string} lessonId
     * @param {string} question  What the student is struggling with
     * @returns {Promise<{hint: string}>}
     */
    async getHint(lessonId, question) {
        return Auth.fetchJSON('/api/ai/hint', {
            method: 'POST',
            body: JSON.stringify({ lessonId, question })
        });
    },

    /**
     * Get personalized AI feedback after a checkpoint submission.
     * @param {string} checkpointId
     * @param {number} score  0-100
     * @param {string[]} incorrectTopics  Topics the student struggled with
     * @returns {Promise<{feedback: string}>}
     */
    async getProgressFeedback(checkpointId, score, incorrectTopics) {
        return Auth.fetchJSON('/api/ai/feedback', {
            method: 'POST',
            body: JSON.stringify({ checkpointId, score, incorrectTopics })
        });
    },

    /**
     * Read AI configuration status from backend (public diagnostics endpoint).
     * @returns {Promise<{provider: string, configured: boolean, models: object}>}
     */
    async getAiStatus() {
        const response = await fetch(`${CONFIG.API_URL}/api/ai/status`, { cache: 'no-store' });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
        return data;
    }
};

// Make available globally
window.Api = Api;

console.log('[Sentinel] API service layer loaded');
