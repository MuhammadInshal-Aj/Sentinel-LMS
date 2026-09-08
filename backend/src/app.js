const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

function normalizeEnvValue(value) {
    if (!value) return '';
    return String(value).trim().replace(/^['"“”‘’]|['"“”‘’]$/g, '');
}

function decodeJwtRole(token) {
    try {
        const payload = token.split('.')[1];
        const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        return parsed.role || null;
    } catch (_) {
        return null;
    }
}

// ===== CURRICULUM CONTENT PATHS =====
const CURRICULUM_ROOT = path.join(__dirname, '../../curriculum');

const LESSON_CONTENT_MAP = {
    // Module 01 — Security Mindset & Core Principles
    'infosec-m01-l01': path.join(CURRICULUM_ROOT, 'contents/information_security/infosec_module_1/lesson_1.md'),
    'infosec-m01-l02': path.join(CURRICULUM_ROOT, 'contents/information_security/infosec_module_1/lesson_2.md'),
    'infosec-m01-l03': path.join(CURRICULUM_ROOT, 'contents/information_security/infosec_module_1/lesson_3.md'),
    'infosec-m01-l04': path.join(CURRICULUM_ROOT, 'contents/information_security/infosec_module_1/lesson_4.md'),
    'infosec-m01-l05': null,
    // Module 02 — Risk Management
    'infosec-m02-l01': path.join(CURRICULUM_ROOT, 'contents/information_security/infosec_module_2/lesson_1.md'),
    'infosec-m02-l02': path.join(CURRICULUM_ROOT, 'contents/information_security/infosec_module_2/lesson_2.md'),
    'infosec-m02-l03': path.join(CURRICULUM_ROOT, 'contents/information_security/infosec_module_2/lesson_3.md'),
    'infosec-m02-l04': path.join(CURRICULUM_ROOT, 'contents/information_security/infosec_module_2/lesson_4.md'),
    'infosec-m02-l05': path.join(CURRICULUM_ROOT, 'contents/information_security/infosec_module_2/lesson_5.md'),
    // Module 03 — Defensive Architecture
    'infosec-m03-l01': path.join(CURRICULUM_ROOT, 'contents/information_security/infosec_module_3/lesson_1.md'),
    'infosec-m03-l02': path.join(CURRICULUM_ROOT, 'contents/information_security/infosec_module_3/lesson_2.md'),
    'infosec-m03-l03': path.join(CURRICULUM_ROOT, 'contents/information_security/infosec_module_3/lesson_3.md'),
    'infosec-m03-l04': path.join(CURRICULUM_ROOT, 'contents/information_security/infosec_module_3/lesson_4.md'),
    'infosec-m03-l05': path.join(CURRICULUM_ROOT, 'contents/information_security/infosec_module_3/lesson_5.md'),
};

const SIMULATION_CONTENT_MAP = {
    'infosec-m01-sim01': path.join(CURRICULUM_ROOT, 'contents/information_security/infosec_module_1/simulations/sim-01-interactive.json'),
    'infosec-m01-sim02': path.join(CURRICULUM_ROOT, 'contents/information_security/infosec_module_1/simulations/sim-02-interactive.json')
};

const CHECKPOINT_MAP = {
    'infosec-m01-checkpoint': path.join(CURRICULUM_ROOT, 'contents/information_security/infosec_module_1/checkpoint-questions.json')
};

const LAB_CONTENT_MAP = {
    // Module 01 — Security Mindset
    'infosec-m01-lab01':     path.join(CURRICULUM_ROOT, 'contents/information_security/infosec_module_1/labs/lab-01-risk-analyzer.json'),
    'infosec-m01-lab01-cia': path.join(CURRICULUM_ROOT, 'contents/information_security/infosec_module_1/labs/lab-01-cia-crime-scene.json'),
    'infosec-m01-lab02-tvr': path.join(CURRICULUM_ROOT, 'contents/information_security/infosec_module_1/labs/lab-02-tvr-analysis.json'),
    // Module 02 — Risk Management
    'infosec-m02-lab01':     path.join(CURRICULUM_ROOT, 'contents/information_security/infosec_module_2/labs/lab-01-password-policy.json'),
    // Module 03 — Defensive Architecture
    'infosec-m03-lab01':     path.join(CURRICULUM_ROOT, 'contents/information_security/infosec_module_3/labs/lab-01-firewall-audit.json'),
};

const LESSON_META_MAP = {
    // Module 01 — Security Mindset & Core Principles
    'infosec-m01-l01': { title: 'What Is Information Security?', estimatedTime: 10, objectives: ['Define information security', 'Explain security controls', 'Understand attacker vs defender mindset'] },
    'infosec-m01-l02': { title: 'The CIA Triad', estimatedTime: 10, objectives: ['Explain Confidentiality, Integrity, Availability', 'Apply CIA Triad to real scenarios'] },
    'infosec-m01-l03': { title: 'Threats, Vulnerabilities, and Risk', estimatedTime: 15, objectives: ['Distinguish threats from vulnerabilities', 'Define risk in security context', 'Apply threat modelling basics'] },
    'infosec-m01-l04': { title: 'Security Controls & Defense-in-Depth', estimatedTime: 20, objectives: ['Classify security controls by purpose and implementation type', 'Explain the Defense-in-Depth layered strategy', 'Map controls to CIA Triad principles', 'Identify industry frameworks that guide control selection'] },
    'infosec-m01-l05': { title: 'Access Control & Least Privilege', estimatedTime: 15, objectives: ['Define access control and its role in security', 'Explain the principle of least privilege', 'Distinguish between authentication and authorization'] },
    // Module 02 — Risk Management
    'infosec-m02-l01': { title: 'Introduction to Risk', estimatedTime: 10, objectives: ['Define risk in an information security context', 'Distinguish between threats, vulnerabilities, and risk', 'Understand the risk equation: Risk = Likelihood × Impact'] },
    'infosec-m02-l02': { title: 'Risk Assessment Methods', estimatedTime: 15, objectives: ['Explain qualitative vs quantitative risk assessment', 'Apply a basic risk matrix to real scenarios', 'Understand asset-based and threat-based assessment approaches'] },
    'infosec-m02-l03': { title: 'Risk Mitigation & Treatment', estimatedTime: 15, objectives: ['Identify the four risk treatment options: Accept, Avoid, Transfer, Reduce', 'Select appropriate controls for a given risk', 'Understand residual risk and risk appetite'] },
    'infosec-m02-l04': { title: 'Compliance & Security Frameworks', estimatedTime: 10, objectives: ['Understand the purpose of security frameworks (NIST, ISO 27001)', 'Explain what compliance means and why it matters', 'Map controls to framework requirements'] },
    'infosec-m02-l05': { title: 'Risk Communication & Reporting', estimatedTime: 10, objectives: ['Communicate risk findings clearly to technical and non-technical audiences', 'Produce a basic risk register', 'Understand the role of risk reporting in security governance'] },
    // Module 03 — Defensive Architecture
    'infosec-m03-l01': { title: 'Network Security Architecture', estimatedTime: 15, objectives: ['Understand network segmentation and its role in defense', 'Explain firewalls, DMZs, and perimeter defenses', 'Apply the principle of least privilege to network design'] },
    'infosec-m03-l02': { title: 'Identity & Access Management', estimatedTime: 15, objectives: ['Explain authentication, authorization, and accounting (AAA)', 'Describe multi-factor authentication and why it matters', 'Apply role-based access control (RBAC) concepts'] },
    'infosec-m03-l03': { title: 'Incident Response Planning', estimatedTime: 15, objectives: ['Describe the six phases of incident response', 'Understand the role of a CSIRT', 'Draft a basic incident response playbook for a common scenario'] },
    'infosec-m03-l04': { title: 'Security Monitoring & Logging', estimatedTime: 10, objectives: ['Explain the purpose of SIEM systems', 'Understand what to log and why', 'Describe common detection use cases'] },
    'infosec-m03-l05': { title: 'Defensive Security Operations', estimatedTime: 15, objectives: ['Understand the role of a Security Operations Center (SOC)', 'Explain threat hunting and proactive defense', 'Describe vulnerability management lifecycle'] },
};

// Helper: get ALL content IDs for a module (lessons from DB + sims + checkpoints from maps)
async function getAllModuleContentIds(moduleId) {
    // Get lessons from the DB
    const { data: dbLessons } = await supabase
        .from('lessons')
        .select('id, is_required')
        .eq('module_id', moduleId);
    const lessonIds = (dbLessons || []).map(l => l.id);

    // Get simulation IDs that belong to this module (by naming convention)
    const simIds = Object.keys(SIMULATION_CONTENT_MAP).filter(id => id.startsWith(moduleId + '-'));

    // Get checkpoint IDs that belong to this module (by naming convention)
    const checkpointIds = Object.keys(CHECKPOINT_MAP).filter(id => id.startsWith(moduleId + '-'));

    const labIds = Object.keys(LAB_CONTENT_MAP).filter(id => id.startsWith(moduleId + '-'));
    const allIds = [...lessonIds, ...simIds, ...checkpointIds, ...labIds];
    return allIds;
}

// Helper: calculate and update module progress, unlock next module if 100%
async function updateModuleProgress(userId, moduleId) {
    const allContentIds = await getAllModuleContentIds(moduleId);
    if (allContentIds.length === 0) return { percentage: 0, moduleCompleted: false, unlockedModule: null };

    const { data: completedItems } = await supabase
        .from('user_lesson_progress')
        .select('lesson_id')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .in('lesson_id', allContentIds);

    const completedCount = (completedItems || []).length;
    const totalCount = allContentIds.length;
    const percentage = Math.round((completedCount / totalCount) * 100);

    await supabase.from('user_module_progress').upsert({
        user_id: userId,
        module_id: moduleId,
        lessons_completed: completedCount,
        total_lessons: totalCount,
        progress_percentage: percentage,
        completed_at: percentage === 100 ? new Date().toISOString() : null
    }, { onConflict: 'user_id,module_id' });

    let moduleCompleted = percentage === 100;
    let unlockedModule = null;

    if (moduleCompleted) {
        try {
            unlockedModule = await callRpc('unlock_next_module', {
                p_user_id: userId,
                p_current_module_id: moduleId
            });
        } catch (unlockErr) {
            console.warn('unlock_next_module RPC failed (non-critical):', unlockErr.message);
        }

        // Update overall track progress
        try {
            const { data: modRow } = await supabase
                .from('modules')
                .select('track_id')
                .eq('id', moduleId)
                .single();
            if (modRow?.track_id) {
                await callRpc('calculate_track_progress', {
                    p_user_id: userId,
                    p_track_id: modRow.track_id
                });
            }
        } catch (trackErr) {
            console.warn('calculate_track_progress failed (non-critical):', trackErr.message);
        }
    }

    return { percentage, moduleCompleted, unlockedModule };
}

const TRACK_SLUG_ALIASES = {
    'information-security': 'information-security',
    'infosec': 'information-security'
};

function normalizeTrackSlug(slug) {
    if (!slug) return slug;
    return TRACK_SLUG_ALIASES[slug] || slug;
}

function getTrackLookupCandidates(identifier) {
    const normalized = normalizeTrackSlug(identifier);
    return [...new Set([identifier, normalized].filter(Boolean))];
}

async function findTrackByIdentifier(identifier, selectColumns = '*', publishedOnly = false) {
    const candidates = getTrackLookupCandidates(identifier);
    if (candidates.length === 0) {
        return { data: null, error: new Error('Track identifier is required') };
    }

    const orFilter = candidates
        .flatMap((value) => [`slug.eq.${value}`, `id.eq.${value}`])
        .join(',');

    let query = supabase
        .from('tracks')
        .select(selectColumns)
        .or(orFilter);

    if (publishedOnly) {
        query = query.eq('is_published', true);
    }

    return await query.limit(1).maybeSingle();
}

const app = express();

// ===== SUPABASE INITIALIZATION =====
const SUPABASE_URL = normalizeEnvValue(process.env.SUPABASE_URL);
const SUPABASE_ANON_KEY = normalizeEnvValue(process.env.SUPABASE_ANON_KEY);
const SUPABASE_SERVICE_ROLE_KEY = normalizeEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);
const SUPABASE_DB_KEY = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
const SUPABASE_AUTH_KEY = SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_DB_KEY,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    }
);

