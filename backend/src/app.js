const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// ===== CURRICULUM CONTENT PATHS =====
const CURRICULUM_ROOT = path.join(__dirname, '../../curriculum');

const LESSON_CONTENT_MAP = {
    'infosec-m01-l01': path.join(CURRICULUM_ROOT, 'contents/information_security/infosec_module_1/lesson_1.md'),
    'infosec-m01-l02': null,
    'infosec-m01-l03': null,
    'infosec-m01-l04': null,
    'infosec-m01-l05': null
};

const SIMULATION_CONTENT_MAP = {
    'infosec-m01-sim01': path.join(CURRICULUM_ROOT, 'contents/information_security/infosec_module_1/simulations/sim-01-interactive.json'),
    'infosec-m01-sim02': path.join(CURRICULUM_ROOT, 'contents/information_security/infosec_module_1/simulations/sim-02-interactive.json')
};

const CHECKPOINT_MAP = {
    'infosec-m01-checkpoint': path.join(CURRICULUM_ROOT, 'contents/information_security/infosec_module_1/checkpoint-questions.json')
};

const LESSON_META_MAP = {
    'infosec-m01-l01': { title: 'What Is Information Security?', estimatedTime: 10, objectives: ['Define information security', 'Explain security controls', 'Understand attacker vs defender mindset'] },
    'infosec-m01-l02': { title: 'The CIA Triad', estimatedTime: 10, objectives: ['Explain Confidentiality, Integrity, Availability', 'Apply CIA Triad to real scenarios'] },
    'infosec-m01-l03': { title: 'Threats, Vulnerabilities, and Risk', estimatedTime: 15, objectives: ['Distinguish threats from vulnerabilities', 'Define risk in security context', 'Apply threat modelling basics'] },
    'infosec-m01-l04': { title: 'Secure by Design', estimatedTime: 10, objectives: ['Apply security-first design principles', 'Understand least privilege and fail-safe defaults'] },
    'infosec-m01-l05': { title: 'Defense in Depth', estimatedTime: 15, objectives: ['Explain layered security strategy', 'Design overlapping controls for resilience'] }
};

const TRACK_SLUG_ALIASES = {
    'information-security': 'information-security',
    'infosec': 'information-security'
};

function normalizeTrackSlug(slug) {
    if (!slug) return slug;
    return TRACK_SLUG_ALIASES[slug] || slug;
}

const app = express();

// ===== SUPABASE INITIALIZATION =====
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== HEALTH CHECK =====
app.get('/', (req, res) => {
    res.json({ 
        status: 'Sentinel Backend: Online',
        timestamp: new Date().toISOString()
    });
});

// ===== AUTHENTICATION MIDDLEWARE =====
async function authenticateUser(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        req.user = user; // Attach user to request
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
}

// ===== AUTHENTICATION ENDPOINTS =====

// Registration
app.post('/api/register', async (req, res) => {
    const { first_name, last_name, email, password } = req.body;

    if (!first_name || !last_name || !email || !password) {
        return res.status(400).json({ 
            error: 'All fields required: first_name, last_name, email, password' 
        });
    }

    try {
        const username = `${first_name} ${last_name}`;
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    display_name: username,
                    first_name: first_name,
                    last_name: last_name
                }
            }
        });

        if (authError) throw authError;

        res.status(201).json({ 
            message: "Clearance Granted! Registration successful.",
            userId: authData.user.id
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({ 
            error: error.message || 'Registration failed' 
        });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        res.status(200).json({ 
            message: "Access Granted, Agent.",
            user: {
                id: data.user.id,
                email: data.user.email,
                display_name: data.user.user_metadata?.display_name || 'Agent'
            },
            session: {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_at: data.session.expires_at
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({ error: "Authorization Failed: " + error.message });
    }
});

// ===== COURSE/TRACK ENDPOINTS =====

// Get all published tracks (for course catalog)
app.get('/api/tracks', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('tracks')
            .select('*')
            .eq('is_published', true)
            .order('created_at', { ascending: true });

        if (error) throw error;

        res.json({ tracks: data });
    } catch (error) {
        console.error('Error fetching tracks:', error);
        res.status(500).json({ error: 'Failed to fetch tracks' });
    }
});

