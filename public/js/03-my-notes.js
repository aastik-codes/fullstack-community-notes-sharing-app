// ── 03-my-notes.js ───────────────────────────────────────────────────────────
import { requireAuth, api, initNav, logout, toast } from './api.js'

requireAuth()
initNav('My notes')

document.querySelector('.upload-cta').addEventListener('click', () => {
    window.location.href = '/04-upload.html'
})
document.querySelector('.card.ghost')?.addEventListener('click', () => {
    window.location.href = '/04-upload.html'
})

// ── State ─────────────────────────────────────────────────────────────────────
let allNotes    = []
let activeFilter = 'all'

// ── Load notes ────────────────────────────────────────────────────────────────
async function loadNotes() {
    try {
        // Use search with no filter to get user's own notes via getnotesall
        const res = await api('/user/notes/getnotesall')
        if (res.status === 401) { logout(); return }

        // getnotesall returns URLs only, so we search to get full objects
        const searchRes = await api('/user/notes/search?limit=50')
        if (!searchRes.ok) throw new Error()

        const data = await searchRes.json()
        allNotes = data.notes || []
        renderNotes()
        updateFilterCounts()
    } catch (err) {
        console.error(err)
        toast('Failed to load notes.', 'error')
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

function renderNotes() {
    const grid = document.querySelector('.grid')
    const filtered = activeFilter === 'all'
        ? allNotes
        : allNotes.filter(n => n.visibility === activeFilter)

    // Keep ghost card, rebuild rest
    const ghost = grid.querySelector('.card.ghost')
    grid.innerHTML = ''

    if (!filtered.length) {
        grid.innerHTML = `<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--pencil);font-size:14px;">No notes here yet.</div>`
        if (ghost) grid.appendChild(ghost)
        return
    }

    filtered.forEach(n => {
        const card = document.createElement('div')
        card.className = 'card'
        card.dataset.id = n._id
        const rating = n.rating
            ? `<div class="rating-disp"><svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 1l2.6 6.2 6.7.5-5.1 4.4 1.6 6.6L10 15.3 4.2 18.7l1.6-6.6L.7 7.7l6.7-.5z"/></svg>${n.rating.toFixed(1)}</div>`
            : `<div class="rating-disp empty">No ratings yet</div>`

        card.innerHTML = `
            <div class="stamp ${n.visibility}">${n.visibility}</div>
            <div class="card-top">
                <div class="file-ico"></div>
                <div>
                    <p class="card-title">${n.noteUrl.split('/').pop().replace('.pdf','').replace(/-/g,' ')}</p>
                    <div class="card-meta">uploaded ${timeAgo(n.createdAt)}</div>
                </div>
            </div>
            <div class="card-bottom">
                ${rating}
                <div class="actions">
                    <div class="icon-btn access-btn" data-id="${n._id}" title="Manage access">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="3"/><path d="M5 21a7 7 0 0114 0"/></svg>
                    </div>
                    <div class="icon-btn danger delete-btn" data-id="${n._id}" title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m1 0v12a1 1 0 01-1 1H8a1 1 0 01-1-1V7"/></svg>
                    </div>
                </div>
            </div>
        `

        // Click card → view detail (not on buttons)
        card.addEventListener('click', e => {
            if (e.target.closest('.icon-btn')) return
            localStorage.setItem('viewNoteId', n._id)
            window.location.href = '/06-note-detail.html'
        })

        grid.appendChild(card)
    })

    if (ghost) grid.appendChild(ghost)

    // Delete buttons
    grid.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async e => {
            e.stopPropagation()
            if (!confirm('Delete this note?')) return
            try {
                const res = await api('/user/notes/Deleteone', {
                    method: 'DELETE',
                    body: JSON.stringify({ noteID: btn.dataset.id })
                })
                if (res.ok) {
                    allNotes = allNotes.filter(n => n._id !== btn.dataset.id)
                    renderNotes()
                    updateFilterCounts()
                    toast('Note deleted.', 'success')
                } else {
                    toast('Could not delete note.', 'error')
                }
            } catch { toast('Network error.', 'error') }
        })
    })

    // Access buttons → go to profile access tab
    grid.querySelectorAll('.access-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation()
            localStorage.setItem('manageNoteId', btn.dataset.id)
            window.location.href = '/07-profile-access.html'
        })
    })
}

function updateFilterCounts() {
    const total   = allNotes.length
    const pub     = allNotes.filter(n => n.visibility === 'public').length
    const shared  = allNotes.filter(n => n.visibility === 'shared').length
    const priv    = allNotes.filter(n => n.visibility === 'private').length

    document.querySelector('.page-head p').textContent = `${total} active files on your shelf`

    const chips = document.querySelectorAll('.filter-bar .chip')
    const labels = [`All · ${total}`, `Public · ${pub}`, `Shared · ${shared}`, `Private · ${priv}`]
    chips.forEach((chip, i) => { chip.textContent = labels[i] })
}

// ── Filter chips ──────────────────────────────────────────────────────────────
const filterMap = ['all', 'public', 'shared', 'private']
document.querySelectorAll('.filter-bar .chip').forEach((chip, i) => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-bar .chip').forEach(c => c.classList.remove('active'))
        chip.classList.add('active')
        activeFilter = filterMap[i]
        renderNotes()
    })
})

loadNotes()
