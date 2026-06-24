import {
    requireAuth,
    token,
    initNav,
    toast,
    readJson
} from './api.js'

if (requireAuth()) {
    initNav(null)
}

let selectedFile = null

const dropzone = document.querySelector('.dropzone')
const filePreview = document.querySelector('.file-selected')
const progressFill = document.querySelector('.progress-fill')
const fileNameElement = filePreview.querySelector('.name')
const fileSizeElement = filePreview.querySelector('.size')
const titleInput = document.querySelector('.field-block input[type="text"]')
const uploadButton = document.querySelector('.btn-primary')
const cancelButton = document.querySelector('.btn-ghost')

filePreview.style.display = 'none'

const fileInput = document.createElement('input')
fileInput.type = 'file'
fileInput.accept = 'application/pdf,.pdf'
fileInput.style.display = 'none'
document.body.appendChild(fileInput)

dropzone.addEventListener('click', () => fileInput.click())

document.querySelector('.browse-btn').addEventListener('click', event => {
    event.stopPropagation()
    fileInput.click()
})

fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) {
        setFile(fileInput.files[0])
    }
})

dropzone.addEventListener('dragover', event => {
    event.preventDefault()
    dropzone.style.borderColor = 'var(--sienna)'
    dropzone.style.background = 'rgba(139,94,60,.05)'
})

dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = ''
    dropzone.style.background = ''
})

dropzone.addEventListener('drop', event => {
    event.preventDefault()
    dropzone.style.borderColor = ''
    dropzone.style.background = ''

    const file = event.dataTransfer.files[0]

    if (!file) {
        return
    }

    setFile(file)
})

function setFile(file) {
    const isPDF =
        file.type === 'application/pdf' ||
        file.name.toLowerCase().endsWith('.pdf')

    if (!isPDF) {
        toast('Only PDF files are accepted.', 'error')
        return
    }

    if (file.size > 20 * 1024 * 1024) {
        toast('File exceeds the 20 MB limit.', 'error')
        return
    }

    selectedFile = file
    fileNameElement.textContent = file.name
    fileSizeElement.textContent =
        `${(file.size / (1024 * 1024)).toFixed(2)} MB · ready to upload`
    progressFill.style.width = '0%'
    filePreview.style.display = 'flex'
    dropzone.style.display = 'none'
}

document.querySelector('.remove-x').addEventListener('click', () => {
    selectedFile = null
    fileInput.value = ''
    filePreview.style.display = 'none'
    dropzone.style.display = 'block'
    progressFill.style.width = '0%'
})

function getVisibility() {
    if (document.getElementById('v-public').checked) {
        return 'public'
    }

    if (document.getElementById('v-shared').checked) {
        return 'shared'
    }

    return 'private'
}

cancelButton.addEventListener('click', () => {
    window.location.href = '/03-my-notes.html'
})

uploadButton.addEventListener('click', async () => {
    if (!selectedFile) {
        toast('Please select a PDF first.', 'error')
        return
    }

    uploadButton.disabled = true
    uploadButton.textContent = 'Uploading…'

    const formData = new FormData()
    formData.append('note', selectedFile)
    formData.append('title', titleInput.value.trim())
    formData.append('visibility', getVisibility())
    formData.append('fileSize', String(selectedFile.size))

    try {
        const result = await uploadWithProgress(formData)

        toast(result.message || 'Upload successful!', 'success')

        setTimeout(() => {
            window.location.href = '/03-my-notes.html'
        }, 700)
    } catch (error) {
        console.error(error)
        toast(error.message || 'Upload failed.', 'error')
        uploadButton.disabled = false
        uploadButton.textContent = 'Upload note'
    }
})

function uploadWithProgress(formData) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.open('POST', '/user/upload')
        xhr.setRequestHeader('Authorization', `Bearer ${token()}`)

        xhr.upload.addEventListener('progress', event => {
            if (!event.lengthComputable) {
                return
            }

            const percentage = Math.round(
                (event.loaded / event.total) * 100
            )

            progressFill.style.width = `${percentage}%`
            fileSizeElement.textContent =
                `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · ` +
                `${percentage}%`
        })

        xhr.addEventListener('load', async () => {
            let data = {}

            try {
                data = JSON.parse(xhr.responseText || '{}')
            } catch {
                data = { message: xhr.responseText }
            }

            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(data)
                return
            }

            if (xhr.status === 401) {
                localStorage.clear()
                window.location.replace('/01-auth.html')
                reject(new Error('Your session expired.'))
                return
            }

            reject(new Error(data.message || data.error || 'Upload failed.'))
        })

        xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload.'))
        })

        xhr.send(formData)
    })
}