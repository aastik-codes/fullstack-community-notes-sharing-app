// ── Shared utilities used by every page ──────────────────────────────────────

export const token = () => localStorage.getItem('token')

export function requireAuth() {
    if (!token()) window.location.href = '/01-auth.html'
}

export function logout() {
    localStorage.removeItem('token')
    window.location.href = '/01-auth.html'
}

// Authenticated fetch wrapper
export async function api(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers }
    if (token()) headers['Authorization'] = `Bearer ${token()}`
    const res = await fetch(path, { ...options, headers })
    return res
}

// Wire up nav links and avatar initial
export function initNav(activeLabel) {
    const pages = {
        'Dashboard':  '/02-dashboard.html',
        'My notes':   '/03-my-notes.html',
        'Browse':     '/05-browse.html',
        'Profile':    '/07-profile-access.html',
    }
    document.querySelectorAll('nav a').forEach(a => {
        const label = a.textContent.trim()
        if (pages[label]) a.href = pages[label]
        a.classList.toggle('active', label === activeLabel)
    })
    // set avatar letter from stored username
    const username = localStorage.getItem('username') || '?'
    const av = document.querySelector('.avatar')
    if (av) av.textContent = username[0].toUpperCase()
}

// Simple toast
export function toast(msg, type = 'info') {
    const el = document.createElement('div')
    el.textContent = msg
    el.style.cssText = `
        position:fixed;bottom:28px;right:28px;z-index:9999;
        padding:13px 20px;border-radius:9px;font-size:13.5px;font-weight:600;
        font-family:'Inter',sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.18);
        background:${type === 'error' ? '#A33B2E' : type === 'success' ? '#3D5A4C' : '#1C1B19'};
        color:#FAF7F0;animation:slideToast .3s cubic-bezier(.16,1,.3,1);
    `
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 3200)
}

// Inject shared toast keyframes once
const style = document.createElement('style')
style.textContent = `@keyframes slideToast{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}`
document.head.appendChild(style)