const supabaseAuth = createClient(
    SUPABASE_URL,
    SUPABASE_AUTH_KEY,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    }
);

const dbKeyRole = decodeJwtRole(SUPABASE_DB_KEY);
if (dbKeyRole !== 'service_role') {
    console.warn(`[DB] Supabase DB client is using role '${dbKeyRole || 'unknown'}'. Token writes may fail due to RLS.`);
}

function describeDbError(error) {
    if (!error) return 'unknown database error';
    const parts = [];
    if (error.code) parts.push(`code ${error.code}`);
    if (error.message) parts.push(error.message);
    if (error.details) parts.push(error.details);
    if (error.hint) parts.push(`hint: ${error.hint}`);
    return parts.join(' | ');
}

function isMissingRpcFunctionError(error) {
    if (!error) return false;
    const code = String(error.code || '').toUpperCase();
    const message = `${error.message || ''} ${error.details || ''} ${error.hint || ''}`.toLowerCase();
    return (
        code === '42883' ||
        code === 'PGRST202' ||
        message.includes('could not find the function') ||
        (message.includes('function') && message.includes('does not exist'))
    );
}

function isSupabaseUnavailableError(error) {
    if (!error) return false;

    const status = Number(error.status || error.statusCode || 0);
    const code = String(error.code || error.cause?.code || '').toUpperCase();
    const message = `${error.message || ''} ${error.details || ''}`.toLowerCase();

    return (
        status >= 500 ||
        ['ECONNREFUSED', 'ECONNRESET', 'EHOSTUNREACH', 'ENETUNREACH', 'ETIMEDOUT'].includes(code) ||
        message.includes('project is paused') ||
        message.includes('project has been paused') ||
        message.includes('requested instance is paused') ||
        message.includes('failed to fetch') ||
        message.includes('fetch failed') ||
        message.includes('network error') ||
        message.includes('service unavailable')
    );
}

