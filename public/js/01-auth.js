// ── 01-auth.js ────────────────────────────────────────────────────────────────
// Handles: Login · Sign up · Forgot password · Update password

// If already logged in, skip to dashboard
if (localStorage.getItem('token')) {
    window.location.href = '/02-dashboard.html'
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function showError(container, msg) {
    let el = container.querySelector('.form-error')
    if (!el) {
        el = document.createElement('p')
        el.className = 'form-error'
        el.style.cssText = 'color:#A33B2E;font-size:13px;margin:0 0 14px;font-weight:500;'
        container.prepend(el)
    }
    el.textContent = msg
}

function clearError(container) {
    const el = container.querySelector('.form-error')
    if (el) el.remove()
}

function setLoading(btn, loading) {
    btn.disabled = loading
    btn.style.opacity = loading ? '0.65' : '1'
    btn.dataset.orig = btn.dataset.orig || btn.textContent
    btn.textContent = loading ? 'Please wait…' : btn.dataset.orig
}

// ── Tab active highlight ──────────────────────────────────────────────────────
const modeLogin  = document.getElementById('mode-login')
const modeSignup = document.getElementById('mode-signup')
const tLogin     = document.getElementById('t-login')
const tSignup    = document.getElementById('t-signup')

function refreshTabs() {
    tLogin.classList.toggle('active', modeLogin.checked)
    tSignup.classList.toggle('active', modeSignup.checked)
}
modeLogin.addEventListener('change', refreshTabs)
modeSignup.addEventListener('change', refreshTabs)
refreshTabs()

// ── LOGIN ─────────────────────────────────────────────────────────────────────
const loginPanel = document.querySelector('.panel-form.login')
const loginBtn   = loginPanel.querySelector('.btn-primary')

loginBtn.addEventListener('click', async () => {
    clearError(loginPanel)
    const email    = loginPanel.querySelectorAll('input')[0].value.trim()
    const password = loginPanel.querySelectorAll('input')[1].value

    if (!email || !password) return showError(loginPanel, 'Email and password are required.')

    setLoading(loginBtn, true)
    try {
        const res  = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })
        const body = await res.text()

        if (!res.ok) {
            showError(loginPanel, body || 'Login failed.')
        } else if (body.startsWith('Password') || body.startsWith('User not')) {
            showError(loginPanel, body)
        } else {
            // body is the JWT token
            localStorage.setItem('token', body)
            // fetch profile to cache username
            const pRes = await fetch('/user/profile', {
                headers: { Authorization: `Bearer ${body}` }
            })
            if (pRes.ok) {
                const profile = await pRes.json()
                localStorage.setItem('username', profile[0])
            }
            window.location.href = '/02-dashboard.html'
        }
    } catch (e) {
        showError(loginPanel, 'Network error. Try again.')
    } finally {
        setLoading(loginBtn, false)
    }
})

// ── SIGN UP ───────────────────────────────────────────────────────────────────
const signupPanel = document.querySelector('.panel-form.signup')
const signupBtn   = signupPanel.querySelector('.btn-primary')

signupBtn.addEventListener('click', async () => {
    clearError(signupPanel)
    const inputs   = signupPanel.querySelectorAll('input')
    const username = inputs[0].value.trim()
    const email    = inputs[1].value.trim()
    const password = inputs[2].value

    if (!username || !email || !password) return showError(signupPanel, 'All fields are required.')
    if (!email.includes('@'))             return showError(signupPanel, 'Enter a valid email.')
    if (password.length < 6)             return showError(signupPanel, 'Password must be at least 6 characters.')

    setLoading(signupBtn, true)
    try {
        const res  = await fetch('/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        })
        const body = await res.json().catch(() => res.text())

        if (!res.ok) {
            showError(signupPanel, body?.message || 'Sign up failed.')
        } else {
            // Auto-login after signup
            const loginRes = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })
            const tok = await loginRes.text()
            localStorage.setItem('token', tok)
            localStorage.setItem('username', username)
            window.location.href = '/02-dashboard.html'
        }
    } catch (e) {
        showError(signupPanel, 'Network error. Try again.')
    } finally {
        setLoading(signupBtn, false)
    }
})

// ── FORGOT / RESET ────────────────────────────────────────────────────────────
const forgotPanel  = document.querySelector('.panel-form.forgot')
const forgotBtns   = forgotPanel.querySelectorAll('.btn-primary')
const sendBtn      = forgotBtns[0]   // "Send reset token"
const updateBtn    = forgotBtns[1]   // "Update password"

sendBtn.addEventListener('click', async () => {
    clearError(forgotPanel)
    const email = forgotPanel.querySelectorAll('input')[0].value.trim()
    if (!email) return showError(forgotPanel, 'Enter your email address.')

    setLoading(sendBtn, true)
    try {
        const res  = await fetch('/resetpass', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        })
        const body = await res.text()
        showError(forgotPanel, body)   // reuse error el as message (green override below)
        if (res.ok && body === 'Email sent!') {
            forgotPanel.querySelector('.form-error').style.color = '#3D5A4C'
        }
    } catch (e) {
        showError(forgotPanel, 'Network error.')
    } finally {
        setLoading(sendBtn, false)
    }
})

updateBtn.addEventListener('click', async () => {
    clearError(forgotPanel)
    const inputs  = forgotPanel.querySelectorAll('input')
    const token   = inputs[1].value.trim()
    const newpass = inputs[2].value

    if (!token || !newpass) return showError(forgotPanel, 'Paste the token and enter a new password.')
    if (newpass.length < 6) return showError(forgotPanel, 'Password must be at least 6 characters.')

    setLoading(updateBtn, true)
    try {
        const res  = await fetch('/updatepass', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newpass })
        })
        const body = await res.text()
        showError(forgotPanel, body)
        if (body === 'Password updated') {
            forgotPanel.querySelector('.form-error').style.color = '#3D5A4C'
            setTimeout(() => { modeLogin.checked = true; refreshTabs() }, 1800)
        }
    } catch (e) {
        showError(forgotPanel, 'Network error.')
    } finally {
        setLoading(updateBtn, false)
    }
})
