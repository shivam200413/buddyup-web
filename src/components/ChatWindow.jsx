import { useState, useEffect, useRef } from 'react'
import { useStore } from '../lib/store'

function formatTime(iso) {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ChatWindow() {
  const { activeChatFlareId, conversations, session, sendMessage, closeChat, clearUnread } = useStore()
  const [text, setText] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const conv = activeChatFlareId ? conversations[activeChatFlareId] : null
  const messages = conv?.messages || []
  const flare = conv?.flare

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    if (activeChatFlareId) clearUnread(activeChatFlareId)
  }, [messages.length, activeChatFlareId])

  useEffect(() => {
    if (activeChatFlareId) inputRef.current?.focus()
  }, [activeChatFlareId])

  if (!activeChatFlareId) return null

  const handleSend = async () => {
    if (!text.trim()) return
    await sendMessage(activeChatFlareId, text)
    setText('')
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <>
      {/* Backdrop */}
      <div onClick={closeChat} style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)',
        zIndex: 1700, backdropFilter: 'blur(2px)'
      }} />

      {/* Chat panel */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1800,
        height: '72vh', background: 'var(--bg2)',
        borderRadius: '20px 20px 0 0', border: '1px solid var(--border2)',
        borderBottom: 'none', display: 'flex', flexDirection: 'column',
        animation: 'fadeUp 0.28s cubic-bezier(0.34,1.4,0.64,1) both'
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, background: 'var(--bg4)', borderRadius: 2, margin: '14px auto 0' }} />

        {/* Header */}
        <div style={{
          padding: '12px 16px', display: 'flex', alignItems: 'center',
          gap: 10, borderBottom: '1px solid var(--border)'
        }}>
          <div style={{ fontSize: 20 }}>💬</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              {flare?.activity_type ? `${flare.activity_type} chat` : 'Flare chat'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
              messages disappear when flare expires
            </div>
          </div>
          <button onClick={closeChat} style={{
            background: 'var(--bg3)', border: '1px solid var(--border2)',
            borderRadius: 8, padding: '6px 10px', color: 'var(--text2)',
            cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font)'
          }}>
            Close
          </button>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '12px 14px',
          display: 'flex', flexDirection: 'column', gap: 8
        }}>
          {messages.length === 0 && (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 8,
              color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 12
            }}>
              <span style={{ fontSize: 28 }}>👋</span>
              No messages yet — say hello!
            </div>
          )}

          {messages.map((msg) => {
            const isOwn = msg.user_id === session?.user?.id
            return (
              <div key={msg.id} style={{
                display: 'flex', flexDirection: 'column',
                alignItems: isOwn ? 'flex-end' : 'flex-start', gap: 2
              }}>
                {!isOwn && (
                  <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', paddingLeft: 4 }}>
                    @{msg.username}
                  </span>
                )}
                <div style={{
                  maxWidth: '78%', padding: '8px 12px',
                  background: isOwn ? 'var(--accent)' : 'var(--bg3)',
                  color: isOwn ? '#030712' : 'var(--text)',
                  borderRadius: isOwn ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  fontSize: 14, lineHeight: 1.45,
                  border: isOwn ? 'none' : '1px solid var(--border2)'
                }}>
                  {msg.text}
                </div>
                <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)', paddingRight: 4 }}>
                  {formatTime(msg.sent_at)}
                </span>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '10px 12px 20px', borderTop: '1px solid var(--border)',
          display: 'flex', gap: 8, alignItems: 'flex-end'
        }}>
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Message..."
            rows={1}
            style={{
              flex: 1, background: 'var(--bg3)',
              border: '1px solid var(--border2)', borderRadius: 10,
              color: 'var(--text)', fontFamily: 'var(--font)', fontSize: 14,
              padding: '9px 12px', outline: 'none', resize: 'none',
              maxHeight: 90, overflow: 'auto'
            }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: text.trim() ? 'var(--accent)' : 'var(--bg4)',
              border: 'none', cursor: text.trim() ? 'pointer' : 'default',
              fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s'
            }}
          >
            ↑
          </button>
        </div>
      </div>
    </>
  )
}
