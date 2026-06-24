// ── 05-browse.js ─────────────────────────────────────────────────────────────
import { requireAuth, api, initNav, logout, toast } from './api.js'

requireAuth()
initNav('Browse')

// ── State ─────────────────────────────────────────────────────────────────────
let currentPage  = 1
const LIMIT      = 5
let searchQuery  = ''
let sortValue    = 'highest'

// Sort option mapping
const sortMap = {
    'Sort: Highest rated': 'highest',
    'Sort: Lowest rated':  'lowest',
    'Sort: Newest first':  'newest',
    'Sort: Oldest first':  'oldest',
}

// ── Elements ──────────────────────────────────────────────────────────────────
const searchInput  = document.querySelector('.search-box input')
const sortSelect   = document.querySelector('.sort-select select')
const listEl       = document.querySelector('.list')
const countEl      = document.querySelector('.results-line .count:first-child')
const pageInfoEl   = document.querySelector('.results-line .count:last-child')
const paginationEl = document.querySelector('.pagination')

// ── Search input — debounced ──────────────────────────────────────────────────
let debounceTimer
searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
        searchQuery = searchInput.value.trim()
        currentPage = 1
        loadNotes()
    }, 400)
})

// ── Sort change ───────────────────────────────────────────────────────────────
sortSelect.addEventListener('change', () => {
    sortValue   = sortMap[sortSelect.value] || 'highest'
    currentPage = 1
    loadNotes()
})

// ── Load notes ────────────────────────────────────────────────────────────────
async function loadNotes() {
    listEl.innerHTML = `<div style="padding:30px;text-align:center;color:var(--pencil);font-size:13.5px;">Loading…</div>`

    try {
        let url = `/user/notes/search?page=${currentPage}&limit=${LIMIT}&sort=${sortValue}`
        if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`

        const res = await api(url)
        if (res.status === 401) { logout(); return }
        if (!res.ok) throw new Error()

        const data = await res.json()
        renderList(data.notes || [])
        renderMeta(data)
        renderPagination(data.currentPage, data.totalPages)

    } catch (err) {
        listEl.innerHTML = `<div style="padding:30px;text-align:center;color:var(--rust);font-size:13.5px;">Failed to load notes. Please try again.</div>`
    }
}

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const days = Math.floor(diff / 86400000)
    if (days < 1)  return 'today'
    if (days === 1) return '1 day ago'
    if (days < 7)  return `${days} days ago`
    if (days < 14) return '1 week ago'
    if (days < 30) return `${Math.floor(days/7)} weeks ago`
    return `${Math.floor(days/30)} months ago`
}

function renderList(notes) {
    if (!notes.length) {
        listEl.innerHTML = `<div style="padding:40px;text-align:center;color:var(--pencil);font-size:14px;">No public notes found${searchQuery ? ' for "' + searchQuery + '"' : ''}.</div>`
        return
    }

    listEl.innerHTML = notes.map((n, i) => {
        const uploader  = n.user?.username || 'Unknown'
        const email     = n.user?.email    || ''
        const initial   = uploader[0]?.toUpperCase() || '?'
        const ratingStr = n.rating ? `${n.rating.toFixed(1)}` : '—'
        const filename  = n.noteUrl.split('/').pop().replace('.pdf','').replace(/-/g,' ')

        return `
        <div class="row-card" data-id="${n._id}" style="cursor:pointer;animation-delay:${i * 0.05}s">
            <div class="file-ico"></div>
            <div class="row-info">
                <div class="title">${filename}</div>
                <div class="by">
                    <span class="mini-avatar">${initial}</span>
                    ${uploader} · ${email}
                </div>
            </div>
            <div class="row-rating">
                <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 1l2.6 6.2 6.7.5-5.1 4.4 1.6 6.6L10 15.3 4.2 18.7l1.6-6.6L.7 7.7l6.7-.5z"/></svg>
                ${ratingStr}
            </div>
            <div class="row-date">${timeAgo(n.createdAt)}</div>
            <button class="view-btn">View</button>
        </div>`
    }).join('')

    // Click row or View button → note detail
    listEl.querySelectorAll('.row-card').forEach(row => {
        row.addEventListener('click', () => {
            localStorage.setItem('viewNoteId', row.dataset.id)
            window.location.href = '/06-note-detail.html'
        })
    })
}

function renderMeta(data) {
    const start = (data.currentPage - 1) * LIMIT + 1
    const end   = Math.min(data.currentPage * LIMIT, data.totalNotes)
    countEl.innerHTML   = `Showing <b>${start}–${end}</b> of <b>${data.totalNotes}</b> public notes`
    pageInfoEl.innerHTML = `Page <b>${data.currentPage}</b> of <b>${data.totalPages}</b>`
}

function renderPagination(page, total) {
    if (total <= 1) { paginationEl.innerHTML = ''; return }

    let html = `<button class="pg-btn prev-btn" ${page === 1 ? 'disabled' : ''}>‹ Prev</button>`

    for (let i = 1; i <= total; i++) {
        if (i === 1 || i === total || (i >= page - 1 && i <= page + 1)) {
            html += `<button class="pg-btn ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`
        } else if (i === page - 2 || i === page + 2) {
            html += `<button class="pg-btn dots">···</button>`
        }
    }

    html += `<button class="pg-btn next-btn" ${page === total ? 'disabled' : ''}>Next ›</button>`
    paginationEl.innerHTML = html

    paginationEl.querySelector('.prev-btn')?.addEventListener('click', () => { currentPage--; loadNotes() })
    paginationEl.querySelector('.next-btn')?.addEventListener('click', () => { currentPage++; loadNotes() })
    paginationEl.querySelectorAll('[data-page]').forEach(btn => {
        btn.addEventListener('click', () => { currentPage = Number(btn.dataset.page); loadNotes() })
    })
}

loadNotes()