function sendAuthError(res, error, fallbackStatus, fallbackMessage) {
    if (isSupabaseUnavailableError(error)) {
        return res.status(503).json({
            error: 'Authentication service is temporarily unavailable. If the Supabase project was paused, resume it, wait for it to finish starting, and try again.'
        });
    }

    return res.status(fallbackStatus).json({
        error: error.message || fallbackMessage
    });
}

async function callRpc(rpcName, params, { expectTruthy = false } = {}) {
    const { data, error } = await supabase.rpc(rpcName, params);

    if (error) {
        const message = isMissingRpcFunctionError(error)
            ? `Database function '${rpcName}' is missing. Create it in Supabase SQL Editor.`
            : `Database function '${rpcName}' failed: ${describeDbError(error)}`;
        const wrapped = new Error(message);
        wrapped.statusCode = 500;
        throw wrapped;
    }

    if (expectTruthy && !data) {
        const wrapped = new Error(`Database function '${rpcName}' returned no result.`);
        wrapped.statusCode = 400;
        throw wrapped;
    }

    return data;
}

async function ensureUserTokensRow(userId) {
    const { data, error } = await supabase
        .from('user_tokens')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) {
        throw new Error(`Failed to read user token record: ${describeDbError(error)}`);
    }

    if (data) return data;

    const { data: created, error: createError } = await supabase
        .from('user_tokens')
        .upsert({ user_id: userId }, { onConflict: 'user_id' })
        .select('*')
        .single();

    if (createError) {
        throw new Error(
            `Failed to initialize user token record for user '${userId}': ${describeDbError(createError)}`
        );
    }

    return created;
}

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

