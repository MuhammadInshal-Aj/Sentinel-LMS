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

        let data = null;

        // Keep a copy of the catalog courses before the API call
        const catalogCourses = [...(window.coursesData?.myCourses || [])];

        try {
            console.log('Attempting API call to fetch courses...');
            data = await Api.getUserCourses();
            console.log('API call succeeded, enrolled courses:', data?.myCourses?.length || 0);

            // Transform API response and merge with catalog
            if (data.myCourses && data.myCourses.length > 0) {
                const enrolledCourses = data.myCourses.map(c => ({
                    id: c.slug || c.id,
                    title: c.title,
                    category: (c.level === 'foundation' || c.level === 'fundamentals')
                        ? 'fundamentals'
                        : 'intermediate',

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

                // Merge: update catalog courses with API progress, keep unenrolled ones
                const enrolledIds = new Set(enrolledCourses.map(c => c.id));
                const unenrolledCatalog = catalogCourses.filter(c => {
                    // Keep catalog course if its ID (or mapped slug) isn't in the enrolled set
                    const mappedSlug = window.COURSE_SLUG_MAP?.[c.id] || c.id;
                    return !enrolledIds.has(c.id) && !enrolledIds.has(mappedSlug);
                });
                // Only update progress, NEVER replace catalog order
window.coursesData.myCourses = catalogCourses.map(cat => {
    const match = enrolledCourses.find(e =>
        e.id === cat.id ||
        e.id === (window.COURSE_SLUG_MAP?.[cat.id] || cat.id)
    );
    return match ? { ...cat, progress: match.progress, meta: match.meta } : cat;
});

                console.log(`Merged: ${enrolledCourses.length} enrolled + ${unenrolledCatalog.length} catalog = ${window.coursesData.myCourses.length} total`);
            } else {
                // API succeeded but user has no enrollments — keep catalog as-is
                console.log('No enrolled courses from API, keeping catalog data');
            }
        } catch (apiError) {
            console.warn('API unavailable, falling back to local data:', apiError.message);
            // Keep the original catalog courses
            if (!window.coursesData) {
                throw new Error('Courses data not available (API failed and local data missing)');
            }
            if (!window.coursesData.myCourses) {
                window.coursesData.myCourses = [];
            }
            console.log(`Using local fallback data (${window.coursesData.myCourses.length} courses)`);
        }

        // Ensure we have valid data
        if (!window.coursesData || !window.coursesData.myCourses) {
            throw new Error('No course data available');
        }

        // Refresh token balance for My Courses header widgets.
        try {
            const tokenRes = await Api.getUserTokens();
            CoursesState.tokenBalance = tokenRes.tokens?.tokens_available ?? 0;
        } catch (tokenError) {
            console.warn('Could not refresh token balance:', tokenError.message);
        }

        CoursesState.courses = window.coursesData.myCourses;
        CoursesState.error = null;
        console.log(`Returning coursesData with ${CoursesState.courses.length} courses`);
        return window.coursesData;

    } catch (error) {
        console.error('❌ Failed to fetch courses:', error);
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
    console.log('⏳ Initializing My Courses page...');
    console.log('window.coursesData exists:', !!window.coursesData);
    if (window.coursesData) {
        console.log('coursesData.myCourses count:', window.coursesData.myCourses.length);
        console.log('coursesData.myCourses:', window.coursesData.myCourses);
    }

    // Start the loading animation
    const loadStartTime = Date.now();
    
    const data = await fetchMyCourses();
    console.log('fetchMyCourses returned data:', !!data);
    if (data) {
        console.log('Returned data.myCourses count:', data.myCourses?.length);
    }

    if (data && window.coursesData && window.coursesData.myCourses) {
        // Use the existing inline renderer (renderCoursesByCategory defined in index.html)
        console.log('renderCoursesByCategory function available:', typeof renderCoursesByCategory);
        
        if (typeof renderCoursesByCategory === 'function') {
            // Ensure minimum loading time for smooth UX (500ms)
            const loadElapsed = Date.now() - loadStartTime;
            const minLoadingTime = 500;
            
            if (loadElapsed < minLoadingTime) {
                await new Promise(resolve => setTimeout(resolve, minLoadingTime - loadElapsed));
            }
            
            console.log('✅ Rendering fundamentals courses...');
            renderCoursesByCategory(window.coursesData.myCourses, 'fundamentals');
            
            console.log('✅ Rendering intermediate courses...');
            renderCoursesByCategory(window.coursesData.myCourses, 'intermediate');

            // Update tab counts after rendering
            updateCoursesTabCounts(window.coursesData.myCourses);
        } else {
            console.error('❌ renderCoursesByCategory function not found!');
        }

        // Animate progress bars
        setTimeout(() => {
            document.querySelectorAll('.progress-bar-fill-courses').forEach(bar => {
                bar.style.transition = 'width 1s cubic-bezier(0.4, 0, 0.2, 1)';
            });
        }, 100);

        updateTokenDisplay();
        console.log('✅ My Courses initialized successfully');
    } else {
        console.error('❌ Failed to initialize My Courses. Data:', { data, coursesData: window.coursesData });
        // Show zeroes if no data
        updateCoursesTabCounts([]);
    }
}

// Count and update the tab values for Active, Available, Upcoming
function updateCoursesTabCounts(courses) {
    let active = 0, available = 0, upcoming = 0;
    if (Array.isArray(courses)) {
        courses.forEach(c => {
            if (window.UPCOMING_COURSE_IDS && window.UPCOMING_COURSE_IDS.has(c.id)) {
                upcoming++;
            } else if (c.progress && (c.progress.status === 'in-progress' || c.progress.status === 'completed')) {
                active++;
            } else {
                available++;
            }
        });
    }
    document.getElementById('activeCoursesCount').textContent = active;
    document.getElementById('availableCoursesCount').textContent = available;
    document.getElementById('upcomingCoursesCount').textContent = upcoming;
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
    const page = window.COURSE_PAGES?.[slug] || 'infoSec.html';
    const backendSlug = window.COURSE_SLUG_MAP?.[slug] || slug;
    console.log('Navigating to:', backendSlug, 'via', page);
    window.location.href = `${page}?course=${encodeURIComponent(backendSlug)}`;
}

// --- UI States ---

function showCoursesLoadingState() {
    ['fundamentals', 'intermediate'].forEach(level => {
        const grid = document.getElementById(`${level}-grid`);
        if (grid) {
            // Create skeleton cards with shimmer effect
            const skeletonCards = Array(3).fill(0).map((_, i) => `
                <article class="course-card skeleton-card" style="animation-delay: ${i * 0.1}s;">
                    <div class="card-header-courses">
                        <div style="flex: 1;">
                            <div class="skeleton skeleton-title"></div>
                            <div class="skeleton skeleton-badge" style="width: 100px; margin-top: 8px;"></div>
                        </div>
                    </div>

                    <div class="card-content-courses">
                        <div class="skeleton" style="height: 60px; margin-bottom: 1rem;"></div>
                        <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
                            <div class="skeleton" style="flex: 1; height: 40px;"></div>
                            <div class="skeleton" style="flex: 1; height: 40px;"></div>
                            <div class="skeleton" style="flex: 1; height: 40px;"></div>
                        </div>
                        <div class="skeleton" style="height: 40px;"></div>
                    </div>

                    <div class="card-actions-courses">
                        <div class="skeleton" style="height: 44px; border-radius: 6px;"></div>
                    </div>
                </article>
            `).join('');

            grid.innerHTML = skeletonCards;
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

// Make functions globally accessible
window.initializeMyCoursesPage = initializeMyCoursesPage;
window.navigateToCourse = navigateToCourse;
window.refreshMyCourses = initializeMyCoursesPage;
window.CoursesState = CoursesState;

console.log('✅ My Courses module loaded (async with local fallback)');
console.log('Available functions: window.initializeMyCoursesPage, window.navigateToCourse');
console.log('Global coursesData available:', !!window.coursesData);
