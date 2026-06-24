// ── 07-profile-access.js ──────────────────────────────────────────────────────
import { requireAuth, api, initNav, logout, toast, token } from './api.js'

requireAuth()
initNav('Profile')

// ── Tab switching ─────────────────────────────────────────────────────────────
const tabs      = document.querySelectorAll('.tab-item')
const accountPanel = document.querySelector('.panel-box:nth-of-type(1)')
const accessPanel  = document.querySelector('.panel-box:nth-of-type(2)')

tabs[0].addEventListener('click', () => {
    tabs[0].classList.add('active'); tabs[1].classList.remove('active')
    accountPanel.style.display = ''; accessPanel.style.display = 'none'
})
tabs[1].addEventListener('click', () => {
    tabs[1].classList.add('active'); tabs[0].classList.remove('active')
    accountPanel.style.display = 'none'; accessPanel.style.display = ''
    loadAccessPanel()
})

// Default: show account, hide access
accessPanel.style.display = 'none'

// If arriving from My Notes access button, jump to access tab
if (localStorage.getItem('manageNoteId')) {
    tabs[1].click()
}

// ── Load profile ──────────────────────────────────────────────────────────────
async function loadProfile() {
    try {
        const res = await api('/user/profile')
        if (res.status === 401) { logout(); return }
        if (!res.ok) throw new Error()

        const data = await res.json()  // [username, email, Rating, Notes]
        const [username, email, rating] = data

        // Header
        document.querySelector('.big-avatar').textContent = username[0].toUpperCase()
        document.querySelector('.profile-head h1').textContent  = username
        document.querySelector('.profile-head p').innerHTML =
            `${email} <span class="rating-chip">★ ${Number(rating).toFixed(1)} uploader rating</span>`

        // Form fields
        const inputs = accountPanel.querySelectorAll('input')
        inputs[0].value = username
        inputs[1].value = email

        // Top-bar avatar
        const av = document.querySelector('.avatar')
        if (av) av.textContent = username[0].toUpperCase()

    } catch (err) {
        toast('Failed to load profile.', 'error')
    }
}

// ── Save profile ──────────────────────────────────────────────────────────────
accountPanel.querySelector('.btn-primary').addEventListener('click', async () => {
    const inputs   = accountPanel.querySelectorAll('input')
    const username = inputs[0].value.trim()
    const email    = inputs[1].value.trim()

    if (!username || !email) { toast('Both fields are required.', 'error'); return }
    if (!email.includes('@')) { toast('Invalid email address.', 'error'); return }

    try {
        const res = await api('/user/profile/update', {
            method: 'POST',
            body: JSON.stringify({ username, email })
        })
        if (res.status === 401) { logout(); return }
        const body = await res.text()

        if (res.ok) {
            localStorage.setItem('username', username)
            document.querySelector('.big-avatar').textContent = username[0].toUpperCase()
            document.querySelector('.profile-head h1').textContent = username
            const av = document.querySelector('.avatar')
            if (av) av.textContent = username[0].toUpperCase()
            toast('Profile updated.', 'success')
        } else {
            toast(body || 'Update failed.', 'error')
        }
    } catch { toast('Network error.', 'error') }
})

// ── Access control panel ──────────────────────────────────────────────────────
let myNotes          = []
let selectedNoteId   = null

async function loadAccessPanel() {
    try {
        const res = await api('/user/notes/search?limit=50')
        if (!res.ok) return
        const data = await res.json()
        myNotes = data.notes || []
        populateNoteSelect()
    } catch { toast('Failed to load your notes.', 'error') }
}

function populateNoteSelect() {
    const select = accessPanel.querySelector('.note-select select')
    select.innerHTML = myNotes.length
        ? myNotes.map(n => `<option value="${n._id}">${n.noteUrl.split('/').pop().replace('.pdf','').replace(/-/g,' ')} (${n.visibility})</option>`).join('')
        : `<option value="">No notes found</option>`

    // Pre-select if coming from My Notes
    const preselect = localStorage.getItem('manageNoteId')
    if (preselect) {
        select.value = preselect
        localStorage.removeItem('manageNoteId')
    }

    if (select.value) {
        selectedNoteId = select.value
        syncVisibility()
        loadAccessList()
    }

    select.addEventListener('change', () => {
        selectedNoteId = select.value
        syncVisibility()
        loadAccessList()
    })
}