// Readiness check: confirms the API can actually reach Supabase, without
// exposing credentials or database contents.
app.get('/api/health', async (req, res) => {
    const startedAt = Date.now();

    try {
        const { error } = await supabase
            .from('tracks')
            .select('id')
            .limit(1);

        if (error) throw error;

        return res.json({
            status: 'ready',
            api: 'online',
            supabase: 'online',
            responseTimeMs: Date.now() - startedAt,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Supabase health check failed:', describeDbError(error));
        return res.status(503).json({
            status: 'degraded',
            api: 'online',
            supabase: 'unavailable',
            error: 'The API is running but cannot reach Supabase.',
            responseTimeMs: Date.now() - startedAt,
            timestamp: new Date().toISOString()
        });
    }
});

// ===== AUTHENTICATION MIDDLEWARE =====
async function authenticateUser(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
        
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
        
        const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
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

        try {
            await ensureUserTokensRow(authData.user.id);
        } catch (tokenInitError) {
            console.warn('Token row initialization failed after registration:', tokenInitError.message);
        }

        res.status(201).json({ 
            message: "Clearance Granted! Registration successful.",
            userId: authData.user.id
        });

    } catch (error) {
        console.error('Registration error:', error);
        return sendAuthError(res, error, 400, 'Registration failed');
    }
});

// Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    try {
        const { data, error } = await supabaseAuth.auth.signInWithPassword({
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
        const loginError = new Error(`Authorization Failed: ${error.message || 'Login failed'}`);
        loginError.status = error.status;
        loginError.statusCode = error.statusCode;
        loginError.code = error.code;
        loginError.cause = error.cause;
        return sendAuthError(res, loginError, 401, 'Authorization failed');
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
        const requestedSlug = req.params.slug;

        // Get track
        const { data: track, error: trackError } = await findTrackByIdentifier(
            requestedSlug,
            '*',
            true
        );

        if (trackError || !track) {
            return res.status(404).json({ error: `Track "${requestedSlug}" not found or not published` });
        }

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
        const normalized = normalizeTrackSlug(requestedSlug);

        // Get track
        const { data: track, error: trackError } = await findTrackByIdentifier(
            requestedSlug,
            'id, modules, token_cost, is_locked_by_default',
            true
        );

        if (trackError || !track) {
            console.error('Track lookup failed for slug:', requestedSlug, 'normalized:', normalized, trackError?.message);
            return res.status(404).json({ error: `Track "${requestedSlug}" not found or not published` });
        }

        // Check if track requires tokens
        if (track.is_locked_by_default && track.token_cost > 0) {
            await ensureUserTokensRow(req.user.id);

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

            await callRpc('spend_user_tokens', {
                p_user_id: req.user.id,
                p_tokens: track.token_cost
            }, { expectTruthy: true });
        }

        // Resolve first valid module from the track's declared module IDs.
        // This avoids FK failures if track.modules contains stale IDs.
        let firstModuleId = null;
        if (Array.isArray(track.modules) && track.modules.length > 0) {
            const { data: firstModuleRows, error: firstModuleLookupError } = await supabase
                .from('modules')
                .select('id')
                .in('id', track.modules)
                .order('order_number', { ascending: true })
                .limit(1);

            if (firstModuleLookupError) {
                console.warn('First module lookup failed for track:', track.id, firstModuleLookupError.message);
            }

            firstModuleId = firstModuleRows?.[0]?.id || null;

            if (!firstModuleId) {
                console.warn('No valid module found for track during enrollment:', track.id, 'declared modules:', track.modules);
            }
        }

        // Create enrollment
        const enrollmentPayload = {
            user_id: req.user.id,
            track_id: track.id,
            current_module_id: firstModuleId,
            status: 'in-progress',
            unlocked_with_tokens: (track.token_cost || 0) > 0,
            tokens_spent: track.token_cost || 0
        };

        let { data: enrollment, error: enrollmentError } = await supabase
            .from('user_track_enrollments')
            .insert([enrollmentPayload])
            .select()
            .single();

        // If DB has strict FK and module references drifted, retry without current_module_id.
        if (enrollmentError && enrollmentError.code === '23503' && firstModuleId) {
            console.warn('Enrollment insert FK error. Retrying with null current_module_id for track:', track.id, enrollmentError.message);
            const retry = await supabase
                .from('user_track_enrollments')
                .insert([{ ...enrollmentPayload, current_module_id: null }])
                .select()
                .single();
            enrollment = retry.data;
            enrollmentError = retry.error;
            firstModuleId = null;
        }

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
        const requestedSlug = req.params.slug;

        // Get track
        const { data: track } = await findTrackByIdentifier(requestedSlug, 'id', false);

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
        const requestedSlug = req.params.slug;

        // Get track
        const { data: track } = await findTrackByIdentifier(requestedSlug, 'id, modules', false);

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

        // Get ALL content IDs for all modules (lessons + sims + checkpoints)
        let allContentIds = [];
        for (const modId of track.modules) {
            const ids = await getAllModuleContentIds(modId);
            allContentIds = allContentIds.concat(ids);
        }

        const { data: lessonProgress } = await supabase
            .from('user_lesson_progress')
            .select('*')
            .eq('user_id', req.user.id)
            .in('lesson_id', allContentIds);

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
        const { score } = req.body || {}; // Optional: for simulations/checkpoints

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
            .select('status, attempts_count')
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

        await ensureUserTokensRow(req.user.id);

        // Add tokens
        await callRpc('add_user_tokens', {
            p_user_id: req.user.id,
            p_tokens: lesson.token_reward
        });

        // Calculate and update module progress (includes lessons + sims + checkpoints)
        const { percentage, moduleCompleted, unlockedModule } = await updateModuleProgress(req.user.id, lesson.modules.id);

        // Update overall track progress
        await callRpc('calculate_track_progress', {
            p_user_id: req.user.id,
            p_track_id: lesson.modules.track_id
        });
        const updatedTokens = await ensureUserTokensRow(req.user.id);

        res.json({
            message: 'Lesson completed successfully',
            tokensEarned: lesson.token_reward,
            newBalance: updatedTokens?.tokens_available || 0,
            moduleProgress: percentage,
            moduleCompleted,
            unlockedModule
        });

    } catch (error) {
        console.error('Error completing lesson:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Failed to complete lesson' });
    }
});

