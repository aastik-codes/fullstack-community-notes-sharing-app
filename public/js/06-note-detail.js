// ── 06-note-detail.js ─────────────────────────────────────────────────────────
import { requireAuth, api, initNav, logout, toast, token } from './api.js'

requireAuth()
initNav('Browse')

const noteId = localStorage.getItem('viewNoteId')
if (!noteId) { window.location.href = '/05-browse.html' }

// ── Breadcrumb ────────────────────────────────────────────────────────────────
document.querySelector('.crumb a').href = '/05-browse.html'

// ── Load note ─────────────────────────────────────────────────────────────────
async function loadNote() {
    try {
        const res = await api(`/user/notes/getnotesone?noteId=${noteId}`)
        if (res.status === 401) { logout(); return }
        if (res.status === 403) { toast('You do not have access to this note.', 'error'); return }
        if (!res.ok) throw new Error()

        const note = await res.json()
        renderNote(note)
        loadComments()
        loadRating()

    } catch (err) {
        toast('Failed to load note.', 'error')
    }
}

function renderNote(note) {
    const filename = note.noteUrl.split('/').pop().replace('.pdf','').replace(/-/g,' ')

    // Title + uploader
    document.querySelector('.viewer-head h1').textContent = filename
    const byEl   = document.querySelector('.viewer-head .by')
    const uploader = note.user?.username || 'Unknown'
    const email    = note.user?.email    || ''
    if (byEl) byEl.innerHTML = `<span class="mini-avatar">${uploader[0]?.toUpperCase()}</span> ${uploader} · ${email}`

    const pill = document.querySelector('.viewer-head .status-pill')
    if (pill) { pill.textContent = note.visibility; pill.className = `status-pill ${note.visibility}` }

    // Embed the real PDF
    const pdfPage = document.querySelector('.pdf-page')
    if (pdfPage && note.noteUrl) {
        const frame = document.createElement('iframe')
        frame.src    = note.noteUrl
        frame.style.cssText = 'width:100%;height:620px;border:none;'
        frame.title  = filename
        pdfPage.innerHTML = ''
        pdfPage.appendChild(frame)
    }

    // Download button
    const dlBtn = document.querySelector('.download-btn')
    if (dlBtn) {
        dlBtn.addEventListener('click', () => { window.open(note.noteUrl, '_blank') })
    }

    // Uploader info card
    const nmEl = document.querySelector('.side-card .nm')
    const emEl = document.querySelector('.side-card .em')
    if (nmEl) nmEl.textContent = uploader
    if (emEl) emEl.textContent = email

    // Average rating card
    if (note.rating !== undefined) {
        const avgEl = document.querySelector('.avg-row .num')
        if (avgEl) avgEl.textContent = note.rating.toFixed(1)
    }
}

// ── Rating ─────────────────────────────────────────────────────────────────────
let myRating = 0

async function loadRating() {
    // No endpoint to get current user's rating for a note, so we try submitting 0 to detect
    // We just initialise stars as unset and let hover/click set them
    setupRatingStars()
}

function setupRatingStars() {
    const starsEl = document.querySelector('.rate-stars')
    if (!starsEl) return

    const starSvg = () => `<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 1l2.6 6.2 6.7.5-5.1 4.4 1.6 6.6L10 15.3 4.2 18.7l1.6-6.6L.7 7.7l6.7-.5z"/></svg>`

    starsEl.innerHTML = [1,2,3,4,5].map(i =>
        `<span class="star-wrap" data-val="${i}" style="cursor:pointer;color:${i <= myRating ? 'var(--forest)' : 'var(--line)'};font-size:24px;">${starSvg()}</span>`
    ).join('')

    const wraps = starsEl.querySelectorAll('.star-wrap')

    wraps.forEach(w => {
        w.addEventListener('mouseenter', () => highlight(Number(w.dataset.val)))
        w.addEventListener('mouseleave', () => highlight(myRating))
        w.addEventListener('click',      () => submitRating(Number(w.dataset.val)))
    })
}

function highlight(val) {
    document.querySelectorAll('.star-wrap').forEach(w => {
        w.style.color = Number(w.dataset.val) <= val ? 'var(--forest)' : 'var(--line)'
    })
}

