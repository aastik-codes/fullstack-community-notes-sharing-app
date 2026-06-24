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

const noteId = localStorage.getItem('viewNoteId')
let myRating = 0
let currentNote = null

if (!requireAuth()) {
    // requireAuth already redirects.
} else if (!noteId) {
    window.location.replace('/05-browse.html')
} else {
    initNav('Browse')
    loadNote()
}

document.querySelector('.crumb a').href = '/05-browse.html'

async function fetchNote() {
    const response = await api(
        `/user/notes/getnotesone/${encodeURIComponent(noteId)}`
    )

    if (response.status === 401) {
        logout()
        return null
    }

    const data = await readJson(response)

    if (response.status === 403) {
        throw new Error(data.message || 'You do not have access to this note.')
    }

    if (!response.ok) {
        throw new Error(data.message || 'Failed to load note.')
    }

    return data
}

async function loadNote() {
    try {
        currentNote = await fetchNote()

        if (!currentNote) {
            return
        }

        myRating = Number(currentNote.myRating || 0)

        renderNote(currentNote)
        setupRatingStars()
        renderRatingSummary(currentNote)
        await loadComments()
    } catch (error) {
        console.error(error)
        toast(error.message || 'Failed to load note.', 'error')

        document.querySelector('.pdf-page').innerHTML = `
            <div style="padding:48px;text-align:center;color:var(--rust);">
                ${escapeHTML(error.message || 'Failed to load note.')}
            </div>
        `
    }
}

function renderNote(note) {
    const title = noteName(note)
    const uploader = note.user?.username || 'Unknown'
    const email = note.user?.email || ''
    const initial = uploader.charAt(0).toUpperCase() || '?'

    document.title = `Marginalia — ${title}`

    document.querySelector('.crumb').innerHTML = `
        <a href="/05-browse.html">Browse</a>
        / ${escapeHTML(title)}
    `

    document.querySelector('.viewer-head h1').textContent = title

    document.querySelector('.viewer-head .by').innerHTML = `
        <span class="mini-avatar">${escapeHTML(initial)}</span>
        ${escapeHTML(uploader)}
        · uploaded ${escapeHTML(timeAgo(note.createdAt))}
        · ${escapeHTML(formatFileSize(note.fileSize))}
    `

    const statusPill = document.querySelector('.viewer-head .status-pill')
    statusPill.textContent = note.visibility
    statusPill.className = `status-pill ${note.visibility}`

    const pdfPage = document.querySelector('.pdf-page')
    pdfPage.innerHTML = ''

    const frame = document.createElement('iframe')
    frame.src = note.noteUrl
    frame.style.cssText =
        'width:100%;height:70vh;min-height:620px;border:none;background:white;'
    frame.title = title
    pdfPage.appendChild(frame)

    const downloadButton = document.querySelector('.download-btn')
    downloadButton.onclick = () => {
        window.open(note.noteUrl, '_blank', 'noopener,noreferrer')
    }

    document.querySelector('.side-card .nm').textContent = uploader
    document.querySelector('.side-card .em').textContent = email

    const uploaderRating = document.getElementById('uploader-rating')
    if (uploaderRating) {
        uploaderRating.textContent =
            `★ ${Number(note.user?.Rating || 0).toFixed(1)}`
    }
}