// Get single track by slug with modules and user enrollment status
app.get('/api/tracks/:slug', authenticateUser, async (req, res) => {
    try {
        const slug = normalizeTrackSlug(req.params.slug);

        // Get track
        const { data: track, error: trackError } = await supabase
            .from('tracks')
            .select('*')
            .eq('slug', slug)
            .eq('is_published', true)
            .single();

        if (trackError) throw trackError;

        // Get modules
        const { data: modules, error: modulesError } = await supabase
            .from('modules')
            .select('*')
            .eq('track_id', track.id)
            .order('order_number', { ascending: true });

        if (modulesError) throw modulesError;

        // Check if user is enrolled
        const { data: enrollment } = await supabase
            .from('user_track_enrollments')
            .select('*')
            .eq('user_id', req.user.id)
            .eq('track_id', track.id)
            .single();

        // Get user's module progress
        const { data: moduleProgress } = await supabase
            .from('user_module_progress')
            .select('*')
            .eq('user_id', req.user.id)
            .in('module_id', modules.map(m => m.id));

        res.json({ 
            track, 
            modules,
            enrollment: enrollment || null,
            moduleProgress: moduleProgress || []
        });

    } catch (error) {
        console.error('Error fetching track:', error);
        res.status(500).json({ error: 'Failed to fetch track' });
    }
});

// Get module with lessons and user progress
app.get('/api/modules/:moduleId', authenticateUser, async (req, res) => {
    try {
        const { moduleId } = req.params;

        // Get module
        const { data: module, error: moduleError } = await supabase
            .from('modules')
            .select('*')
            .eq('id', moduleId)
            .single();

        if (moduleError) throw moduleError;

        // Get lessons
        const { data: lessons, error: lessonsError } = await supabase
            .from('lessons')
            .select('*')
            .eq('module_id', moduleId)
            .order('order_number', { ascending: true });

        if (lessonsError) throw lessonsError;

        // Get user's lesson progress
        const { data: lessonProgress } = await supabase
            .from('user_lesson_progress')
            .select('*')
            .eq('user_id', req.user.id)
            .in('lesson_id', lessons.map(l => l.id));

        res.json({ 
            module, 
            lessons,
            lessonProgress: lessonProgress || []
        });

    } catch (error) {
        console.error('Error fetching module:', error);
        res.status(500).json({ error: 'Failed to fetch module' });
    }
});

// ===== ENROLLMENT ENDPOINTS =====

// Enroll in a track
app.post('/api/tracks/:slug/enroll', authenticateUser, async (req, res) => {
    try {
        const requestedSlug = req.params.slug;
        const slug = normalizeTrackSlug(requestedSlug);

        // Get track
        const { data: track, error: trackError } = await supabase
            .from('tracks')
            .select('id, modules, token_cost, is_locked_by_default')
            .eq('slug', slug)
            .eq('is_published', true)
            .single();

        if (trackError || !track) {
            console.error('Track lookup failed for slug:', requestedSlug, 'normalized:', slug, trackError?.message);
            return res.status(404).json({ error: `Track "${requestedSlug}" not found or not published` });
        }

        // Check if track requires tokens
        if (track.is_locked_by_default && track.token_cost > 0) {
            const { data: tokens } = await supabase
                .from('user_tokens')
                .select('tokens_available')
                .eq('user_id', req.user.id)
                .single();

            if (!tokens || tokens.tokens_available < track.token_cost) {
                return res.status(400).json({
                    error: 'Insufficient tokens',
                    required: track.token_cost,
                    available: tokens?.tokens_available || 0
                });
            }

            const { data: spendResult, error: spendError } = await supabase
                .rpc('spend_user_tokens', {
                    p_user_id: req.user.id,
                    p_tokens: track.token_cost
                });

            if (spendError || !spendResult) {
                return res.status(400).json({ error: 'Failed to spend tokens' });
            }
        }

        // Get first module (handle missing modules array)
        const firstModuleId = track.modules?.[0];

        // Create enrollment
        const { data: enrollment, error: enrollmentError } = await supabase
            .from('user_track_enrollments')
            .insert([{
                user_id: req.user.id,
                track_id: track.id,
                current_module_id: firstModuleId || null,
                status: 'in-progress',
                unlocked_with_tokens: (track.token_cost || 0) > 0,
                tokens_spent: track.token_cost || 0
            }])
            .select()
            .single();

        if (enrollmentError) {
            if (enrollmentError.code === '23505') {
                return res.status(200).json({
                    message: 'Already enrolled',
                    alreadyEnrolled: true
                });
            }
            console.error('Enrollment insert error:', enrollmentError);
            return res.status(500).json({ error: 'Database error during enrollment' });
        }

        // Unlock first module (non-critical — don't fail enrollment if this errors)
        if (firstModuleId) {
            try {
                const { data: moduleData } = await supabase
                    .from('modules')
                    .select('lessons')
                    .eq('id', firstModuleId)
                    .single();

                if (moduleData) {
                    await supabase
                        .from('user_module_progress')
                        .insert([{
                            user_id: req.user.id,
                            module_id: firstModuleId,
                            is_unlocked: true,
                            unlocked_at: new Date().toISOString(),
                            total_lessons: moduleData.lessons?.length || 0
                        }]);
                }
            } catch (moduleErr) {
                console.warn('Module unlock failed (non-critical):', moduleErr.message);
            }
        }

        res.status(201).json({
            message: 'Enrollment successful',
            enrollment,
            tokensSpent: track.token_cost || 0
        });

    } catch (error) {
        console.error('Enrollment error:', error);
        res.status(500).json({ error: error.message || 'Failed to enroll' });
    }
});

