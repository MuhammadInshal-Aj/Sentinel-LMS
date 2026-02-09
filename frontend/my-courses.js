/**
 * Sentinel LMS - My Courses Integration
 * Handles backend API fetching with graceful fallback to local data.
 * Works with the existing course card renderer in index.html.
 */

// State Management
const CoursesState = {
    courses: [],
    tokenBalance: 0,
    isLoading: false,
    error: null
};

/**
 * Fetch courses from backend API, falling back to local coursesData
 */
async function fetchMyCourses() {
    try {
        CoursesState.isLoading = true;
        showCoursesLoadingState();

        const token = localStorage.getItem('sentinel_token');
        if (!token) throw new Error('Not authenticated');

        let data = null;

        try {
            // Attempt backend API call if API_URL is configured (from config.js)
            const apiUrl = (typeof API_URL !== 'undefined') ? API_URL : null;

            if (apiUrl) {
                const response = await fetch(`${apiUrl}/api/user/courses`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!response.ok) throw new Error(`API returned ${response.status}`);
                data = await response.json();

                // Transform API response into the coursesData format used by inline renderer
                if (data.myCourses) {
                    coursesData.myCourses = data.myCourses.map(c => ({
                        id: c.slug || c.id,
                        title: c.title,
                        category: c.level === 'foundation' ? 'fundamentals' : (c.level || c.category || 'fundamentals'),
                        description: c.description || '',
                        progress: {
                            percentage: c.overall_progress_percentage || 0,
                            status: c.overall_progress_percentage === 100 ? 'completed'
                                : c.overall_progress_percentage > 0 ? 'in-progress'
                                : 'not-started',
                            currentLesson: c.next_lesson?.title || null
                        },
                        meta: {
                            estimatedDuration: c.estimated_duration || '--',
                            modulesCount: c.modules_count || 0,
                            lessonsCount: c.total_lessons || 0
                        }
                    }));
                }
                console.log('Courses loaded from API');
            } else {
                throw new Error('No API_URL configured');
            }
        } catch (apiError) {
            console.warn('Backend API unavailable, using local data:', apiError.message);
            // coursesData already exists in index.html -- no transformation needed
        }

        CoursesState.courses = coursesData.myCourses || [];
        CoursesState.error = null;
        return coursesData;

    } catch (error) {
        console.error('Failed to fetch courses:', error);
        CoursesState.error = error.message;
        showCoursesErrorState(error.message);
        return null;
    } finally {
        CoursesState.isLoading = false;
    }
}

/**
 * Initialize the My Courses page.
 * Fetches data, then delegates rendering to the existing inline functions.
 */
async function initializeMyCoursesPage() {
    console.log('Initializing My Courses page...');

    const data = await fetchMyCourses();

    if (data) {
        // Use the existing inline renderer (renderCoursesByCategory defined in index.html)
        if (typeof renderCoursesByCategory === 'function') {
            renderCoursesByCategory(coursesData.myCourses, 'fundamentals');
            renderCoursesByCategory(coursesData.myCourses, 'intermediate');
        }

        // Animate progress bars
        setTimeout(() => {
            document.querySelectorAll('.progress-bar-fill-courses').forEach(bar => {
                bar.style.transition = 'width 1s cubic-bezier(0.4, 0, 0.2, 1)';
            });
        }, 100);

        updateTokenDisplay();
        console.log('My Courses initialized');
    }
}

// Token display update
function updateTokenDisplay() {
    const tokenElement = document.getElementById('tokenCount');
    if (tokenElement && CoursesState.tokenBalance !== undefined) {
        tokenElement.textContent = CoursesState.tokenBalance;
    }
}

// Course navigation
function navigateToCourse(slug) {
    console.log('Navigating to:', slug);
    window.location.href = `infoSec.html?course=${slug}`;
}

// --- UI States ---

function showCoursesLoadingState() {
    ['fundamentals', 'intermediate'].forEach(level => {
        const grid = document.getElementById(`${level}-grid`);
        if (grid) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem;">
                    <div style="width: 50px; height: 50px; border: 3px solid rgba(0, 242, 255, 0.1); border-top-color: var(--accent); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                    <p style="color: var(--text-muted);">Loading your courses...</p>
                </div>
            `;
        }
    });
}

function showCoursesErrorState(message) {
    const grid = document.getElementById('fundamentals-grid');
    if (grid) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem;">
                <i data-lucide="alert-circle" style="width: 48px; height: 48px; color: #ff4757; margin-bottom: 1rem;"></i>
                <h3 style="color: #ff4757; margin-bottom: 0.5rem;">Failed to load courses</h3>
                <p style="color: var(--text-muted); margin-bottom: 2rem;">${escapeHtmlSafe(message)}</p>
                <button onclick="initializeMyCoursesPage()" style="padding: 0.8rem 1.5rem; background: var(--accent); color: #000; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
                    <i data-lucide="refresh-cw" style="width: 16px; height: 16px;"></i>
                    Try Again
                </button>
            </div>
        `;
        lucide.createIcons();
    }
}

function escapeHtmlSafe(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// --- Global Exports ---

window.initializeMyCoursesPage = initializeMyCoursesPage;
window.navigateToCourse = navigateToCourse;
window.refreshMyCourses = initializeMyCoursesPage;
window.CoursesState = CoursesState;

console.log('My Courses module loaded (backend-integrated with local fallback)');