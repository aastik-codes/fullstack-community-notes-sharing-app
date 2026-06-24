import {
    requireAuth,
    api,
    initNav,
    logout,
    toast,
    escapeHTML,
    noteName,
    readJson
} from './api.js'

let myNotes = []
let selectedNoteId = null

const tabs = document.querySelectorAll('.tab-item')
const accountPanel = document.getElementById('account-panel')
const accessPanel = document.getElementById('access-panel')
const noteSelect = accessPanel.querySelector('.note-select select')

if (requireAuth()) {
    initNav('Profile')
    loadProfile()
}

tabs[0].addEventListener('click', () => {
    tabs[0].classList.add('active')
    tabs[1].classList.remove('active')
    accountPanel.style.display = ''
    accessPanel.style.display = 'none'
})

tabs[1].addEventListener('click', () => {
    tabs[1].classList.add('active')
    tabs[0].classList.remove('active')
    accountPanel.style.display = 'none'
    accessPanel.style.display = ''
    loadAccessPanel()
})

accessPanel.style.display = 'none'

if (localStorage.getItem('manageNoteId')) {
    tabs[1].click()
}

async function loadProfile() {
    try {
        const response = await api('/user/profile')

        if (response.status === 401) {
            logout()
            return
        }

        const data = await readJson(response)

        if (!response.ok) {
            throw new Error(data.message || 'Could not load profile')
        }

        localStorage.setItem('username', data.username)
        localStorage.setItem('userId', data.id)

        document.querySelector('.big-avatar').textContent =
            data.username.charAt(0).toUpperCase()

        document.querySelector('.profile-head h1').textContent =
            data.username

        document.querySelector('.profile-head p').innerHTML = `
            ${escapeHTML(data.email)}
            <span class="rating-chip">
                ★ ${Number(data.rating || 0).toFixed(1)} uploader rating
            </span>
        `

        const inputs = accountPanel.querySelectorAll('input')
        inputs[0].value = data.username
        inputs[1].value = data.email

        const avatar = document.querySelector('.avatar')
        if (avatar) {
            avatar.textContent =
                data.username.charAt(0).toUpperCase()
        }
    } catch (error) {
        console.error(error)
        toast('Failed to load profile.', 'error')
    }
}

accountPanel
    .querySelector('.btn-primary')
    .addEventListener('click', async () => {
        const inputs = accountPanel.querySelectorAll('input')
        const username = inputs[0].value.trim()
        const email = inputs[1].value.trim()

        if (!username || !email) {
            toast('Both fields are required.', 'error')
            return
        }

        if (!email.includes('@')) {
            toast('Invalid email address.', 'error')
            return
        }

        try {
            const response = await api('/user/profile/update', {
                method: 'POST',
                body: JSON.stringify({ username, email })
            })

            if (response.status === 401) {
                logout()
                return
            }

            const data = await readJson(response)

            if (!response.ok) {
                toast(data.message || 'Update failed.', 'error')
                return
            }

            localStorage.setItem('username', data.user.username)

            document.querySelector('.big-avatar').textContent =
                data.user.username.charAt(0).toUpperCase()

            document.querySelector('.profile-head h1').textContent =
                data.user.username

            document.querySelector('.profile-head p').innerHTML = `
                ${escapeHTML(data.user.email)}
                <span class="rating-chip">
                    ★ ${Number(data.user.rating || 0).toFixed(1)}
                    uploader rating
                </span>
            `

            const avatar = document.querySelector('.avatar')
            if (avatar) {
                avatar.textContent =
                    data.user.username.charAt(0).toUpperCase()
            }

            toast('Profile updated.', 'success')
        } catch (error) {
            console.error(error)
            toast('Network error.', 'error')
        }
    })

async function loadAccessPanel() {
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

        myNotes = data.notes || []
        populateNoteSelect()
    } catch (error) {
        console.error(error)
        toast('Failed to load your notes.', 'error')
    }
}

function populateNoteSelect() {
    if (!myNotes.length) {
        noteSelect.innerHTML = '<option value="">No notes found</option>'
        selectedNoteId = null
        setVisibilityDisabled(true)
        renderAccessList()
        return
    }

    noteSelect.innerHTML = myNotes
        .map(
            note => `
                <option value="${escapeHTML(note._id)}">
                    ${escapeHTML(noteName(note))}
                    (${escapeHTML(note.visibility)})
                </option>
            `
        )
        .join('')

    const preselectedId = localStorage.getItem('manageNoteId')

    if (
        preselectedId &&
        myNotes.some(note => note._id === preselectedId)
    ) {
        noteSelect.value = preselectedId
    }

    localStorage.removeItem('manageNoteId')

    selectedNoteId = noteSelect.value
    setVisibilityDisabled(false)
    syncVisibility()
    renderAccessList()
}

noteSelect.addEventListener('change', () => {
    selectedNoteId = noteSelect.value
    syncVisibility()
    renderAccessList()
})

