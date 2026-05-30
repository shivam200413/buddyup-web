import { useState, useRef, useEffect } from 'react'
import { useStore } from '../lib/store'
import { getActivity } from '../lib/supabase'

// ── Suggested prompts shown when chat is empty ─────────────────────────────
const SUGGESTIONS = [
  { icon: '🗺️', text: 'What activities can I do near me right now?' },
  { icon: '🤝', text: 'Give me an icebreaker to start a conversation with a stranger' },
  { icon: '⚽', text: 'How do I find people for a pickup football game?' },
  { icon: '🛡️', text: 'Safety tips for meeting someone from the app' },
  { icon: '🏃', text: 'Best running routes for beginners' },
  { icon: '☕', text: 'How do I invite someone for coffee without it being awkward?' },
]

function buildSystemPrompt(profile, position, flares) {
  const nearbyActivities = flares.slice(0, 5).map(f => {
    const a = getActivity(f.activity_type)
    return `${a.emoji} ${a.label} (${Math.round(f.distance_meters)}m away, ${f.participant_count} joined)`
  }).join('\n')

  return `You are BuddyBot, the friendly in-app assistant for BuddyUp — a hyper-local real-time activity discovery app. Users open the app, appear on a live map, and can drop or join "Flares" — short-lived (2hr) activity invitations nearby.

User context:
- Username: @${profile?.username || 'anonymous'}
- Location: ${position ? `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}` : 'unknown'}
- Nearby flares right now:
${nearbyActivities || '  (none active nearby)'}

Your personality: warm, direct, slightly playful. Never robotic. Keep responses concise — 2-4 sentences max unless the user asks for something detailed. You can help with:
- Suggesting activities based on what's nearby
- Icebreaker ideas for meeting strangers safely
- Tips for specific activities (running routes, basketball drills, study spots)
- Safety advice for real-world meetups
- How to use BuddyUp features

Never make up specific location names or addresses. If asked about something outside your scope, gently redirect. Always encourage the user to step outside and connect with people nearby.`
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ChatbotPage({ onClose }) {
  const { profile, position, flares } = useStore()
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hey @${profile?.username || 'there'} 👋 I'm BuddyBot. I can help you find activities nearby, suggest icebreakers, or give safety tips for meetups. What's on your mind?`,
      time: new Date().toISOString()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return
    const userMsg = { role: 'user', content: text.trim(), time: new Date().toISOString() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (!apiKey) throw new Error('VITE_GEMINI_API_KEY not set in .env')

      const systemPrompt = buildSystemPrompt(profile, position, flares)

      // Gemini needs system prompt as a user+model turn pair at the start
      const systemTurns = [
        { role: 'user',  parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Understood! I am BuddyBot, ready to help.' }] }
      ]

      const historyTurns = newMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [...systemTurns, ...historyTurns],
            generationConfig: { maxOutputTokens: 400, temperature: 0.75 },
            safetySettings: [
              { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
              { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
            ]
          })
        }
      )

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message || `API error ${res.status}`)
      }

      const data = await res.json()
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I had trouble responding.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply, time: new Date().toISOString() }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ ${err.message === 'VITE_GEMINI_API_KEY not set in .env'
          ? 'Add your free Gemini API key to .env as VITE_GEMINI_API_KEY — get one at aistudio.google.com'
          : `Something went wrong: ${err.message}`}`,
        time: new Date().toISOString(),
        isError: true
      }])
    } finally {
      setLoading(false)
    }
  }

  const showSuggestions = messages.length <= 1

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)',
        zIndex: 1700, backdropFilter: 'blur(2px)'
      }} />

      {/* Panel */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1800,
        height: '80vh', background: 'var(--bg2)',
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
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed44, #38bdf844)',
            border: '2px solid #7c3aed66',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
          }}>
            🤖
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>BuddyBot</div>
            <div style={{ fontSize: 11, color: 'var(--green)', fontFamily: 'var(--mono)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
              online · knows your nearby flares
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'var(--bg3)', border: '1px solid var(--border2)',
            borderRadius: 8, padding: '6px 10px', color: 'var(--text2)',
            cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font)'
          }}>
            Close
          </button>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '14px',
          display: 'flex', flexDirection: 'column', gap: 10
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 2
            }}>
              {msg.role === 'assistant' && (
                <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', paddingLeft: 4 }}>
                  BuddyBot
                </div>
              )}
              <div style={{
                maxWidth: '82%', padding: '9px 13px',
                background: msg.role === 'user'
                  ? 'var(--accent)'
                  : msg.isError ? 'rgba(248,113,113,0.1)' : 'var(--bg3)',
                color: msg.role === 'user' ? '#030712' : msg.isError ? 'var(--red)' : 'var(--text)',
                borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                fontSize: 14, lineHeight: 1.55,
                border: msg.role === 'assistant'
                  ? `1px solid ${msg.isError ? 'rgba(248,113,113,0.3)' : 'var(--border2)'}`
                  : 'none'
              }}>
                {msg.content}
              </div>
              <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                {formatTime(msg.time)}
              </span>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <div style={{
                padding: '10px 14px', background: 'var(--bg3)',
                border: '1px solid var(--border2)',
                borderRadius: '14px 14px 14px 4px',
                display: 'flex', gap: 4, alignItems: 'center'
              }}>
                {[0, 150, 300].map(delay => (
                  <div key={delay} style={{
                    width: 6, height: 6, borderRadius: '50%', background: 'var(--text3)',
                    animation: `typingDot 1.2s ease infinite`,
                    animationDelay: `${delay}ms`
                  }} />
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {showSuggestions && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', paddingLeft: 2 }}>
                try asking...
              </div>
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s.text)}
                  style={{
                    background: 'var(--bg3)', border: '1px solid var(--border2)',
                    borderRadius: 10, padding: '8px 12px', cursor: 'pointer',
                    color: 'var(--text2)', fontFamily: 'var(--font)', fontSize: 13,
                    textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8,
                    transition: 'border-color 0.15s'
                  }}
                >
                  <span>{s.icon}</span>
                  <span>{s.text}</span>
                </button>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '10px 12px 22px', borderTop: '1px solid var(--border)',
          display: 'flex', gap: 8, alignItems: 'flex-end'
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
            placeholder="Ask BuddyBot..."
            rows={1}
            style={{
              flex: 1, background: 'var(--bg3)', border: '1px solid var(--border2)',
              borderRadius: 10, color: 'var(--text)', fontFamily: 'var(--font)',
              fontSize: 14, padding: '9px 12px', outline: 'none', resize: 'none',
              maxHeight: 90, overflow: 'auto'
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: input.trim() && !loading ? 'var(--accent)' : 'var(--bg4)',
              border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'default',
              fontSize: 18, display: 'flex', alignItems: 'center',
              justifyContent: 'center', transition: 'all 0.15s'
            }}
          >
            ↑
          </button>
        </div>
      </div>

      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-3px); }
        }
      `}</style>
    </>
  )
}
