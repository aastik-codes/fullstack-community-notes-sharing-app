import {
    requireAuth,
    api,
    initNav,
    logout,
    toast,
    escapeHTML,
    noteName,
    formatFileSize,
    timeAgo,
    readJson
} from './api.js'

let allNotes = []
let activeFilter = 'all'

if (requireAuth()) {
    initNav('My notes')
    loadNotes()
}

document.querySelector('.upload-cta')?.addEventListener('click', () => {
    window.location.href = '/04-upload.html'
})

document.querySelector('.card.ghost')?.addEventListener('click', () => {
    window.location.href = '/04-upload.html'
})

async function loadNotes() {
    try {
        const response = await api('/user/notes/getnotesall')

        if (response.status === 401) {
            logout()
            return
        }

        const data = await readJson(response)

        if (!response.ok) {
            throw new Error(data.message || 'Could not load notes')
        }

        allNotes = data.notes || []
        renderNotes()
        updateFilterCounts()
    } catch (error) {
        console.error(error)
        toast('Failed to load notes.', 'error')
        renderLoadError()
    }
}

function renderLoadError() {
    const grid = document.querySelector('.grid')
    grid.querySelectorAll('.card:not(.ghost), .notes-state').forEach(item => {
        item.remove()
    })

    const state = document.createElement('div')
    state.className = 'notes-state'
    state.style.cssText =
        'grid-column:1/-1;padding:40px;text-align:center;color:var(--rust);font-size:14px;'
    state.textContent = 'Could not load your notes.'

    grid.prepend(state)
}

function renderNotes() {
    const grid = document.querySelector('.grid')
    const ghostCard = grid.querySelector('.card.ghost')

    grid.querySelectorAll('.card:not(.ghost), .notes-state').forEach(item => {
        item.remove()
    })

    const filteredNotes =
        activeFilter === 'all'
            ? allNotes
            : allNotes.filter(note => note.visibility === activeFilter)

    if (!filteredNotes.length) {
        const state = document.createElement('div')
        state.className = 'notes-state'
        state.style.cssText =
            'grid-column:1/-1;padding:40px;text-align:center;color:var(--pencil);font-size:14px;'
        state.textContent =
            activeFilter === 'all'
                ? 'No notes yet. Upload your first one!'
                : `No ${activeFilter} notes yet.`

        grid.insertBefore(state, ghostCard)
        return
    }

    filteredNotes.forEach(note => {
        const card = document.createElement('div')
        card.className = 'card'
        card.dataset.id = note._id

        const rating = Number(note.rating || 0)
        const ratingHTML = rating
            ? `
                <div class="rating-disp">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 1l2.6 6.2 6.7.5-5.1 4.4 1.6 6.6L10 15.3 4.2 18.7l1.6-6.6L.7 7.7l6.7-.5z"/>
                    </svg>
                    ${rating.toFixed(1)}
                    <span style="color:var(--pencil);font-weight:400;">
                        · ${Number(note.ratingCount || 0)}
                    </span>
                </div>
            `
            : '<div class="rating-disp empty">No ratings yet</div>'

        card.innerHTML = `
            <div class="stamp ${escapeHTML(note.visibility)}">
                ${escapeHTML(note.visibility)}
            </div>

            <div class="card-top">
                <div class="file-ico"></div>
                <div>
                    <p class="card-title">${escapeHTML(noteName(note))}</p>
                    <div class="card-meta">
                        ${escapeHTML(formatFileSize(note.fileSize))}
                        · uploaded ${escapeHTML(timeAgo(note.createdAt))}
                    </div>
                </div>
            </div>

            <div class="card-bottom">
                ${ratingHTML}

                <div class="actions">
                    <div class="icon-btn access-btn"
                         data-id="${escapeHTML(note._id)}"
                         title="Manage access">
                        <svg viewBox="0 0 24 24"
                             fill="none"
                             stroke="currentColor"
                             stroke-width="2">
                            <circle cx="12" cy="8" r="3"/>
                            <path d="M5 21a7 7 0 0114 0"/>
                        </svg>
                    </div>

                    <div class="icon-btn danger delete-btn"
                         data-id="${escapeHTML(note._id)}"
                         title="Delete">
                        <svg viewBox="0 0 24 24"
                             fill="none"
                             stroke="currentColor"
                             stroke-width="2">
                            <path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m1 0v12a1 1 0 01-1 1H8a1 1 0 01-1-1V7"/>
                        </svg>
                    </div>
                </div>
            </div>
        `

        card.addEventListener('click', event => {
            if (event.target.closest('.icon-btn')) {
                return
            }

            localStorage.setItem('viewNoteId', note._id)
            window.location.href = '/06-note-detail.html'
        })

        card.querySelector('.delete-btn').addEventListener(
            'click',
            () => deleteNote(note._id)
        )

        card.querySelector('.access-btn').addEventListener(
            'click',
            () => {
                localStorage.setItem('manageNoteId', note._id)
                window.location.href = '/07-profile-access.html'
            }
        )

        grid.insertBefore(card, ghostCard)
    })
}

async function deleteNote(noteId) {
    if (!confirm('Delete this note?')) {
        return
    }

    try {
        const response = await api('/user/notes/deleteone', {
            method: 'DELETE',
            body: JSON.stringify({ noteId })
        })

        const data = await readJson(response)

        if (!response.ok) {
            toast(data.message || 'Could not delete note.', 'error')
            return
        }

        allNotes = allNotes.filter(note => note._id !== noteId)
        renderNotes()
        updateFilterCounts()
        toast('Note deleted.', 'success')
    } catch (error) {
        console.error(error)
        toast('Network error.', 'error')
    }
}

function updateFilterCounts() {
    const total = allNotes.length
    const publicCount = allNotes.filter(
        note => note.visibility === 'public'
    ).length
    const sharedCount = allNotes.filter(
        note => note.visibility === 'shared'
    ).length
    const privateCount = allNotes.filter(
        note => note.visibility === 'private'
    ).length

    document.querySelector('.page-head p').textContent =
        `${total} active file${total === 1 ? '' : 's'} on your shelf`

    const labels = [
        `All · ${total}`,
        `Public · ${publicCount}`,
        `Shared · ${sharedCount}`,
        `Private · ${privateCount}`
    ]

    document.querySelectorAll('.filter-bar .chip').forEach((chip, index) => {
        chip.textContent = labels[index]
    })
}

const filterMap = ['all', 'public', 'shared', 'private']

document.querySelectorAll('.filter-bar .chip').forEach((chip, index) => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-bar .chip').forEach(item => {
            item.classList.remove('active')
        })

        chip.classList.add('active')
        activeFilter = filterMap[index]
        renderNotes()
    })
})