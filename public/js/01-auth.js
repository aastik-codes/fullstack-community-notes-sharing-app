if (localStorage.getItem('token')) {
    window.location.replace('/02-dashboard.html')
}

function showMessage(container, message, type = 'error') {
    let element = container.querySelector('.form-error')

    if (!element) {
        element = document.createElement('p')
        element.className = 'form-error'
        element.style.cssText =
            'font-size:13px;margin:0 0 14px;font-weight:500;'
        container.prepend(element)
    }

    element.style.color = type === 'success' ? '#3D5A4C' : '#A33B2E'
    element.textContent = message
}

function clearMessage(container) {
    container.querySelector('.form-error')?.remove()
}

function setLoading(button, loading) {
    button.disabled = loading
    button.style.opacity = loading ? '0.65' : '1'
    button.dataset.originalText =
        button.dataset.originalText || button.textContent
    button.textContent = loading
        ? 'Please wait…'
        : button.dataset.originalText
}

async function readBody(response) {
    const text = await response.text()

    if (!text) {
        return {}
    }

    try {
        return JSON.parse(text)
    } catch {
        return { message: text }
    }
}

function saveSession(data) {
    localStorage.setItem('token', data.token)
    localStorage.setItem('username', data.user.username)
    localStorage.setItem('userId', data.user.id)
}

const modeLogin = document.getElementById('mode-login')
const modeSignup = document.getElementById('mode-signup')
const modeForgot = document.getElementById('mode-forgot')
const tabLogin = document.getElementById('t-login')
const tabSignup = document.getElementById('t-signup')

function refreshTabs() {
    tabLogin.classList.toggle('active', modeLogin.checked)
    tabSignup.classList.toggle('active', modeSignup.checked)
}

modeLogin.addEventListener('change', refreshTabs)
modeSignup.addEventListener('change', refreshTabs)
modeForgot.addEventListener('change', refreshTabs)
refreshTabs()

// LOGIN
const loginPanel = document.querySelector('.panel-form.login')
const loginButton = loginPanel.querySelector('.btn-primary')

loginButton.addEventListener('click', async () => {
    clearMessage(loginPanel)

    const inputs = loginPanel.querySelectorAll('input')
    const email = inputs[0].value.trim()
    const password = inputs[1].value

    if (!email || !password) {
        showMessage(loginPanel, 'Email and password are required.')
        return
    }

    setLoading(loginButton, true)

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        })

        const data = await readBody(response)

        if (!response.ok) {
            showMessage(loginPanel, data.message || 'Login failed.')
            return
        }

        saveSession(data)
        window.location.replace('/02-dashboard.html')
    } catch (error) {
        console.error(error)
        showMessage(loginPanel, 'Network error. Try again.')
    } finally {
        setLoading(loginButton, false)
    }
})

// SIGN UP
const signupPanel = document.querySelector('.panel-form.signup')
const signupButton = signupPanel.querySelector('.btn-primary')

signupButton.addEventListener('click', async () => {
    clearMessage(signupPanel)

    const inputs = signupPanel.querySelectorAll('input')
    const username = inputs[0].value.trim()
    const email = inputs[1].value.trim()
    const password = inputs[2].value

    if (!username || !email || !password) {
        showMessage(signupPanel, 'All fields are required.')
        return
    }

    if (!email.includes('@')) {
        showMessage(signupPanel, 'Enter a valid email.')
        return
    }

    if (password.length < 6) {
        showMessage(
            signupPanel,
            'Password must be at least 6 characters.'
        )
        return
    }

    setLoading(signupButton, true)

    try {
        const signupResponse = await fetch('/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        })

        const signupData = await readBody(signupResponse)

        if (!signupResponse.ok) {
            showMessage(
                signupPanel,
                signupData.message || 'Sign up failed.'
            )
            return
        }

        const loginResponse = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        })

        const loginData = await readBody(loginResponse)

        if (!loginResponse.ok) {
            showMessage(
                signupPanel,
                loginData.message ||
                    'Account created. Please sign in.'
            )
            modeLogin.checked = true
            refreshTabs()
            return
        }

        saveSession(loginData)
        window.location.replace('/02-dashboard.html')
    } catch (error) {
        console.error(error)
        showMessage(signupPanel, 'Network error. Try again.')
    } finally {
        setLoading(signupButton, false)
    }
})

// FORGOT PASSWORD
const forgotPanel = document.querySelector('.panel-form.forgot')
const forgotButtons = forgotPanel.querySelectorAll('.btn-primary')
const sendButton = forgotButtons[0]
const updateButton = forgotButtons[1]

sendButton.addEventListener('click', async () => {
    clearMessage(forgotPanel)

    const email = forgotPanel
        .querySelectorAll('input')[0]
        .value.trim()

    if (!email) {
        showMessage(forgotPanel, 'Enter your email address.')
        return
    }

    setLoading(sendButton, true)

    try {
        const response = await fetch('/resetpass', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        })

        const data = await readBody(response)

        showMessage(
            forgotPanel,
            data.message || 'Could not send reset email.',
            response.ok ? 'success' : 'error'
        )
    } catch (error) {
        console.error(error)
        showMessage(forgotPanel, 'Network error.')
    } finally {
        setLoading(sendButton, false)
    }
})

updateButton.addEventListener('click', async () => {
    clearMessage(forgotPanel)

    const inputs = forgotPanel.querySelectorAll('input')
    const resetToken = inputs[1].value.trim()
    const newpass = inputs[2].value

    if (!resetToken || !newpass) {
        showMessage(
            forgotPanel,
            'Paste the token and enter a new password.'
        )
        return
    }

    if (newpass.length < 6) {
        showMessage(
            forgotPanel,
            'Password must be at least 6 characters.'
        )
        return
    }

    setLoading(updateButton, true)

    try {
        const response = await fetch('/updatepass', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: resetToken,
                newpass
            })
        })

        const data = await readBody(response)

        showMessage(
            forgotPanel,
            data.message || 'Password update failed.',
            response.ok ? 'success' : 'error'
        )

        if (response.ok) {
            setTimeout(() => {
                modeLogin.checked = true
                refreshTabs()
            }, 1200)
        }
    } catch (error) {
        console.error(error)
        showMessage(forgotPanel, 'Network error.')
    } finally {
        setLoading(updateButton, false)
    }
})

// Real server status
const serverStatus = document.getElementById('server-status')

if (serverStatus) {
    fetch('/health')
        .then(response => {
            if (!response.ok) {
                throw new Error('Health check failed')
            }

            serverStatus.innerHTML =
                '<span class="dot"></span> server status: healthy'
        })
        .catch(() => {
            serverStatus.textContent = 'server status: unavailable'
            serverStatus.style.color = '#A33B2E'
        })
}