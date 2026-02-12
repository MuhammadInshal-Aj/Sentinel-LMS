/**
 * Sentinel-LMS — Database Seed Script
 *
 * Reads curriculum JSON metadata and upserts into Supabase tables:
 *   tracks → modules → lessons
 *
 * Usage:  cd backend && npm run seed
 * Safe to run repeatedly (idempotent via upsert).
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ── Supabase client (service role key bypasses RLS) ──────────────────
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ── Paths ────────────────────────────────────────────────────────────
const CURRICULUM_ROOT = path.join(__dirname, '../../curriculum');
const TRACKS_DIR = path.join(CURRICULUM_ROOT, 'tracks');

// ── Default token rewards (matches frontend CONFIG.TOKEN_REWARDS) ────
const TOKEN_REWARDS = {
    theory: 20,
    simulation: 5,
    checkpoint: 100
};

// ── Helpers ──────────────────────────────────────────────────────────

function readJSON(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

/**
 * Scan a directory for .json files and index them by their `id` field.
 * Returns: { [id]: { filePath, data } }
 */
function buildIdToFileMap(directory) {
    const map = {};
    if (!fs.existsSync(directory)) return map;

    for (const file of fs.readdirSync(directory)) {
        if (!file.endsWith('.json')) continue;
        const filePath = path.join(directory, file);
        const data = readJSON(filePath);
        if (data.id) map[data.id] = { filePath, data };
    }
    return map;
}

/**
 * Find module directories under a track directory.
 * Returns array of { dirName, dirPath, moduleJson } for dirs that have a module.json.
 */
function discoverModules(trackDir) {
    const entries = fs.readdirSync(trackDir, { withFileTypes: true });
    const modules = [];

    for (const entry of entries) {
        if (!entry.isDirectory() || !entry.name.startsWith('module-')) continue;
        const modPath = path.join(trackDir, entry.name, 'module.json');
        if (!fs.existsSync(modPath)) continue;
        modules.push({
            dirName: entry.name,
            dirPath: path.join(trackDir, entry.name),
            moduleJson: readJSON(modPath)
        });
    }

    return modules.sort((a, b) => (a.moduleJson.order || 0) - (b.moduleJson.order || 0));
}

// ── Main seed function ───────────────────────────────────────────────

async function seed() {
    console.log('=== Sentinel-LMS Database Seed ===\n');

    // ── 1. Discover tracks ───────────────────────────────────────────
    const trackDirs = fs.readdirSync(TRACKS_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory());

    for (const trackDirEntry of trackDirs) {
        const trackDir = path.join(TRACKS_DIR, trackDirEntry.name);
        const trackJsonPath = path.join(trackDir, 'track.json');

        if (!fs.existsSync(trackJsonPath)) {
            console.warn(`  Skipping ${trackDirEntry.name} — no track.json`);
            continue;
        }

        const trackJson = readJSON(trackJsonPath);
        console.log(`Track: ${trackJson.title} (${trackJson.id})`);

        // ── 2. Discover which modules actually exist on disk ─────────
        const discoveredModules = discoverModules(trackDir);
        const existingModuleIds = discoveredModules.map(m => m.moduleJson.id);

        console.log(`  Modules on disk: ${existingModuleIds.join(', ') || '(none)'}`);

        // ── 3. Upsert track ─────────────────────────────────────────
        const trackRecord = {
            id: trackJson.id,
            slug: trackJson.slug,
            title: trackJson.title,
            description: trackJson.description,
            level: trackJson.level || 'foundation',
            is_published: true,
            modules: existingModuleIds,
            token_cost: 0,
            is_locked_by_default: false,
            meta: trackJson.meta || {}
        };

        const { error: trackError } = await supabase
            .from('tracks')
            .upsert([trackRecord], { onConflict: 'id' });

        if (trackError) {
            console.error('  Track upsert FAILED:', trackError.message);
            console.error('  Aborting this track.');
            continue;
        }
        console.log('  Track upserted OK');

        // ── 4. Seed each module ─────────────────────────────────────
        for (const mod of discoveredModules) {
            await seedModule(mod, trackJson.id);
        }
    }

    // ── 5. Verification ─────────────────────────────────────────────
    console.log('\n=== Verification ===');
    const { data: tracks } = await supabase.from('tracks').select('id, slug, is_published, modules');
    const { data: modules } = await supabase.from('modules').select('id, track_id, order_number, lessons');
    const { data: lessons } = await supabase.from('lessons').select('id, module_id, is_required, token_reward, order_number');

    console.log(`  Tracks:  ${tracks?.length || 0}`);
    tracks?.forEach(t => console.log(`    - ${t.id} (slug: ${t.slug}, published: ${t.is_published}, modules: [${t.modules?.join(', ')}])`));

    console.log(`  Modules: ${modules?.length || 0}`);
    modules?.forEach(m => console.log(`    - ${m.id} (track: ${m.track_id}, order: ${m.order_number}, lessons: ${m.lessons?.length || 0})`));

    console.log(`  Lessons: ${lessons?.length || 0}`);
    lessons?.forEach(l => console.log(`    - ${l.id} (module: ${l.module_id}, required: ${l.is_required}, tokens: ${l.token_reward}, order: ${l.order_number})`));

    console.log('\n=== Seed complete ===');
}