// Check enrollment status (for infoSec.html)
app.get('/api/tracks/:slug/enrollment', authenticateUser, async (req, res) => {
    try {
        const slug = normalizeTrackSlug(req.params.slug);

        // Get track
        const { data: track } = await supabase
            .from('tracks')
            .select('id')
            .eq('slug', slug)
            .single();

        if (!track) {
            // Track not in DB yet — return unenrolled (don't 404, let the page load)
            return res.json({ isEnrolled: false, enrollment: null, trackMissing: true });
        }

        // Get enrollment
        const { data: enrollment } = await supabase
            .from('user_track_enrollments')
            .select('*')
            .eq('user_id', req.user.id)
            .eq('track_id', track.id)
            .single();

        res.json({
            isEnrolled: !!enrollment,
            enrollment: enrollment || null
        });

    } catch (error) {
        console.error('Error checking enrollment:', error);
        res.status(500).json({ error: 'Failed to check enrollment' });
    }
});

// ===== PROGRESS TRACKING ENDPOINTS =====

// ============================================
// CORRECTED /api/user/courses ENDPOINT
// Replace lines 382-428 in your app.js with this code
// ============================================

// Get user's enrolled courses (for My Courses page) - REVISED for DB Schema
app.get('/api/user/courses', authenticateUser, async (req, res) => {
    try {
        // Get user's token balance
        const { data: tokenData } = await supabase
            .from('user_tokens')
            .select('tokens_available')
            .eq('user_id', req.user.id)
            .single();

        const tokenBalance = tokenData?.tokens_available || 0;

        // Fetch enrolled tracks with progress
        const { data: enrollments, error: enrollError } = await supabase
            .from('user_track_enrollments')
            .select(`
                *,
                tracks (*)
            `)
            .eq('user_id', req.user.id);

        if (enrollError) throw enrollError;

        // Process each enrollment
        const myCourses = await Promise.all(
            enrollments.map(async (enrollment) => {
                const track = enrollment.tracks;

                // Get all lessons for this track
                const { data: lessons } = await supabase
                    .from('lessons')
                    .select('id, is_required, token_reward, module_id')
                    .in('module_id', track.modules);

                // Filter required lessons
                const requiredLessons = lessons?.filter(l => l.is_required !== false) || [];
                const totalLessons = requiredLessons.length;

                // Count completed lessons
                const { data: completedLessons } = await supabase
                    .from('user_lesson_progress')
                    .select('lesson_id, tokens_earned')
                    .eq('user_id', req.user.id)
                    .eq('status', 'completed')
                    .in('lesson_id', requiredLessons.map(l => l.id));

                const lessonsCompleted = completedLessons?.length || 0;
                const tokensEarned = completedLessons?.reduce((sum, l) => sum + (l.tokens_earned || 0), 0) || 0;

                // Get next lesson details if exists
                let nextLesson = null;
                if (enrollment.current_lesson_id) {
                    const { data: lessonData } = await supabase
                        .from('lessons')
                        .select(`
                            id,
                            title,
                            modules!inner (
                                title
                            )
                        `)
                        .eq('id', enrollment.current_lesson_id)
                        .single();

                    if (lessonData) {
                        nextLesson = {
                            id: lessonData.id,
                            title: lessonData.title,
                            module_title: lessonData.modules?.title
                        };
                    }
                }

                return {
                    id: track.id,
                    title: track.title,
                    slug: track.slug,
                    level: track.level, // foundation, intermediate, advanced
                    description: track.description,
                    cover_image: track.meta?.cover_image || `/assets/courses/${track.slug}.jpg`,

                    status: enrollment.status,
                    overall_progress_percentage: enrollment.overall_progress_percentage,

                    lessons_completed: lessonsCompleted,
                    total_lessons: totalLessons,
                    tokens_earned: tokensEarned,

                    next_lesson: nextLesson
                };
            })
        );

        res.json({
            myCourses,
            tokenBalance
        });

    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
});

// Get user's progress for a specific track
app.get('/api/user/tracks/:slug/progress', authenticateUser, async (req, res) => {
    try {
        const slug = normalizeTrackSlug(req.params.slug);

        // Get track
        const { data: track } = await supabase
            .from('tracks')
            .select('id, modules')
            .eq('slug', slug)
            .single();

        if (!track) {
            return res.status(404).json({ error: 'Track not found' });
        }

        // Get enrollment
        const { data: enrollment } = await supabase
            .from('user_track_enrollments')
            .select('*')
            .eq('user_id', req.user.id)
            .eq('track_id', track.id)
            .single();

        // Get module progress
        const { data: moduleProgress } = await supabase
            .from('user_module_progress')
            .select('*')
            .eq('user_id', req.user.id)
            .in('module_id', track.modules);

        // Get lesson progress for all modules
        const { data: allLessons } = await supabase
            .from('lessons')
            .select('id')
            .in('module_id', track.modules);

        const lessonIds = allLessons.map(l => l.id);

        const { data: lessonProgress } = await supabase
            .from('user_lesson_progress')
            .select('*')
            .eq('user_id', req.user.id)
            .in('lesson_id', lessonIds);

        res.json({
            enrollment,
            moduleProgress: moduleProgress || [],
            lessonProgress: lessonProgress || []
        });

    } catch (error) {
        console.error('Error fetching progress:', error);
        res.status(500).json({ error: 'Failed to fetch progress' });
    }
});

// Complete a lesson
app.post('/api/lessons/:lessonId/complete', authenticateUser, async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { score } = req.body; // Optional: for simulations/checkpoints

        // Get lesson details
        const { data: lesson, error: lessonError } = await supabase
            .from('lessons')
            .select('*, modules(track_id, id)')
            .eq('id', lessonId)
            .single();

        if (lessonError || !lesson) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        // Check if already completed
        const { data: existing } = await supabase
            .from('user_lesson_progress')
            .select('status')
            .eq('user_id', req.user.id)
            .eq('lesson_id', lessonId)
            .single();

        if (existing?.status === 'completed') {
            return res.status(200).json({ 
                message: 'Lesson already completed',
                alreadyCompleted: true
            });
        }

        // Mark lesson as complete
        const { data: progress, error: progressError } = await supabase
            .from('user_lesson_progress')
            .upsert({
                user_id: req.user.id,
                lesson_id: lessonId,
                status: 'completed',
                completed_at: new Date().toISOString(),
                tokens_earned: lesson.token_reward,
                exam_score: score || null,
                attempts_count: (existing?.attempts_count || 0) + 1
            }, {
                onConflict: 'user_id,lesson_id'
            })
            .select()
            .single();

        if (progressError) throw progressError;

        // Add tokens
        await supabase.rpc('add_user_tokens', {
            p_user_id: req.user.id,
            p_tokens: lesson.token_reward
        });

        // Calculate and update module progress
        const { data: allModuleLessons } = await supabase
            .from('lessons')
            .select('id, is_required')
            .eq('module_id', lesson.modules.id);

        const requiredLessons = allModuleLessons.filter(l => l.is_required);
        const lessonIds = requiredLessons.map(l => l.id);

        const { data: completedLessons } = await supabase
            .from('user_lesson_progress')
            .select('id')
            .eq('user_id', req.user.id)
            .eq('status', 'completed')
            .in('lesson_id', lessonIds);

        const completedCount = completedLessons.length;
        const totalLessons = requiredLessons.length;
        const percentage = Math.round((completedCount / totalLessons) * 100);

        await supabase
            .from('user_module_progress')
            .upsert({
                user_id: req.user.id,
                module_id: lesson.modules.id,
                lessons_completed: completedCount,
                total_lessons: totalLessons,
                progress_percentage: percentage,
                completed_at: percentage === 100 ? new Date().toISOString() : null
            }, {
                onConflict: 'user_id,module_id'
            });

        // If module complete, unlock next module
        let unlockedModule = null;
        if (percentage === 100) {
            const { data: nextModuleId } = await supabase.rpc('unlock_next_module', {
                p_user_id: req.user.id,
                p_current_module_id: lesson.modules.id
            });
            unlockedModule = nextModuleId;
        }

        // Update overall track progress
        await supabase.rpc('calculate_track_progress', {
            p_user_id: req.user.id,
            p_track_id: lesson.modules.track_id
        });

        const { data: updatedTokens } = await supabase
            .from('user_tokens').select('tokens_available').eq('user_id', req.user.id).single();

        res.json({
            message: 'Lesson completed successfully',
            tokensEarned: lesson.token_reward,
            newBalance: updatedTokens?.tokens_available || 0,
            moduleProgress: percentage,
            moduleCompleted: percentage === 100,
            unlockedModule: unlockedModule
        });

    } catch (error) {
        console.error('Error completing lesson:', error);
        res.status(500).json({ error: 'Failed to complete lesson' });
    }
});