// ===== TOKEN ENDPOINTS =====

// Get user's token balance
app.get('/api/user/tokens', authenticateUser, async (req, res) => {
    try {
        const tokenRow = await ensureUserTokensRow(req.user.id);

        res.json({
            tokens: {
                total_tokens: 0,
                tokens_spent: 0,
                tokens_available: 0,
                ...tokenRow
            }
        });

    } catch (error) {
        console.error('Error fetching tokens:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch tokens' });
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
    const { choiceId } = req.body || {};

    const filePath = SIMULATION_CONTENT_MAP[simId];
    if (!filePath) {
        return res.status(404).json({ error: `Simulation '${simId}' not found` });
    }

    try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const sim = JSON.parse(raw);
        const tokensEarned = sim.tokens || 5;
        await ensureUserTokensRow(req.user.id);

        // Check if already completed
        const { data: existing } = await supabase
            .from('user_lesson_progress')
            .select('status')
            .eq('user_id', req.user.id)
            .eq('lesson_id', simId)
            .single();

        if (existing?.status === 'completed') {
            const tokenData = await ensureUserTokensRow(req.user.id);
            return res.json({ message: 'Already completed', alreadyCompleted: true, tokensEarned: 0, newBalance: tokenData?.tokens_available || 0 });
        }

        // Record completion
        const { error: progressError } = await supabase.from('user_lesson_progress').upsert({
            user_id: req.user.id,
            lesson_id: simId,
            status: 'completed',
            completed_at: new Date().toISOString(),
            tokens_earned: tokensEarned,
            exam_score: null,
            attempts_count: 1
        }, { onConflict: 'user_id,lesson_id' });
        if (progressError) throw progressError;

        // Award tokens
        await callRpc('add_user_tokens', { p_user_id: req.user.id, p_tokens: tokensEarned });
        const tokenData = await ensureUserTokensRow(req.user.id);

        // Update module progress (derive module ID from sim ID, e.g. "infosec-m01-sim01" -> "infosec-m01")
        let moduleCompleted = false;
        let unlockedModule = null;
        try {
            const moduleId = simId.replace(/-sim\d+$/, '');
            const result = await updateModuleProgress(req.user.id, moduleId);
            moduleCompleted = result.moduleCompleted;
            unlockedModule = result.unlockedModule;
        } catch (moduleErr) {
            console.warn('Module progress update after simulation failed (non-critical):', moduleErr.message);
        }

        res.json({ message: 'Simulation completed', tokensEarned, newBalance: tokenData?.tokens_available || 0, moduleCompleted, unlockedModule });

    } catch (err) {
        console.error(`Error submitting simulation ${simId}:`, err.message);
        res.status(err.statusCode || 500).json({ error: err.message || 'Failed to record simulation completion' });
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
    const { answers } = req.body || {}; // [{questionIdx, selectedIdx}]

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
        await ensureUserTokensRow(req.user.id);

        // Record attempt in user_lesson_progress
        const { data: existing } = await supabase
            .from('user_lesson_progress')
            .select('attempts_count, status')
            .eq('user_id', req.user.id)
            .eq('lesson_id', checkpointId)
            .single();

        const attempts = (existing?.attempts_count || 0) + 1;

        const { error: progressError } = await supabase.from('user_lesson_progress').upsert({
            user_id: req.user.id,
            lesson_id: checkpointId,
            status: passed ? 'completed' : 'attempted',
            completed_at: passed ? new Date().toISOString() : null,
            tokens_earned: passed ? tokensEarned : 0,
            exam_score: score,
            attempts_count: attempts
        }, { onConflict: 'user_id,lesson_id' });
        if (progressError) throw progressError;

        // Award tokens if passed
        if (passed && tokensEarned > 0) {
            await callRpc('add_user_tokens', { p_user_id: req.user.id, p_tokens: tokensEarned });
        }

        const tokenData = await ensureUserTokensRow(req.user.id);

        // Update module progress and unlock next module if checkpoint passed
        // Update module progress and unlock next module if checkpoint passed
        let moduleCompleted = false;
        let unlockedModule = null;
        if (passed) {
            try {
                const moduleId = checkpointId.replace(/-checkpoint$/, '');
                const result = await updateModuleProgress(req.user.id, moduleId);
                moduleCompleted = result.moduleCompleted;
                unlockedModule = result.unlockedModule;
            } catch (moduleErr) {
                console.warn('Module progress update after checkpoint failed (non-critical):', moduleErr.message);
            }
        }

        res.json({ score, passed, correct, total: checkpoint.questions.length, tokensEarned, newBalance: tokenData?.tokens_available || 0, moduleCompleted, unlockedModule });

    } catch (err) {
        console.error(`Error submitting checkpoint ${checkpointId}:`, err.message);
        res.status(err.statusCode || 500).json({ error: err.message || 'Failed to submit checkpoint' });
    }
});