function syncVisibility() {
    const note = myNotes.find(n => n._id === selectedNoteId)
    if (!note) return
    const vis = note.visibility
    document.getElementById('vc-public').checked  = vis === 'public'
    document.getElementById('vc-private').checked = vis === 'private'
    document.getElementById('vc-shared').checked  = vis === 'shared'
}

// ── Visibility change ─────────────────────────────────────────────────────────
['vc-public','vc-private','vc-shared'].forEach(id => {
    document.getElementById(id).addEventListener('change', async () => {
        if (!selectedNoteId) return
        const vis = id === 'vc-public' ? 'public' : id === 'vc-private' ? 'private' : 'shared'
        try {
            const res = await api('/user/access/visibility', {
                method: 'POST',
                body: JSON.stringify({ noteId: selectedNoteId, visibility: vis })
            })
            if (res.ok) {
                const note = myNotes.find(n => n._id === selectedNoteId)
                if (note) note.visibility = vis
                // Update the select label
                populateNoteSelect()
                toast('Visibility updated.', 'success')
            } else toast('Could not update visibility.', 'error')
        } catch { toast('Network error.', 'error') }
    })
})

// ── Access list ───────────────────────────────────────────────────────────────
async function loadAccessList() {
    const listContainer = accessPanel.querySelector('.access-list-head').parentElement
    // Remove existing grant rows
    listContainer.querySelectorAll('.access-grant').forEach(el => el.remove())

    const note = myNotes.find(n => n._id === selectedNoteId)
    if (!note || !note.access?.length) {
        const empty = document.createElement('div')
        empty.className = 'empty-hint'
        empty.textContent = 'No one has been granted access yet.'
        listContainer.appendChild(empty)
        listContainer.querySelector('.access-list-head span').textContent = '0 people'
        return
    }

    listContainer.querySelector('.access-list-head span').textContent = `${note.access.length} ${note.access.length === 1 ? 'person' : 'people'}`
    listContainer.querySelector('.empty-hint')?.remove()

    note.access.forEach(userId => {
        const row = document.createElement('div')
        row.className = 'access-grant'
        row.innerHTML = `
            <div class="mini-avatar">?</div>
            <div class="grant-info">
                <div class="nm">${userId}</div>
                <div class="em">—</div>
            </div>
            <span class="remove-link" style="cursor:pointer;">Remove</span>
        `
        row.querySelector('.remove-link').addEventListener('click', async () => {
            // We need email to remove; prompt for it
            const email = prompt('Enter the email of the person to remove:')
            if (!email) return
            await removeAccess(email)
        })
        listContainer.appendChild(row)
    })
}

// ── Grant access ──────────────────────────────────────────────────────────────
accessPanel.querySelector('.add-access-row button').addEventListener('click', async () => {
    if (!selectedNoteId) { toast('Select a note first.', 'error'); return }
    const emailInput = accessPanel.querySelector('.add-access-row input')
    const email      = emailInput.value.trim()
    if (!email || !email.includes('@')) { toast('Enter a valid email.', 'error'); return }

    try {
        const res = await api('/user/access/add', {
            method: 'POST',
            body: JSON.stringify({ noteId: selectedNoteId, email })
        })
        const body = await res.text()
        if (res.ok) {
            emailInput.value = ''
            toast(body || 'Access granted.', 'success')
            await loadAccessPanel()
        } else {
            toast(body || 'Could not grant access.', 'error')
        }
    } catch { toast('Network error.', 'error') }
})

async function removeAccess(email) {
    try {
        const res = await api('/user/access/remove', {
            method: 'POST',
            body: JSON.stringify({ noteId: selectedNoteId, email })
        })
        const body = await res.text()
        if (res.ok) {
            toast(body || 'Access removed.', 'success')
            await loadAccessPanel()
        } else {
            toast(body || 'Could not remove access.', 'error')
        }
    } catch { toast('Network error.', 'error') }
}

// ── Logout ────────────────────────────────────────────────────────────────────
// Add logout button to avatar click
const avatarEl = document.querySelector('.avatar')
if (avatarEl) {
    avatarEl.style.cursor = 'pointer'
    avatarEl.title        = 'Click to log out'
    avatarEl.addEventListener('click', () => {
        if (confirm('Log out?')) {
            localStorage.clear()
            window.location.href = '/01-auth.html'
        }
    })
}

loadProfile()
