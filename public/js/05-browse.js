import {
    requireAuth,
    api,
    initNav,
    logout,
    escapeHTML,
    noteName,
    timeAgo,
    readJson
} from './api.js'

let currentPage = 1
const LIMIT = 5
let searchQuery = ''
let sortValue = 'highest'
let debounceTimer

if (requireAuth()) {
    initNav('Browse')
    loadNotes()
}

const searchInput = document.querySelector('.search-box input')
const sortSelect = document.querySelector('.sort-select select')
const listElement = document.querySelector('.list')
const countElement =
    document.querySelector('.results-line .count:first-child')
const pageInfoElement =
    document.querySelector('.results-line .count:last-child')
const paginationElement = document.querySelector('.pagination')

const sortMap = {
    'Sort: Highest rated': 'highest',
    'Sort: Lowest rated': 'lowest',
    'Sort: Newest first': 'newest',
    'Sort: Oldest first': 'oldest'
}

searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer)

    debounceTimer = setTimeout(() => {
        searchQuery = searchInput.value.trim()
        currentPage = 1
        loadNotes()
    }, 350)
})

sortSelect.addEventListener('change', () => {
    sortValue = sortMap[sortSelect.value] || 'highest'
    currentPage = 1
    loadNotes()
})

async function loadNotes() {
    listElement.innerHTML = `
        <div style="padding:30px;text-align:center;color:var(--pencil);font-size:13.5px;">
            Loading…
        </div>
    `

    try {
        let url =
            `/user/notes/search?page=${currentPage}` +
            `&limit=${LIMIT}&sort=${sortValue}`

        if (searchQuery) {
            url += `&search=${encodeURIComponent(searchQuery)}`
        }

        const response = await api(url)

        if (response.status === 401) {
            logout()
            return
        }

        const data = await readJson(response)

        if (!response.ok) {
            throw new Error(data.message || 'Could not load notes')
        }

        renderList(data.notes || [])
        renderMeta(data)
        renderPagination(data.currentPage, data.totalPages)
    } catch (error) {
        console.error(error)

        listElement.innerHTML = `
            <div style="padding:30px;text-align:center;color:var(--rust);font-size:13.5px;">
                Failed to load notes. Please try again.
            </div>
        `

        countElement.textContent = 'Could not load results'
        pageInfoElement.textContent = ''
        paginationElement.innerHTML = ''
    }
}

function renderList(notes) {
    if (!notes.length) {
        const queryText = searchQuery
            ? ` for "${escapeHTML(searchQuery)}"`
            : ''

        listElement.innerHTML = `
            <div style="padding:40px;text-align:center;color:var(--pencil);font-size:14px;">
                No public notes found${queryText}.
            </div>
        `
        return
    }

    listElement.innerHTML = notes
        .map((note, index) => {
            const uploader = note.user?.username || 'Unknown'
            const email = note.user?.email || ''
            const initial = uploader.charAt(0).toUpperCase() || '?'
            const rating = Number(note.rating || 0)
            const ratingCount = Number(note.ratingCount || 0)

            return `
                <div class="row-card"
                     data-id="${escapeHTML(note._id)}"
                     style="cursor:pointer;animation-delay:${index * 0.05}s">

                    <div class="file-ico"></div>

                    <div class="row-info">
                        <div class="title">${escapeHTML(noteName(note))}</div>
                        <div class="by">
                            <span class="mini-avatar">${escapeHTML(initial)}</span>
                            ${escapeHTML(uploader)}
                            ${email ? `· ${escapeHTML(email)}` : ''}
                        </div>
                    </div>

                    <div class="row-rating">
                        <svg viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 1l2.6 6.2 6.7.5-5.1 4.4 1.6 6.6L10 15.3 4.2 18.7l1.6-6.6L.7 7.7l6.7-.5z"/>
                        </svg>
                        ${rating > 0 ? rating.toFixed(1) : '—'}
                        <span class="count">(${ratingCount})</span>
                    </div>

                    <div class="row-date">${escapeHTML(timeAgo(note.createdAt))}</div>

                    <button class="view-btn" type="button">View</button>
                </div>
            `
        })
        .join('')

    listElement.querySelectorAll('.row-card').forEach(row => {
        row.addEventListener('click', () => {
            localStorage.setItem('viewNoteId', row.dataset.id)
            window.location.href = '/06-note-detail.html'
        })
    })
}

function renderMeta(data) {
    const totalNotes = Number(data.totalNotes || 0)
    const page = Number(data.currentPage || 1)
    const totalPages = Number(data.totalPages || 0)

    if (totalNotes === 0) {
        countElement.textContent = '0 public notes'
        pageInfoElement.textContent = 'Page 0 of 0'
        return
    }

    const start = (page - 1) * LIMIT + 1
    const end = Math.min(page * LIMIT, totalNotes)

    countElement.innerHTML =
        `Showing <b>${start}–${end}</b> of ` +
        `<b>${totalNotes}</b> public notes`

    pageInfoElement.innerHTML =
        `Page <b>${page}</b> of <b>${totalPages}</b>`
}

function renderPagination(page, totalPages) {
    if (totalPages <= 1) {
        paginationElement.innerHTML = ''
        return
    }

    let html = `
        <button class="pg-btn prev-btn"
                ${page === 1 ? 'disabled' : ''}>
            ‹ Prev
        </button>
    `

    for (let number = 1; number <= totalPages; number += 1) {
        const isNearby =
            number === 1 ||
            number === totalPages ||
            (number >= page - 1 && number <= page + 1)

        if (isNearby) {
            html += `
                <button class="pg-btn ${number === page ? 'active' : ''}"
                        data-page="${number}">
                    ${number}
                </button>
            `
        } else if (
            number === page - 2 ||
            number === page + 2
        ) {
            html += '<button class="pg-btn dots" disabled>···</button>'
        }
    }

    html += `
        <button class="pg-btn next-btn"
                ${page === totalPages ? 'disabled' : ''}>
            Next ›
        </button>
    `

    paginationElement.innerHTML = html

    paginationElement
        .querySelector('.prev-btn')
        ?.addEventListener('click', () => {
            currentPage -= 1
            loadNotes()
        })

    paginationElement
        .querySelector('.next-btn')
        ?.addEventListener('click', () => {
            currentPage += 1
            loadNotes()
        })

    paginationElement.querySelectorAll('[data-page]').forEach(button => {
        button.addEventListener('click', () => {
            currentPage = Number(button.dataset.page)
            loadNotes()
        })
    })
}