// ===== AI ENDPOINTS (Groq — free tier) =====
// Free API key: https://console.groq.com  (no credit card required)

function normalizeApiKey(value) {
    if (!value) return '';
    return String(value).trim().replace(/^['"“”‘’]|['"“”‘’]$/g, '');
}

function getGroqKeySource() {
    if (normalizeApiKey(process.env.GROQ_API_KEY)) return 'GROQ_API_KEY';
    if (normalizeApiKey(process.env.GROK_API_KEY)) return 'GROK_API_KEY';
    return null;
}

function getGroqApiKey() {
    let key = normalizeApiKey(process.env.GROQ_API_KEY || process.env.GROK_API_KEY);
    if (key) return key;

    // Fallback: reload backend/.env in case key was added after process start.
    require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
    key = normalizeApiKey(process.env.GROQ_API_KEY || process.env.GROK_API_KEY);
    return key || '';
}

function getGroqClient() {
    const apiKey = getGroqApiKey();
    if (!apiKey) return null;
    const Groq = require('groq-sdk');
    return new Groq({ apiKey });
}

const GROQ_MODELS = {
    hint: process.env.GROQ_HINT_MODEL || 'llama-3.1-8b-instant',
    quiz: process.env.GROQ_QUIZ_MODEL || 'llama-3.3-70b-versatile',
    feedback: process.env.GROQ_FEEDBACK_MODEL || 'llama-3.3-70b-versatile'
};

function mapGroqProviderError(error, fallbackMessage) {
    const raw = String(error?.error?.message || error?.message || '').trim();
    if (!raw) return fallbackMessage;

    const lower = raw.toLowerCase();
    if (lower.includes('decommissioned') || (lower.includes('model') && lower.includes('not found'))) {
        return 'AI model configuration is invalid. Update GROQ_HINT_MODEL / GROQ_QUIZ_MODEL / GROQ_FEEDBACK_MODEL.';
    }
    if (lower.includes('invalid api key') || lower.includes('incorrect api key') || lower.includes('unauthorized') || lower.includes('authentication')) {
        return 'AI key rejected by Groq. Verify GROQ_API_KEY in backend/.env and restart the backend.';
    }
    if (lower.includes('rate limit') || lower.includes('429') || lower.includes('quota')) {
        return 'AI provider is rate-limited right now. Please try again in a minute.';
    }

    return raw.length > 220 ? `${raw.slice(0, 217)}...` : raw;
}

app.get('/api/ai/status', (req, res) => {
    const hasKey = Boolean(getGroqApiKey());
    res.json({
        provider: 'groq',
        configured: hasKey,
        configuredFrom: getGroqKeySource(),
        models: GROQ_MODELS
    });
});

// ============================================================
// LAB ENDPOINTS
// ============================================================

// GET /api/labs/:labId — serve lab metadata (flag and solution fields stripped)
app.get('/api/labs/:labId', authenticateUser, (req, res) => {
    const { labId } = req.params;
    const filePath = LAB_CONTENT_MAP[labId];
    if (!filePath) return res.status(404).json({ error: `Lab '${labId}' not found` });

    try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        // eslint-disable-next-line no-unused-vars
        const { flag, solution, ...publicLab } = JSON.parse(raw);
        res.json(publicLab);
    } catch (err) {
        console.error(`Error loading lab ${labId}:`, err.message);
        res.status(500).json({ error: 'Failed to load lab' });
    }
});

// POST /api/labs/:labId/submit — validate flag submission, award tokens
app.post('/api/labs/:labId/submit', authenticateUser, async (req, res) => {
    const { labId } = req.params;
    const { flag } = req.body || {};
    const filePath = LAB_CONTENT_MAP[labId];
    if (!filePath) return res.status(404).json({ error: `Lab '${labId}' not found` });

    try {
        const lab = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        if (!flag || flag.trim() !== lab.flag) {
            return res.status(400).json({ correct: false, message: 'Incorrect flag. Check your terminal output and try again.' });
        }

        await ensureUserTokensRow(req.user.id);

        // Duplicate completion guard
        const { data: existing } = await supabase
            .from('user_lesson_progress')
            .select('status')
            .eq('user_id', req.user.id)
            .eq('lesson_id', labId)
            .single();

        if (existing?.status === 'completed') {
            const tokenData = await ensureUserTokensRow(req.user.id);
            return res.json({ correct: true, alreadyCompleted: true, tokensEarned: 0, newBalance: tokenData?.tokens_available || 0 });
        }

        const tokensEarned = lab.tokens || 50;

        const { error: progressError } = await supabase.from('user_lesson_progress').upsert({
            user_id: req.user.id,
            lesson_id: labId,
            status: 'completed',
            completed_at: new Date().toISOString(),
            tokens_earned: tokensEarned,
            exam_score: null,
            attempts_count: 1
        }, { onConflict: 'user_id,lesson_id' });
        if (progressError) throw progressError;

        await callRpc('add_user_tokens', { p_user_id: req.user.id, p_tokens: tokensEarned });
        const tokenData = await ensureUserTokensRow(req.user.id);

        // Update module progress (derive module ID: "infosec-m01-lab01" → "infosec-m01")
        let moduleCompleted = false;
        let unlockedModule = null;
        try {
            const moduleId = labId.replace(/-lab\d+.*$/, '');
            const result = await updateModuleProgress(req.user.id, moduleId);
            moduleCompleted = result.moduleCompleted;
            unlockedModule = result.unlockedModule;
        } catch (moduleErr) {
            console.warn('Module progress update after lab failed (non-critical):', moduleErr.message);
        }

        res.json({ correct: true, tokensEarned, newBalance: tokenData?.tokens_available || 0, moduleCompleted, unlockedModule });

    } catch (err) {
        console.error(`Error submitting lab ${labId}:`, err.message);
        res.status(err.statusCode || 500).json({ error: err.message || 'Failed to submit lab' });
    }
});

// POST /api/ai/hint — contextual learning hint
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
            model: GROQ_MODELS.hint,
            max_tokens: 180,
            messages: [
                { role: 'system', content: 'You are a patient cybersecurity instructor. Give concise hints (1-2 sentences) that guide thinking without giving away answers. Be encouraging.' },
                { role: 'user', content: `Student studying "${meta?.title || lessonId}" asked: "${question}"\n\nContext:\n${lessonContext}` }
            ]
        });

        res.json({ hint: completion.choices[0].message.content });
    } catch (err) {
        const message = mapGroqProviderError(err, 'Failed to generate hint');
        console.error('AI hint error:', message);
        res.status(502).json({ error: message });
    }
});

