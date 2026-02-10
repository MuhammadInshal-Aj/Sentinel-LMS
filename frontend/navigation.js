/**
 * Sentinel LMS - Navigation Module
 * Handles sidebar nav switching, profile popup, and settings tabs.
 * Standalone — no dependencies.
 *
 * Usage (call after DOMContentLoaded):
 *   Navigation.init()              — sidebar nav link → section switching
 *   Navigation.initProfilePopup()  — profile button popup toggle
 *   Navigation.initSettingsTabs()  — settings panel tab switching
 *   Navigation.goTo(sectionId)     — programmatic section navigation
 */

const Navigation = {

    // Callbacks invoked when a section becomes active.
    // Populated by pages that need to react to navigation events.
    // e.g. Navigation.onSectionActivate['my-courses'] = initializeMyCoursesPage;
    onSectionActivate: {},

    /**
     * Initialize sidebar navigation.
     * Attaches click handlers to all .nav-link[data-section] elements and
     * toggles the matching .content-section into view.
     */
    init() {
        const navLinks = document.querySelectorAll('.nav-link[data-section]');
        const sections = document.querySelectorAll('.content-section');

        if (!navLinks.length) return;

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('data-section');
                if (!sectionId) return;
                this._activate(navLinks, sections, link, sectionId);
            });
        });
    },

    /**
     * Programmatically navigate to a section by ID.
     * @param {string} sectionId - The data-section value to navigate to
     */
    goTo(sectionId) {
        const navLinks = document.querySelectorAll('.nav-link[data-section]');
        const sections = document.querySelectorAll('.content-section');
        const link = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
        if (link) {
            this._activate(navLinks, sections, link, sectionId);
        }
    },

    /**
     * Initialize profile popup toggle behavior.
     * Expects #profileBtn and #profilePopup elements in the DOM.
     */
    initProfilePopup() {
        const profileBtn = document.getElementById('profileBtn');
        const profilePopup = document.getElementById('profilePopup');
        if (!profileBtn || !profilePopup) return;

        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profilePopup.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!profileBtn.contains(e.target) && !profilePopup.contains(e.target)) {
                profilePopup.classList.remove('active');
            }
        });
    },

    /**
     * Initialize settings tab switching.
     * Handles .settings-tab[data-tab] elements toggling .settings-panel sections.
     * Scoped per .settings-container so multiple tab groups can coexist.
     */
    initSettingsTabs() {
        const settingsTabs = document.querySelectorAll('.settings-tab[data-tab]');

        settingsTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.getAttribute('data-tab');
                const parentContainer = tab.closest('.settings-container');
                if (!parentContainer || !tabName) return;

                parentContainer.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
                parentContainer.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));

                tab.classList.add('active');
                const panel = parentContainer.querySelector(`#${tabName}`);
                if (panel) panel.classList.add('active');

                if (window.lucide) lucide.createIcons();
            });
        });
    },

    // ─── Private ─────────────────────────────────────────────────────────────

    _activate(navLinks, sections, activeLink, sectionId) {
        navLinks.forEach(l => l.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));

        activeLink.classList.add('active');

        const section = document.getElementById(sectionId);
        if (section) section.classList.add('active');

        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Fire registered callback for this section if any
        const callback = this.onSectionActivate[sectionId];
        if (typeof callback === 'function') callback();
    }
};

window.Navigation = Navigation;

console.log('🧭 Navigation module loaded');