async function submitRating(val) {
    try {
        const res = await api('/user/notes/rate', {
            method: 'POST',
            body: JSON.stringify({ noteId, rating: val })
        })
        if (res.status === 401) { logout(); return }
        const data = await res.json()
        myRating = val
        highlight(val)

        const rateSub = document.querySelector('.rate-sub')
        if (rateSub) rateSub.textContent = `You rated this ${val} star${val > 1 ? 's' : ''} · tap to update`

        // Update average
        const avgEl = document.querySelector('.avg-row .num')
        if (avgEl && data.noteAverageRating !== undefined) {
            avgEl.textContent = Number(data.noteAverageRating).toFixed(1)
        }
        toast(data.message || 'Rating saved.', 'success')
    } catch (err) {
        toast('Could not submit rating.', 'error')
    }
}

// ── Comments ──────────────────────────────────────────────────────────────────
async function loadComments() {
    try {
        const res = await api('/user/comments/get', {
            method: 'POST',
            body: JSON.stringify({ noteId })
        })
        if (!res.ok) return
        const data = await res.json()
        renderComments(data.comments || [])

        const headSpan = document.querySelector('.comments-head span')
        if (headSpan) headSpan.textContent = `${data.totalComments} comment${data.totalComments !== 1 ? 's' : ''}`
    } catch (err) { /* non-fatal */ }
}

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const hours = Math.floor(diff / 3600000)
    const days  = Math.floor(diff / 86400000)
    if (hours < 1)  return 'just now'
    if (hours < 24) return `${hours}h ago`
    if (days === 1) return '1 day ago'
    if (days < 7)  return `${days} days ago`
    return `${Math.floor(days/7)} weeks ago`
}

function renderComments(comments) {
    // Remove existing static comment items
    document.querySelectorAll('.comment-item').forEach(el => el.remove())

    const section = document.querySelector('.comments-section')
    const inputDiv = section.querySelector('.comment-input')
    const myUsername = localStorage.getItem('username') || ''

    comments.forEach(c => {
        const author  = c.user?.username || 'Unknown'
        const isOwner = author === myUsername

        const item = document.createElement('div')
        item.className = 'comment-item'
        item.dataset.id = c._id
        item.innerHTML = `
            <div class="comment-avatar">${author[0]?.toUpperCase()}</div>
            <div class="comment-body">
                <div class="comment-head">
                    <span class="nm">${author}</span>
                    <span class="tm">${timeAgo(c.createdAt)}</span>
                </div>
                <div class="comment-text">${c.message}</div>
                <div class="comment-actions">
                    ${isOwner ? '<span class="delete-comment" style="cursor:pointer;color:var(--rust);">Delete</span>' : ''}
                </div>
            </div>
        `
        section.appendChild(item)

        // Delete comment
        item.querySelector('.delete-comment')?.addEventListener('click', async () => {
            try {
                const res = await api('/user/comments/delete', {
                    method: 'DELETE',
                    body: JSON.stringify({ commentId: c._id })
                })
                if (res.ok) { item.remove(); loadComments() }
                else toast('Could not delete comment.', 'error')
            } catch { toast('Network error.', 'error') }
        })
    })
}

// ── Post comment ──────────────────────────────────────────────────────────────
const commentInput = document.querySelector('.comment-input textarea')
const commentBtn   = document.querySelector('.comment-input button')

commentBtn.addEventListener('click', async () => {
    const message = commentInput.value.trim()
    if (!message) return

    commentBtn.disabled   = true
    commentBtn.textContent = 'Posting…'

    try {
        const res = await api('/user/comments/add', {
            method: 'POST',
            body: JSON.stringify({ noteId, message })
        })
        if (res.status === 401) { logout(); return }
        if (res.ok) {
            commentInput.value = ''
            loadComments()
            toast('Comment posted.', 'success')
        } else {
            toast('Could not post comment.', 'error')
        }
    } catch { toast('Network error.', 'error') }
    finally {
        commentBtn.disabled   = false
        commentBtn.textContent = 'Post'
    }
})

loadNote()