// POST /api/ai/generate-quiz — generate MCQ questions
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
            model: GROQ_MODELS.quiz,
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
        const message = mapGroqProviderError(err, 'Failed to generate quiz questions');
        console.error('AI quiz gen error:', message);
        res.status(502).json({ error: message });
    }
});

// POST /api/ai/feedback — personalized progress feedback
app.post('/api/ai/feedback', authenticateUser, async (req, res) => {
    const { checkpointId, score, incorrectTopics } = req.body;

    const groq = getGroqClient();
    if (!groq) return res.status(503).json({ error: 'AI not configured — add GROQ_API_KEY to .env (free at console.groq.com)' });

    try {
        const topicsText = incorrectTopics?.length ? incorrectTopics.join(', ') : 'general concepts';

        const completion = await groq.chat.completions.create({
            model: GROQ_MODELS.feedback,
            max_tokens: 250,
            messages: [
                { role: 'system', content: 'You are a cybersecurity educator. Give direct, professional feedback in 2-3 sentences. Acknowledge the score, mention what to review, and motivate without being cheerful.' },
                { role: 'user', content: `Student scored ${score}% on "${checkpointId}". Struggled with: ${topicsText}.` }
            ]
        });

        res.json({ feedback: completion.choices[0].message.content });
    } catch (err) {
        const message = mapGroqProviderError(err, 'Failed to generate feedback');
        console.error('AI feedback error:', message);
        res.status(502).json({ error: message });
    }
});

module.exports = app;
