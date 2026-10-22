# CLINIC — Session Handling & Zero-Latency Rules

## 1. Zero-Wait Session Initialization Protocol
- **Immediate Connection**: When a patient initiates a consultation or selects a doctor, the consultation session must connect immediately without artificial delays, simulated typing pauses, or multi-step waiting screens.
- **Instant Consultation Resolution**: Check for existing active consultations between the authenticated patient and doctor and resume directly; if none exists, instantiate the consultation record immediately.
- **No Artificial Spinners**: Avoid synthetic timeouts or countdown timers that delay entry into the consultation room.

## 2. Multi-Doctor Strict Isolation & Privacy (HIPAA / GDPR)
- **Strict Data Partitioning**: A doctor must ONLY see and access their own patient consultation threads.
- **Zero Cross-Doctor Leakage**: Another doctor's conversation must NEVER leak, be queried, or appear in another doctor's dashboard or chat history.
- **Enforced Access Guards**: Any doctor attempting to access a consultation ID assigned to another doctor must be immediately blocked with an explicit access notice.

## 3. High-Reliability Dual-Tier Persistence
- **Optimistic Local Cache**: All messages dispatched in a consultation must be recorded instantly to local persistent storage (`clinic_chat_${consultationId}`) so chat records never vanish on refresh or network hiccups.
- **Resilient Database Sync**: Persist every message to Supabase (`chat_messages` / `messages`), handling retries gracefully.
- **Real-Time Bidirectional Synchronization**: Use Supabase Realtime channels and database change listeners to ensure instantaneous delivery between patient and doctor.

## 4. Mobile Ergonomics & Viewport Integrity
- **No Mobile Auto-Zoom**: Ensure all input docks and interactive controls maintain `font-size >= 16px` on viewports under 768px, with `maximumScale: 1` and `userScalable: false` to prevent disruptive screen zooming during typing.