// ===== TOKEN ENDPOINTS =====

// Get user's token balance
app.get('/api/user/tokens', authenticateUser, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('user_tokens')
            .select('*')
            .eq('user_id', req.user.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        res.json({
            tokens: data || {
                total_tokens: 0,
                tokens_spent: 0,
                tokens_available: 0
            }
        });

    } catch (error) {
        console.error('Error fetching tokens:', error);
        res.status(500).json({ error: 'Failed to fetch tokens' });
    }
});

// ===== CONTENT DELIVERY ENDPOINTS =====

// GET /api/lessons/:lessonId/content — serve lesson markdown from filesystem
app.get('/api/lessons/:lessonId/content', authenticateUser, (req, res) => {
    const { lessonId } = req.params;
    const filePath = LESSON_CONTENT_MAP[lessonId];
    const meta = LESSON_META_MAP[lessonId];

    if (!meta) {
        return res.status(404).json({ error: `Lesson '${lessonId}' not found` });
    }

    let content = null;
    if (filePath) {
        try {
            content = fs.readFileSync(filePath, 'utf-8');
        } catch (err) {
            console.warn(`Could not read lesson file for ${lessonId}:`, err.message);
        }
    }

    if (!content) {
        content = `# ${meta.title}\n\n> This lesson content is being prepared. Check back soon.\n\n**Objectives:**\n${meta.objectives.map(o => `- ${o}`).join('\n')}`;
    }

    res.json({
        id: lessonId,
        title: meta.title,
        estimatedTime: meta.estimatedTime,
        objectives: meta.objectives,
        content
    });
});

