// ── 04-upload.js ──────────────────────────────────────────────────────────────
import { requireAuth, token, initNav, toast } from './api.js'

requireAuth()
initNav(null)

// ── State ─────────────────────────────────────────────────────────────────────
let selectedFile = null
const dropzone   = document.querySelector('.dropzone')
const filePreview = document.querySelector('.file-selected')
const progressFill = document.querySelector('.progress-fill')
const fileNameEl   = filePreview.querySelector('.name')
const fileSizeEl   = filePreview.querySelector('.size')

// Hide preview on load
filePreview.style.display = 'none'

// ── Hidden file input ─────────────────────────────────────────────────────────
const fileInput = document.createElement('input')
fileInput.type    = 'file'
fileInput.accept  = 'application/pdf'
fileInput.style.display = 'none'
document.body.appendChild(fileInput)

// ── Click dropzone or browse button ──────────────────────────────────────────
dropzone.addEventListener('click', () => fileInput.click())
document.querySelector('.browse-btn').addEventListener('click', e => {
    e.stopPropagation()
    fileInput.click()
})

fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) setFile(fileInput.files[0])
})

// ── Drag and drop ─────────────────────────────────────────────────────────────
dropzone.addEventListener('dragover', e => {
    e.preventDefault()
    dropzone.style.borderColor = 'var(--sienna)'
    dropzone.style.background  = 'rgba(139,94,60,.05)'
})
dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = ''
    dropzone.style.background  = ''
})
dropzone.addEventListener('drop', e => {
    e.preventDefault()
    dropzone.style.borderColor = ''
    dropzone.style.background  = ''
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'application/pdf') {
        setFile(file)
    } else {
        toast('Only PDF files are accepted.', 'error')
    }
})

function setFile(file) {
    if (file.size > 20 * 1024 * 1024) {
        toast('File exceeds 20 MB limit.', 'error')
        return
    }
    selectedFile = file
    fileNameEl.textContent = file.name
    fileSizeEl.textContent = `${(file.size / (1024*1024)).toFixed(2)} MB · ready to upload`
    progressFill.style.width = '0%'
    filePreview.style.display = 'flex'
    dropzone.style.display = 'none'
}

// Remove file
document.querySelector('.remove-x').addEventListener('click', () => {
    selectedFile = null
    fileInput.value = ''
    filePreview.style.display = 'none'
    dropzone.style.display  = 'block'
})

// ── Visibility ────────────────────────────────────────────────────────────────
function getVisibility() {
    if (document.getElementById('v-public').checked)  return 'public'
    if (document.getElementById('v-shared').checked)  return 'shared'
    return 'private'
}

// ── Upload ────────────────────────────────────────────────────────────────────
const uploadBtn  = document.querySelector('.btn-primary')
const cancelBtn  = document.querySelector('.btn-ghost')

cancelBtn.addEventListener('click', () => { window.location.href = '/03-my-notes.html' })

uploadBtn.addEventListener('click', async () => {
    if (!selectedFile) { toast('Please select a PDF first.', 'error'); return }

    uploadBtn.disabled   = true
    uploadBtn.textContent = 'Uploading…'

    const formData = new FormData()
    formData.append('note', selectedFile)

    // XHR for progress bar
    await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', '/user/upload')
        xhr.setRequestHeader('Authorization', `Bearer ${token()}`)

        xhr.upload.addEventListener('progress', e => {
            if (e.lengthComputable) {
                const pct = Math.round((e.loaded / e.total) * 100)
                progressFill.style.width = pct + '%'
                fileSizeEl.textContent = `${(selectedFile.size / (1024*1024)).toFixed(2)} MB · ${pct}%`
            }
        })

        xhr.addEventListener('load', async () => {
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText)

                // Set visibility right after upload
                const vis = getVisibility()
                if (vis !== 'private') {
                    try {
                        const noteId = data.public_id // we get public_id back but need DB id
                        // Re-fetch notes to find the new one
                        const listRes = await fetch('/user/notes/getnotesall', {
                            headers: { Authorization: `Bearer ${token()}` }
                        })
                        // Visibility update needs noteId; search to find latest
                        const searchRes = await fetch('/user/notes/search?limit=1', {
                            headers: { Authorization: `Bearer ${token()}` }
                        })
                        if (searchRes.ok) {
                            const searchData = await searchRes.json()
                            const latestNote = searchData.notes?.[0]
                            if (latestNote) {
                                await fetch('/user/access/visibility', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        Authorization: `Bearer ${token()}`
                                    },
                                    body: JSON.stringify({ noteId: latestNote._id, visibility: vis })
                                })
                            }
                        }
                    } catch(e) { /* non-fatal */ }
                }

                toast('Upload successful!', 'success')
                setTimeout(() => { window.location.href = '/03-my-notes.html' }, 1200)
                resolve()
            } else {
                toast(`Upload failed: ${xhr.responseText}`, 'error')
                reject()
            }
        })

        xhr.addEventListener('error', () => {
            toast('Network error during upload.', 'error')
            reject()
        })

        xhr.send(formData)
    }).catch(() => {})

    uploadBtn.disabled    = false
    uploadBtn.textContent = 'Upload note'
})
