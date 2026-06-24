// ── 02-dashboard.js ───────────────────────────────────────────────────────────
import { requireAuth, api, initNav, logout, toast } from './api.js'

requireAuth()
initNav('Dashboard')

// ── Wire nav links ────────────────────────────────────────────────────────────
document.querySelectorAll('nav a').forEach(a => {
    if (a.textContent.trim() === 'My notes') a.href = '/03-my-notes.html'
    if (a.textContent.trim() === 'Browse')   a.href = '/05-browse.html'
    if (a.textContent.trim() === 'Profile')  a.href = '/07-profile-access.html'
})

// Upload CTA → go to upload page
document.querySelector('.upload-cta').addEventListener('click', () => {
    window.location.href = '/04-upload.html'
})

// ── Load dashboard data ───────────────────────────────────────────────────────
async function loadDashboard() {
    try {
        // Fetch dashboard stats and notes in parallel
        const [dashRes, notesRes] = await Promise.all([
            api('/user/dashboard'),
            api('/user/notes/getnotesall')
        ])

        if (dashRes.status === 401 || notesRes.status === 401) {
            logout(); return
        }

        const dash  = await dashRes.json()
        const notes = await notesRes.json()   // array of noteUrls

        // ── Greeting ──────────────────────────────────────────────────────────
        const username = localStorage.getItem('username') || 'there'
        document.querySelector('.greet h1').textContent = `Good to see you, ${username}.`

        // ── Stat cards ────────────────────────────────────────────────────────
        const totalNotes = dash['Notes Uploaded'] ?? notes.length
        const rating     = Number(dash['Rating'] ?? 0).toFixed(1)

        // Notes count
        const notesVal = document.querySelector('.stat-card.notes .value')
        notesVal.innerHTML = `${totalNotes} <span class="unit">active files</span>`

        // Rating
        const ratingVal = document.querySelector('.stat-card.rating .value')
        ratingVal.innerHTML = `${rating} <span class="unit">/ 5.00</span>`

        // Render stars
        const starsEl = document.querySelector('.stars')
        if (starsEl) {
            const full = Math.round(Number(rating))
            starsEl.innerHTML = [1,2,3,4,5].map(i =>
                `<svg class="star${i > full ? ' empty' : ''}" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 1l2.6 6.2 6.7.5-5.1 4.4 1.6 6.6L10 15.3 4.2 18.7l1.6-6.6L.7 7.7l6.7-.5z"/>
                </svg>`
            ).join('')
        }

        // ── Recent list ───────────────────────────────────────────────────────
        // Fetch full note objects for recent items
        const fullRes = await api('/user/notes/getnotesall')
        // getnotesall returns array of URLs; we need to do search to get objects
        const searchRes = await api('/user/notes/search?limit=4')
        let recentNotes = []
        if (searchRes.ok) {
            const data = await searchRes.json()
            recentNotes = data.notes || []
        }

        renderRecentList(recentNotes)

    } catch (err) {
        console.error(err)
        toast('Failed to load dashboard data.', 'error')
    }
}

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const days = Math.floor(diff / 86400000)
    if (days < 1)  return 'today'
    if (days === 1) return '1 day ago'
    if (days < 7)  return `${days} days ago`
    if (days < 14) return '1 week ago'
    return `${Math.floor(days/7)} weeks ago`
}

function renderRecentList(notes) {
    const list = document.querySelector('.recent-list')
    if (!list) return

    if (!notes.length) {
        list.innerHTML = `<div style="padding:28px 22px;color:var(--pencil);font-size:14px;text-align:center;">No notes yet. Upload your first one!</div>`
        return
    }

    list.innerHTML = notes.map(n => `
        <div class="recent-item" data-id="${n._id}" style="cursor:pointer;">
            <div class="file-ico"></div>
            <div class="item-info">
                <div class="name">${n.noteUrl.split('/').pop()}</div>
                <div class="meta">uploaded ${timeAgo(n.createdAt)}</div>
            </div>
            <span class="status-pill ${n.visibility}">${n.visibility}</span>
            <div class="item-rating">${n.rating ? '★ ' + n.rating.toFixed(1) : '★ —'}</div>
        </div>
    `).join('')

    // Click → note detail
    list.querySelectorAll('.recent-item').forEach(row => {
        row.addEventListener('click', () => {
            localStorage.setItem('viewNoteId', row.dataset.id)
            window.location.href = '/06-note-detail.html'
        })
    })
}

loadDashboard()