function setupRatingStars() {
    const starsElement = document.querySelector('.rate-stars')

    if (!starsElement) {
        return
    }

    const starSVG = `
        <svg viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 1l2.6 6.2 6.7.5-5.1 4.4 1.6 6.6L10 15.3 4.2 18.7l1.6-6.6L.7 7.7l6.7-.5z"/>
        </svg>
    `

    starsElement.innerHTML = [1, 2, 3, 4, 5]
        .map(
            value => `
                <span class="star-wrap"
                      data-value="${value}"
                      style="cursor:pointer;">
                    ${starSVG.replace(
                        '<svg ',
                        `<svg style="color:${value <= myRating
                            ? 'var(--forest)'
                            : 'var(--line)'};" `
                    )}
                </span>
            `
        )
        .join('')

    starsElement.querySelectorAll('.star-wrap').forEach(star => {
        const value = Number(star.dataset.value)

        star.addEventListener('mouseenter', () => {
            highlightStars(value)
        })

        star.addEventListener('mouseleave', () => {
            highlightStars(myRating)
        })

        star.addEventListener('click', () => {
            submitRating(value)
        })
    })

    updateMyRatingText()
}

function highlightStars(value) {
    document.querySelectorAll('.star-wrap').forEach(star => {
        const svg = star.querySelector('svg')
        svg.style.color =
            Number(star.dataset.value) <= value
                ? 'var(--forest)'
                : 'var(--line)'
    })
}

function updateMyRatingText() {
    const subtitle = document.querySelector('.rate-sub')

    if (!subtitle) {
        return
    }

    subtitle.textContent = myRating
        ? `You rated this ${myRating} star${myRating === 1 ? '' : 's'} · tap to update`
        : 'Choose a rating'
}

async function submitRating(value) {
    try {
        const response = await api('/user/notes/rate', {
            method: 'POST',
            body: JSON.stringify({
                noteId,
                rating: value
            })
        })

        if (response.status === 401) {
            logout()
            return
        }

        const data = await readJson(response)

        if (!response.ok) {
            toast(data.message || 'Could not submit rating.', 'error')
            return
        }

        myRating = value
        highlightStars(value)
        updateMyRatingText()

        document.querySelector('.avg-row .num').textContent =
            Number(data.noteAverageRating || 0).toFixed(1)

        document.querySelector('.avg-row .of5').textContent =
            `out of 5 · ${Number(data.ratingCount || 0)} ` +
            `rating${Number(data.ratingCount || 0) === 1 ? '' : 's'}`

        toast(data.message || 'Rating saved.', 'success')

        const freshNote = await fetchNote()

        if (freshNote) {
            currentNote = freshNote
            renderRatingSummary(freshNote)
        }
    } catch (error) {
        console.error(error)
        toast('Could not submit rating.', 'error')
    }
}

function renderRatingSummary(note) {
    const average = Number(note.rating || 0)
    const count = Number(note.ratingCount || 0)

    document.querySelector('.avg-row .num').textContent =
        average.toFixed(1)

    document.querySelector('.avg-row .of5').textContent =
        `out of 5 · ${count} rating${count === 1 ? '' : 's'}`

    const breakdown = note.ratingBreakdown || {}
    const rows = document.querySelectorAll('.rating-bars .rbar')
    const values = [5, 4, 3, 2, 1]

    rows.forEach((row, index) => {
        const value = values[index]
        const amount = Number(breakdown[value] || 0)
        const percentage = count
            ? Math.round((amount / count) * 100)
            : 0

        row.innerHTML = `
            ${value}
            <div class="track">
                <div class="fill" style="width:${percentage}%;"></div>
            </div>
            ${percentage}%
        `
    })
}

async function loadComments() {
    try {
        const response = await api('/user/comments/get', {
            method: 'POST',
            body: JSON.stringify({ noteId })
        })

        if (response.status === 401) {
            logout()
            return
        }

        const data = await readJson(response)

        if (!response.ok) {
            return
        }

        renderComments(data.comments || [])

        const count = Number(data.totalComments || 0)
        document.querySelector('.comments-head span').textContent =
            `${count} comment${count === 1 ? '' : 's'}`
    } catch (error) {
        console.error(error)
    }
}

function renderComments(comments) {
    const section = document.querySelector('.comments-section')

    section.querySelectorAll('.comment-item, .comments-empty').forEach(item => {
        item.remove()
    })

    if (!comments.length) {
        const empty = document.createElement('div')
        empty.className = 'comments-empty'
        empty.style.cssText =
            'padding:24px 0;color:var(--pencil);font-size:14px;text-align:center;'
        empty.textContent = 'No comments yet. Start the conversation.'
        section.appendChild(empty)
        return
    }

    comments.forEach(comment => {
        const author = comment.user?.username || 'Unknown'
        const item = document.createElement('div')
        item.className = 'comment-item'
        item.dataset.id = comment._id

        const avatar = document.createElement('div')
        avatar.className = 'comment-avatar'
        avatar.textContent = author.charAt(0).toUpperCase() || '?'

        const body = document.createElement('div')
        body.className = 'comment-body'

        const head = document.createElement('div')
        head.className = 'comment-head'

        const name = document.createElement('span')
        name.className = 'nm'
        name.textContent = author

        const date = document.createElement('span')
        date.className = 'tm'
        date.textContent = timeAgo(comment.createdAt)

        head.append(name, date)

        const text = document.createElement('div')
        text.className = 'comment-text'
        text.textContent = comment.message

        const actions = document.createElement('div')
        actions.className = 'comment-actions'

        if (comment.isOwner) {
            const deleteButton = document.createElement('span')
            deleteButton.textContent = 'Delete'
            deleteButton.style.cssText =
                'cursor:pointer;color:var(--rust);'

            deleteButton.addEventListener('click', () => {
                deleteComment(comment._id)
            })

            actions.appendChild(deleteButton)
        }

        body.append(head, text, actions)
        item.append(avatar, body)
        section.appendChild(item)
    })
}

async function deleteComment(commentId) {
    try {
        const response = await api('/user/comments/delete', {
            method: 'DELETE',
            body: JSON.stringify({ commentId })
        })

        const data = await readJson(response)

        if (!response.ok) {
            toast(data.message || 'Could not delete comment.', 'error')
            return
        }

        toast('Comment deleted.', 'success')
        await loadComments()
    } catch (error) {
        console.error(error)
        toast('Network error.', 'error')
    }
}

const commentInput = document.querySelector('.comment-input textarea')
const commentButton = document.querySelector('.comment-input button')

commentButton.addEventListener('click', async () => {
    const message = commentInput.value.trim()

    if (!message) {
        return
    }

    commentButton.disabled = true
    commentButton.textContent = 'Posting…'

    try {
        const response = await api('/user/comments/add', {
            method: 'POST',
            body: JSON.stringify({
                noteId,
                message
            })
        })

        if (response.status === 401) {
            logout()
            return
        }

        const data = await readJson(response)

        if (!response.ok) {
            toast(data.message || 'Could not post comment.', 'error')
            return
        }

        commentInput.value = ''
        toast('Comment posted.', 'success')
        await loadComments()
    } catch (error) {
        console.error(error)
        toast('Network error.', 'error')
    } finally {
        commentButton.disabled = false
        commentButton.textContent = 'Post'
    }
})