function selectedNote() {
    return myNotes.find(note => note._id === selectedNoteId)
}

function setVisibilityDisabled(disabled) {
    ;['vc-public', 'vc-private', 'vc-shared'].forEach(id => {
        document.getElementById(id).disabled = disabled
    })
}

function syncVisibility() {
    const note = selectedNote()

    if (!note) {
        return
    }

    document.getElementById('vc-public').checked =
        note.visibility === 'public'
    document.getElementById('vc-private').checked =
        note.visibility === 'private'
    document.getElementById('vc-shared').checked =
        note.visibility === 'shared'
}

;['vc-public', 'vc-private', 'vc-shared'].forEach(id => {
    document.getElementById(id).addEventListener('change', async () => {
        if (!selectedNoteId) {
            return
        }

        const visibility =
            id === 'vc-public'
                ? 'public'
                : id === 'vc-private'
                    ? 'private'
                    : 'shared'

        try {
            const response = await api('/user/access/visibility', {
                method: 'POST',
                body: JSON.stringify({
                    noteId: selectedNoteId,
                    visibility
                })
            })

            const data = await readJson(response)

            if (!response.ok) {
                toast(
                    data.message || 'Could not update visibility.',
                    'error'
                )
                syncVisibility()
                return
            }

            const note = selectedNote()
            note.visibility = data.visibility
            populateNoteSelect()
            noteSelect.value = selectedNoteId
            toast('Visibility updated.', 'success')
        } catch (error) {
            console.error(error)
            toast('Network error.', 'error')
            syncVisibility()
        }
    })
})

function renderAccessList() {
    const listContainer =
        accessPanel.querySelector('.access-list-head').parentElement

    listContainer
        .querySelectorAll('.access-grant, .empty-hint')
        .forEach(element => element.remove())

    const note = selectedNote()
    const accessList = note?.access || []
    const countElement =
        listContainer.querySelector('.access-list-head span')

    countElement.textContent =
        `${accessList.length} ` +
        `${accessList.length === 1 ? 'person' : 'people'}`

    if (!accessList.length) {
        const empty = document.createElement('div')
        empty.className = 'empty-hint'
        empty.style.cssText =
            'padding:22px 0;color:var(--pencil);font-size:13px;text-align:center;'
        empty.textContent =
            note
                ? 'No one has been granted access yet.'
                : 'Select a note to manage access.'
        listContainer.appendChild(empty)
        return
    }

    accessList.forEach(person => {
        const username =
            typeof person === 'object'
                ? person.username || 'Unknown'
                : 'Unknown user'

        const email =
            typeof person === 'object'
                ? person.email || ''
                : ''

        const row = document.createElement('div')
        row.className = 'access-grant'

        row.innerHTML = `
            <div class="mini-avatar">
                ${escapeHTML(username.charAt(0).toUpperCase() || '?')}
            </div>

            <div class="grant-info">
                <div class="nm">${escapeHTML(username)}</div>
                <div class="em">${escapeHTML(email || 'Email unavailable')}</div>
            </div>

            <span class="remove-link" style="cursor:pointer;">
                Remove
            </span>
        `

        row.querySelector('.remove-link').addEventListener(
            'click',
            () => removeAccess(email)
        )

        listContainer.appendChild(row)
    })
}

accessPanel
    .querySelector('.add-access-row button')
    .addEventListener('click', async () => {
        if (!selectedNoteId) {
            toast('Select a note first.', 'error')
            return
        }

        const emailInput =
            accessPanel.querySelector('.add-access-row input')
        const email = emailInput.value.trim()

        if (!email || !email.includes('@')) {
            toast('Enter a valid email.', 'error')
            return
        }

        try {
            const response = await api('/user/access/add', {
                method: 'POST',
                body: JSON.stringify({
                    noteId: selectedNoteId,
                    email
                })
            })

            const data = await readJson(response)

            if (!response.ok) {
                toast(data.message || 'Could not grant access.', 'error')
                return
            }

            emailInput.value = ''

            const note = selectedNote()
            note.access = data.access || []

            renderAccessList()
            toast(data.message || 'Access granted.', 'success')
        } catch (error) {
            console.error(error)
            toast('Network error.', 'error')
        }
    })

async function removeAccess(email) {
    if (!email) {
        toast(
            'This old access record has no email. Remove it from MongoDB once.',
            'error'
        )
        return
    }

    try {
        const response = await api('/user/access/remove', {
            method: 'POST',
            body: JSON.stringify({
                noteId: selectedNoteId,
                email
            })
        })

        const data = await readJson(response)

        if (!response.ok) {
            toast(data.message || 'Could not remove access.', 'error')
            return
        }

        const note = selectedNote()
        note.access = data.access || []

        renderAccessList()
        toast(data.message || 'Access removed.', 'success')
    } catch (error) {
        console.error(error)
        toast('Network error.', 'error')
    }
}