// src/App.jsx
import { useState, useEffect } from 'react'
import './style.css'

const App = () => {
  const [text, setText] = useState('')
  const [password, setPassword] = useState('')
  const [expiry, setExpiry] = useState('1day')
  const [shareLink, setShareLink] = useState('')
  const [isLocked, setIsLocked] = useState(false)
  const [inputPassword, setInputPassword] = useState('')
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // Load draft from localStorage
  useEffect(() => {
    const savedText = localStorage.getItem('securePaste_draft')
    if (savedText) setText(savedText)
  }, [])

  // Save draft to localStorage
  useEffect(() => {
    if (text && !isLocked) {
      localStorage.setItem('securePaste_draft', text)
    }
  }, [text, isLocked])

  // Check URL parameters on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlText = params.get('text')
    const urlPass = params.get('pass')
    const urlExp = params.get('exp')

    if (urlText) {
      if (urlPass) {
        setIsLocked(true)
        const hash = window.location.hash.substring(1)
        if (hash) {
          setPassword(atob(hash))
        }
      } else {
        setText(decodeURIComponent(urlText))
      }
      
      if (urlExp) {
        const expiryTime = parseInt(urlExp)
        if (Date.now() > expiryTime) {
          setError('This note has expired')
          return
        }
      }
    }
  }, [])

  // Create shareable link
  const createShareLink = () => {
    let expiryTime = 0
    
    switch (expiry) {
      case '1hour': expiryTime = Date.now() + 3600000; break
      case '1day': expiryTime = Date.now() + 86400000; break
      case '1week': expiryTime = Date.now() + 604800000; break
      case 'never': expiryTime = 0; break
    }

    const params = new URLSearchParams()
    params.set('text', encodeURIComponent(text))
    if (password) params.set('pass', '1')
    if (expiryTime > 0) params.set('exp', expiryTime)

    let newLink = `${window.location.origin}${window.location.pathname}?${params.toString()}`
    if (password) {
      newLink += `#${btoa(password)}`
    }

    setShareLink(newLink)
  }

  // Unlock note with password
  const unlockNote = () => {
    setIsLoading(true)
    setError('')
    
    setTimeout(() => {
      if (inputPassword === password) {
        setIsLocked(false)
        setError('')
        setAttempts(0)
      } else {
        setAttempts(attempts + 1)
        setError(`Wrong password (attempt ${attempts + 1})`)
      }
      setIsLoading(false)
    }, 500)
  }

  // Create new note
  const handleNewNote = () => {
    setText('')
    setPassword('')
    setExpiry('1day')
    setShareLink('')
    setIsLocked(false)
    setError('')
    setAttempts(0)
    window.history.pushState({}, '', window.location.pathname)
  }

  return (
    <div className="container">
      <header>
        <h1>Secure Note Sharing</h1>
        <p>Encrypted text sharing with expiration</p>
      </header>

      {error && error.includes('expired') ? (
        <div className="message-box error">
          <p>{error}</p>
          <button onClick={handleNewNote}>Create New Note</button>
        </div>
      ) : isLocked ? (
        <div className="unlock-box">
          <h3>Password Protected Note</h3>
          <div className="input-group">
            <input
              type="password"
              value={inputPassword}
              onChange={(e) => setInputPassword(e.target.value)}
              placeholder="Enter password"
              disabled={isLoading}
            />
            <button 
              onClick={unlockNote}
              disabled={isLoading || !inputPassword}
            >
              {isLoading ? 'Checking...' : 'Unlock'}
            </button>
          </div>
          {error && <p className="error-msg">{error}</p>}
          {attempts > 2 && (
            <p className="warning-msg">You can try multiple times</p>
          )}
        </div>
      ) : (
        <div className="editor">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your note here..."
          />

          <div className="controls">
            <div className="form-group">
              <label>Password protection (optional):</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave empty for no password"
              />
              {password && (
                <p className="hint-msg">Note: You'll need this password to view later</p>
              )}
            </div>

            <div className="form-group">
              <label>Expiration time:</label>
              <select 
                value={expiry} 
                onChange={(e) => setExpiry(e.target.value)}
                className="expiry-select"
              >
                <option value="1hour">1 Hour</option>
                <option value="1day">1 Day</option>
                <option value="1week">1 Week</option>
                <option value="never">Never Expire</option>
              </select>
            </div>

            <div className="actions">
              <button 
                onClick={createShareLink}
                disabled={!text.trim()}
                className="primary-btn"
              >
                Create Link
              </button>
              {text && (
                <button 
                  onClick={handleNewNote}
                  className="secondary-btn"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {shareLink && (
        <div className="share-box">
          <h3>Shareable Link:</h3>
          <div className="link-container">
            <input
              type="text"
              value={shareLink}
              readOnly
              onClick={(e) => e.target.select()}
            />
            <button 
              onClick={() => {
                navigator.clipboard.writeText(shareLink)
                alert('Link copied to clipboard!')
              }}
              className="copy-btn"
            >
              Copy
            </button>
          </div>
          <p className="expiry-info">
            {expiry === 'never' ? '🔒 Never expires' : `⏳ Expires in: ${expiry.replace('1', '1 ')}`}
          </p>
          {password && (
            <p className="warning-msg">
              ⚠️ This is a password-protected note
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default App