// ── Seed a single module ─────────────────────────────────────────────

async function seedModule(mod, trackId) {
    const { dirPath, moduleJson } = mod;
    console.log(`\n  Module: ${moduleJson.title} (${moduleJson.id})`);

    // Build ID → data maps for lessons, simulations
    const lessonMap = buildIdToFileMap(path.join(dirPath, 'lessons'));
    const simMap = buildIdToFileMap(path.join(dirPath, 'simulations'));

    // Read module_flow.json for canonical ordering + required flags
    const flowPath = path.join(dirPath, 'module_flow.json');
    const checkpointPath = path.join(dirPath, 'checkpoint.json');

    let flow = [];
    if (fs.existsSync(flowPath)) {
        const flowJson = readJSON(flowPath);
        flow = flowJson.flow || [];
    }

    // Read checkpoint metadata
    let checkpointMeta = null;
    if (fs.existsSync(checkpointPath)) {
        checkpointMeta = readJSON(checkpointPath);
    }

    // Build complete ordered list of all item IDs (from flow)
    const allItemIds = flow.map(item => item.id);

    // ── Upsert module ────────────────────────────────────────────────
    const moduleRecord = {
        id: moduleJson.id,
        track_id: trackId,
        title: moduleJson.title,
        order_number: moduleJson.order || 1,
        description: moduleJson.description || '',
        lessons: allItemIds
    };

    const { error: moduleError } = await supabase
        .from('modules')
        .upsert([moduleRecord], { onConflict: 'id' });

    if (moduleError) {
        console.error(`    Module upsert FAILED: ${moduleError.message}`);
        return;
    }
    console.log('    Module upserted OK');

    // ── Build lesson records from flow ───────────────────────────────
    const lessonRecords = [];
    let orderCounter = 1;

    for (const flowItem of flow) {
        let record = null;

        if (flowItem.type === 'lesson') {
            const meta = lessonMap[flowItem.id]?.data;
            record = {
                id: flowItem.id,
                module_id: moduleJson.id,
                title: meta?.title || flowItem.id,
                order_number: orderCounter,
                is_required: flowItem.required !== false,
                token_reward: TOKEN_REWARDS.theory,
                lesson_type: 'lesson'
            };
        } else if (flowItem.type === 'simulation') {
            const meta = simMap[flowItem.id]?.data;
            record = {
                id: flowItem.id,
                module_id: moduleJson.id,
                title: meta?.title || flowItem.id,
                order_number: orderCounter,
                is_required: flowItem.required !== false,
                token_reward: TOKEN_REWARDS.simulation,
                lesson_type: 'simulation'
            };
        } else if (flowItem.type === 'checkpoint') {
            record = {
                id: flowItem.id,
                module_id: moduleJson.id,
                title: checkpointMeta?.title || flowItem.id,
                order_number: orderCounter,
                is_required: flowItem.required !== false,
                token_reward: TOKEN_REWARDS.checkpoint,
                lesson_type: 'checkpoint'
            };
        }

        if (record) {
            lessonRecords.push(record);
            orderCounter++;
        }
    }

    // ── Upsert lessons ───────────────────────────────────────────────
    if (lessonRecords.length > 0) {
        const { error: lessonsError } = await supabase
            .from('lessons')
            .upsert(lessonRecords, { onConflict: 'id' });

        if (lessonsError) {
            console.error(`    Lessons upsert FAILED: ${lessonsError.message}`);
            return;
        }
        console.log(`    Lessons upserted OK (${lessonRecords.length} rows)`);
    } else {
        console.warn('    No lessons found in module_flow.json');
    }
}

// ── Run ──────────────────────────────────────────────────────────────
seed().catch(err => {
    console.error('\nSeed failed:', err);
    process.exit(1);
});