// GET /api/simulations/:simId — serve simulation scenario with interactive choices
app.get('/api/simulations/:simId', authenticateUser, (req, res) => {
    const { simId } = req.params;
    const filePath = SIMULATION_CONTENT_MAP[simId];

    if (!filePath) {
        return res.status(404).json({ error: `Simulation '${simId}' not found` });
    }

    try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const sim = JSON.parse(raw);
        res.json(sim);
    } catch (err) {
        console.error(`Error loading simulation ${simId}:`, err.message);
        res.status(500).json({ error: 'Failed to load simulation content' });
    }
});

// POST /api/simulations/:simId/submit — record completion and award tokens
app.post('/api/simulations/:simId/submit', authenticateUser, async (req, res) => {
    const { simId } = req.params;
    const { choiceId } = req.body;

    const filePath = SIMULATION_CONTENT_MAP[simId];
    if (!filePath) {
        return res.status(404).json({ error: `Simulation '${simId}' not found` });
    }

    try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const sim = JSON.parse(raw);
        const tokensEarned = sim.tokens || 5;

        // Check if already completed
        const { data: existing } = await supabase
            .from('user_lesson_progress')
            .select('status')
            .eq('user_id', req.user.id)
            .eq('lesson_id', simId)
            .single();

        if (existing?.status === 'completed') {
            const { data: tokenData } = await supabase
                .from('user_tokens').select('tokens_available').eq('user_id', req.user.id).single();
            return res.json({ message: 'Already completed', alreadyCompleted: true, tokensEarned: 0, newBalance: tokenData?.tokens_available || 0 });
        }

        // Record completion
        await supabase.from('user_lesson_progress').upsert({
            user_id: req.user.id,
            lesson_id: simId,
            status: 'completed',
            completed_at: new Date().toISOString(),
            tokens_earned: tokensEarned,
            exam_score: null,
            attempts_count: 1
        }, { onConflict: 'user_id,lesson_id' });

        // Award tokens
        await supabase.rpc('add_user_tokens', { p_user_id: req.user.id, p_tokens: tokensEarned });

        const { data: tokenData } = await supabase
            .from('user_tokens').select('tokens_available').eq('user_id', req.user.id).single();

        res.json({ message: 'Simulation completed', tokensEarned, newBalance: tokenData?.tokens_available || 0 });

    } catch (err) {
        console.error(`Error submitting simulation ${simId}:`, err.message);
        res.status(500).json({ error: 'Failed to record simulation completion' });
    }
});

