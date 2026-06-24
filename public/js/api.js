export const token = () => localStorage.getItem('token')

export function requireAuth() {
    if (!token()) {
        window.location.replace('/01-auth.html')
        return false
    }

    return true
}

export function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('userId')
    localStorage.removeItem('viewNoteId')
    localStorage.removeItem('manageNoteId')
    window.location.replace('/01-auth.html')
}

export async function api(path, options = {}) {
    const headers = { ...(options.headers || {}) }

    const isFormData = options.body instanceof FormData

    if (options.body !== undefined && !isFormData && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json'
    }

    if (token()) {
        headers.Authorization = `Bearer ${token()}`
    }

    return fetch(path, {
        ...options,
        headers
    })
}

export async function readJson(response) {
    const text = await response.text()

    if (!text) {
        return {}
    }

    try {
        return JSON.parse(text)
    } catch {
        return { message: text }
    }
}

export function initNav(activeLabel) {
    const pages = {
        Dashboard: '/02-dashboard.html',
        'My notes': '/03-my-notes.html',
        Browse: '/05-browse.html',
        Profile: '/07-profile-access.html'
    }

    document.querySelectorAll('nav a').forEach(link => {
        const label = link.textContent.trim()

        if (pages[label]) {
            link.href = pages[label]
        }

        link.classList.toggle('active', label === activeLabel)
    })

    const username = localStorage.getItem('username') || '?'
    const avatar = document.querySelector('.avatar')

    if (avatar) {
        avatar.textContent = username.charAt(0).toUpperCase() || '?'
        avatar.style.cursor = 'pointer'
        avatar.title = 'Click to log out'
        avatar.onclick = () => {
            if (confirm('Log out?')) {
                logout()
            }
        }
    }
}

export function toast(message, type = 'info') {
    const element = document.createElement('div')
    element.textContent = message
    element.style.cssText = `
        position:fixed;
        bottom:28px;
        right:28px;
        z-index:9999;
        max-width:min(360px,calc(100vw - 40px));
        padding:13px 20px;
        border-radius:9px;
        font-size:13.5px;
        font-weight:600;
        font-family:'Inter',sans-serif;
        box-shadow:0 8px 24px rgba(0,0,0,.18);
        background:${type === 'error'
            ? '#A33B2E'
            : type === 'success'
                ? '#3D5A4C'
                : '#1C1B19'};
        color:#FAF7F0;
        animation:slideToast .3s cubic-bezier(.16,1,.3,1);
    `

    document.body.appendChild(element)
    setTimeout(() => element.remove(), 3200)
}

export function escapeHTML(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;')
}

export function noteName(note = {}, includeExtension = false) {
    let name =
        note.title ||
        note.originalName ||
        note.noteUrl?.split('/').pop()?.split('?')[0] ||
        'Untitled note'

    try {
        name = decodeURIComponent(name)
    } catch {
        // Keep the original string if it is not URI encoded.
    }

    name = name.replace(/[_-]+/g, ' ').trim()

    if (!includeExtension) {
        name = name.replace(/\.pdf$/i, '')
    }

    return name || 'Untitled note'
}

export function formatFileSize(bytes) {
    const size = Number(bytes)

    if (!Number.isFinite(size) || size <= 0) {
        return 'PDF'
    }

    if (size < 1024) {
        return `${size} B`
    }

    if (size < 1024 * 1024) {
        return `${Math.round(size / 1024)} KB`
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function timeAgo(dateString) {
    if (!dateString) {
        return 'recently'
    }

    const timestamp = new Date(dateString).getTime()

    if (!Number.isFinite(timestamp)) {
        return 'recently'
    }

    const difference = Math.max(Date.now() - timestamp, 0)
    const minutes = Math.floor(difference / 60000)
    const hours = Math.floor(difference / 3600000)
    const days = Math.floor(difference / 86400000)

    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days === 1) return '1 day ago'
    if (days < 7) return `${days} days ago`
    if (days < 14) return '1 week ago'
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    if (days < 365) return `${Math.floor(days / 30)} months ago`

    return `${Math.floor(days / 365)} years ago`
}

const style = document.createElement('style')
style.textContent = `
    @keyframes slideToast {
        from {
            opacity:0;
            transform:translateY(10px);
        }
        to {
            opacity:1;
            transform:translateY(0);
        }
    }
`
document.head.appendChild(style)