/**
 * Sentinel LMS - Toast Notification System
 * Floating toast notifications that match the existing design system.
 * Standalone — no dependencies.
 *
 * Usage:
 *   Toast.success('Settings saved.')
 *   Toast.error('Something went wrong.')
 *   Toast.info('New update available.')
 *   Toast.warning('Token balance low.')
 *   Toast.show('Custom message', 'success', 4000)
 */

const Toast = (() => {
    const CONTAINER_ID = 'toast-container';
    const DEFAULT_DURATION = 3500;

    const ICONS = {
        success: 'check-circle',
        error: 'alert-circle',
        warning: 'alert-triangle',
        info: 'info'
    };

    const COLORS = {
        success: 'var(--success, #00c896)',
        error: 'var(--danger, #ff4757)',
        warning: 'var(--warning, #ffa502)',
        info: 'var(--accent, #00f2ff)'
    };

    function getContainer() {
        let container = document.getElementById(CONTAINER_ID);
        if (!container) {
            container = document.createElement('div');
            container.id = CONTAINER_ID;
            container.style.cssText = `
                position: fixed;
                bottom: 1.5rem;
                right: 1.5rem;
                display: flex;
                flex-direction: column-reverse;
                gap: 0.6rem;
                z-index: 9999;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }
        return container;
    }

    function show(message, type = 'info', duration = DEFAULT_DURATION) {
        const container = getContainer();
        const color = COLORS[type] || COLORS.info;
        const icon = ICONS[type] || ICONS.info;

        const toast = document.createElement('div');
        toast.style.cssText = `
            display: flex;
            align-items: center;
            gap: 0.65rem;
            padding: 0.75rem 1.1rem;
            background: var(--surface, #111);
            border: 1px solid ${color};
            border-left: 3px solid ${color};
            border-radius: 6px;
            color: var(--text-primary, #e0e0e0);
            font-family: var(--font-primary, 'Space Grotesk', sans-serif);
            font-size: 0.875rem;
            max-width: 320px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
            pointer-events: all;
            opacity: 0;
            transform: translateX(20px);
            transition: opacity 0.2s ease, transform 0.2s ease;
        `;

        toast.innerHTML = `
            <i data-lucide="${icon}" style="width:16px;height:16px;color:${color};flex-shrink:0;"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        // Render Lucide icon if available
        if (window.lucide) lucide.createIcons({ nodes: [toast] });

        // Animate in
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                toast.style.opacity = '1';
                toast.style.transform = 'translateX(0)';
            });
        });

        // Auto-remove
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(20px)';
            toast.addEventListener('transitionend', () => toast.remove(), { once: true });
        }, duration);
    }

    return {
        show,
        success: (msg, duration) => show(msg, 'success', duration),
        error:   (msg, duration) => show(msg, 'error',   duration),
        warning: (msg, duration) => show(msg, 'warning', duration),
        info:    (msg, duration) => show(msg, 'info',    duration)
    };
})();

window.Toast = Toast;

console.log('🔔 Toast notification system loaded');