// GET /api/checkpoints/:checkpointId — serve checkpoint questions
app.get('/api/checkpoints/:checkpointId', authenticateUser, (req, res) => {
    const { checkpointId } = req.params;
    const filePath = CHECKPOINT_MAP[checkpointId];

    if (!filePath) {
        return res.status(404).json({ error: `Checkpoint '${checkpointId}' not found` });
    }

    try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const checkpoint = JSON.parse(raw);
        res.json(checkpoint);
    } catch (err) {
        console.error(`Error loading checkpoint ${checkpointId}:`, err.message);
        res.status(500).json({ error: 'Failed to load checkpoint' });
    }
});

// POST /api/checkpoints/:checkpointId/submit — grade answers, award tokens if passed
app.post('/api/checkpoints/:checkpointId/submit', authenticateUser, async (req, res) => {
    const { checkpointId } = req.params;
    const { answers } = req.body; // [{questionIdx, selectedIdx}]

    const filePath = CHECKPOINT_MAP[checkpointId];
    if (!filePath) {
        return res.status(404).json({ error: `Checkpoint '${checkpointId}' not found` });
    }

    try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const checkpoint = JSON.parse(raw);

        // Grade answers
        let correct = 0;
        answers.forEach(({ questionIdx, selectedIdx }) => {
            const q = checkpoint.questions[questionIdx];
            if (q && q.choices[selectedIdx]?.isCorrect) correct++;
        });

        const score = Math.round((correct / checkpoint.questions.length) * 100);
        const passed = score >= (checkpoint.passing_score || 70);
        const tokensEarned = passed ? (checkpoint.tokens || 100) : 0;

        // Record attempt in user_lesson_progress
        const { data: existing } = await supabase
            .from('user_lesson_progress')
            .select('attempts_count, status')
            .eq('user_id', req.user.id)
            .eq('lesson_id', checkpointId)
            .single();

        const attempts = (existing?.attempts_count || 0) + 1;

        await supabase.from('user_lesson_progress').upsert({
            user_id: req.user.id,
            lesson_id: checkpointId,
            status: passed ? 'completed' : 'attempted',
            completed_at: passed ? new Date().toISOString() : null,
            tokens_earned: passed ? tokensEarned : 0,
            exam_score: score,
            attempts_count: attempts
        }, { onConflict: 'user_id,lesson_id' });

        // Award tokens if passed
        if (passed && tokensEarned > 0) {
            await supabase.rpc('add_user_tokens', { p_user_id: req.user.id, p_tokens: tokensEarned });
        }

        const { data: tokenData } = await supabase
            .from('user_tokens').select('tokens_available').eq('user_id', req.user.id).single();

        res.json({ score, passed, correct, total: checkpoint.questions.length, tokensEarned, newBalance: tokenData?.tokens_available || 0 });

    } catch (err) {
        console.error(`Error submitting checkpoint ${checkpointId}:`, err.message);
        res.status(500).json({ error: 'Failed to submit checkpoint' });
    }
});

// ===== AI ENDPOINTS (Groq — free tier) =====
// Free API key: https://console.groq.com  (no credit card required)

