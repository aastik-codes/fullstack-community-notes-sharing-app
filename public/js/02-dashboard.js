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

if (requireAuth()) {
    initNav('Dashboard')
    loadDashboard()
}

document.querySelector('.upload-cta')?.addEventListener('click', () => {
    window.location.href = '/04-upload.html'
})

document.querySelector('.section-head a')?.addEventListener('click', event => {
    event.preventDefault()
    window.location.href = '/03-my-notes.html'
})

async function loadDashboard() {
    try {
        const response = await api('/user/dashboard')

        if (response.status === 401) {
            logout()
            return
        }

        const data = await readJson(response)

        if (!response.ok) {
            throw new Error(data.message || 'Dashboard request failed')
        }

        localStorage.setItem('username', data.username)

        const avatar = document.querySelector('.avatar')
        if (avatar) {
            avatar.textContent =
                data.username?.charAt(0).toUpperCase() || '?'
        }

        document.querySelector('.greet h1').textContent =
            `Good to see you, ${data.username}.`

        document.querySelector('.stat-card.notes .value').innerHTML =
            `${data.totalNotes} <span class="unit">active files</span>`

        const counts = data.counts || {
            private: 0,
            shared: 0,
            public: 0
        }

        const legendItems =
            document.querySelectorAll('.stat-card.notes .legend span')

        if (legendItems[0]) {
            legendItems[0].lastChild.textContent =
                ` private · ${counts.private || 0}`
        }
        if (legendItems[1]) {
            legendItems[1].lastChild.textContent =
                ` shared · ${counts.shared || 0}`
        }
        if (legendItems[2]) {
            legendItems[2].lastChild.textContent =
                ` public · ${counts.public || 0}`
        }

        const barValues = [
            Number(counts.private || 0),
            Number(counts.shared || 0),
            Number(counts.public || 0)
        ]
        const largestBar = Math.max(...barValues, 1)

        document.querySelectorAll('.mini-bars i').forEach((bar, index) => {
            const value = barValues[index]
            bar.style.height = value
                ? `${Math.max((value / largestBar) * 100, 12)}%`
                : '0%'
        })

        const rating = Number(data.rating || 0)

        document.querySelector('.stat-card.rating .value').innerHTML =
            `${rating.toFixed(1)} <span class="unit">/ 5.00</span>`

        renderStars(rating)
        renderTopRated(data.topRatedNote)
        renderRecentList(data.recentNotes || [])
    } catch (error) {
        console.error(error)
        toast('Failed to load dashboard data.', 'error')

        document.querySelector('.recent-list').innerHTML =
            '<div style="padding:28px 22px;text-align:center;color:var(--rust);">Could not load your dashboard.</div>'
    }
}

function renderStars(rating) {
    const starsElement = document.querySelector('.stars')

    if (!starsElement) {
        return
    }

    const filledStars = Math.round(Number(rating || 0))

    starsElement.innerHTML = [1, 2, 3, 4, 5]
        .map(
            number => `
                <svg class="star${number > filledStars ? ' empty' : ''}"
                     viewBox="0 0 20 20"
                     fill="currentColor">
                    <path d="M10 1l2.6 6.2 6.7.5-5.1 4.4 1.6 6.6L10 15.3 4.2 18.7l1.6-6.6L.7 7.7l6.7-.5z"/>
                </svg>
            `
        )
        .join('')
}

function renderTopRated(note) {
    const titleElement = document.getElementById('top-note-title')
    const visibilityElement =
        document.getElementById('top-note-visibility')
    const metaElement = document.getElementById('top-note-meta')

    if (!titleElement || !visibilityElement || !metaElement) {
        return
    }

    if (!note) {
        titleElement.textContent = 'No rated notes yet'
        visibilityElement.textContent = '—'
        visibilityElement.className = 'status-pill'
        metaElement.textContent = 'Ratings will appear here'
        return
    }

    titleElement.textContent = noteName(note)
    visibilityElement.textContent = note.visibility
    visibilityElement.className =
        `status-pill ${note.visibility}`

    const ratingCount = Number(note.ratingCount || 0)
    metaElement.textContent =
        `★ ${Number(note.rating || 0).toFixed(1)} · ` +
        `${ratingCount} rating${ratingCount === 1 ? '' : 's'}`
}

function renderRecentList(notes) {
    const list = document.querySelector('.recent-list')

    if (!list) {
        return
    }

    if (!notes.length) {
        list.innerHTML = `
            <div style="padding:28px 22px;color:var(--pencil);font-size:14px;text-align:center;">
                No notes yet. Upload your first one!
            </div>
        `
        return
    }

    list.innerHTML = notes
        .map(
            note => `
                <div class="recent-item"
                     data-id="${escapeHTML(note._id)}"
                     style="cursor:pointer;">
                    <div class="file-ico"></div>
                    <div class="item-info">
                        <div class="name">${escapeHTML(noteName(note, true))}</div>
                        <div class="meta">
                            uploaded ${escapeHTML(timeAgo(note.createdAt))}
                            · ${escapeHTML(formatFileSize(note.fileSize))}
                        </div>
                    </div>
                    <span class="status-pill ${escapeHTML(note.visibility)}">
                        ${escapeHTML(note.visibility)}
                    </span>
                    <div class="item-rating">
                        ${Number(note.rating || 0) > 0
                            ? `★ ${Number(note.rating).toFixed(1)}`
                            : '★ —'}
                    </div>
                </div>
            `
        )
        .join('')

    list.querySelectorAll('.recent-item').forEach(row => {
        row.addEventListener('click', () => {
            localStorage.setItem('viewNoteId', row.dataset.id)
            window.location.href = '/06-note-detail.html'
        })
    })
}