function getGroqClient() {
    if (!process.env.GROQ_API_KEY) return null;
    const Groq = require('groq-sdk');
    return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

// POST /api/ai/hint — contextual learning hint (Llama 3 8B)
app.post('/api/ai/hint', authenticateUser, async (req, res) => {
    const { lessonId, question } = req.body;
    if (!lessonId || !question) {
        return res.status(400).json({ error: 'lessonId and question are required' });
    }

    const groq = getGroqClient();
    if (!groq) return res.status(503).json({ error: 'AI not configured — add GROQ_API_KEY to .env (free at console.groq.com)' });

    try {
        const meta = LESSON_META_MAP[lessonId];
        const filePath = LESSON_CONTENT_MAP[lessonId];
        let lessonContext = meta ? `Lesson: ${meta.title}\nObjectives: ${meta.objectives.join(', ')}` : '';
        if (filePath) {
            try { lessonContext = fs.readFileSync(filePath, 'utf-8').slice(0, 2000); } catch (_) {}
        }

        const completion = await groq.chat.completions.create({
            model: 'llama3-8b-8192',
            max_tokens: 180,
            messages: [
                { role: 'system', content: 'You are a patient cybersecurity instructor. Give concise hints (1-2 sentences) that guide thinking without giving away answers. Be encouraging.' },
                { role: 'user', content: `Student studying "${meta?.title || lessonId}" asked: "${question}"\n\nContext:\n${lessonContext}` }
            ]
        });

        res.json({ hint: completion.choices[0].message.content });
    } catch (err) {
        console.error('AI hint error:', err.message);
        res.status(500).json({ error: 'Failed to generate hint' });
    }
});

// POST /api/ai/generate-quiz — generate MCQ questions (Llama 3.3 70B)
app.post('/api/ai/generate-quiz', authenticateUser, async (req, res) => {
    const { lessonId } = req.body;
    if (!lessonId) return res.status(400).json({ error: 'lessonId is required' });

    const groq = getGroqClient();
    if (!groq) return res.status(503).json({ error: 'AI not configured — add GROQ_API_KEY to .env (free at console.groq.com)' });

    const meta = LESSON_META_MAP[lessonId];
    if (!meta) return res.status(404).json({ error: 'Lesson not found' });

    const filePath = LESSON_CONTENT_MAP[lessonId];
    let content = `Lesson: ${meta.title}\nObjectives: ${meta.objectives.join(', ')}`;
    if (filePath) {
        try { content = fs.readFileSync(filePath, 'utf-8').slice(0, 3500); } catch (_) {}
    }

    try {
        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            max_tokens: 1200,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: 'You generate cybersecurity quiz questions as JSON only. No markdown, no explanation outside the JSON.' },
                { role: 'user', content: `Generate 5 MCQs for this lesson. Format: {"questions":[{"question":"...","topic":"...","choices":[{"text":"...","isCorrect":false},{"text":"...","isCorrect":true},{"text":"...","isCorrect":false},{"text":"...","isCorrect":false}],"explanation":"..."}]}\n\nLesson:\n${content}` }
            ]
        });

        const parsed = JSON.parse(completion.choices[0].message.content);
        res.json(parsed);
    } catch (err) {
        console.error('AI quiz gen error:', err.message);
        res.status(500).json({ error: 'Failed to generate quiz questions' });
    }
});

// POST /api/ai/feedback — personalized progress feedback (Llama 3.3 70B)
app.post('/api/ai/feedback', authenticateUser, async (req, res) => {
    const { checkpointId, score, incorrectTopics } = req.body;

    const groq = getGroqClient();
    if (!groq) return res.status(503).json({ error: 'AI not configured — add GROQ_API_KEY to .env (free at console.groq.com)' });

    try {
        const topicsText = incorrectTopics?.length ? incorrectTopics.join(', ') : 'general concepts';

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            max_tokens: 250,
            messages: [
                { role: 'system', content: 'You are a cybersecurity educator. Give direct, professional feedback in 2-3 sentences. Acknowledge the score, mention what to review, and motivate without being cheerful.' },
                { role: 'user', content: `Student scored ${score}% on "${checkpointId}". Struggled with: ${topicsText}.` }
            ]
        });

        res.json({ feedback: completion.choices[0].message.content });
    } catch (err) {
        console.error('AI feedback error:', err.message);
        res.status(500).json({ error: 'Failed to generate feedback' });
    }
});

module.exports = app;
