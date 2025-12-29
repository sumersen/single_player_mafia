
# Single-Player Voice-Based Mafia Game (MVP)
## Product Requirements Document (PRD)

## 🎯 Goal
Build an MVP of a **voice-only**, AI-driven **single-player Mafia** game where the user plays alongside **6 AI agents** (including 1 Game Master). Agents speak using OpenAI TTS, interrupt each other, hold conversations, accuse people, and participate in Mafia mechanics (night actions, voting, eliminations).

The entire project will be built using:
- **Next.js (App Router)** — frontend + backend API routes  
- **Tailwind CSS** — styling  
- **OpenAI API** — LLM reasoning + TTS  
- **In-memory game store** — no database required  
- **Vercel** — hosting

This PRD is written specifically for **Cursor**.  
Every task must be executed **one step at a time** with **no unintended changes**.

---

# 1. High-Level System Overview

## Architecture Diagram (Simplified)

```
Frontend (Next.js)
 - Voice recording (mic)
 - Audio playback (agent voices)
 - Transcript UI
 - Avatar UI
 - Voting UI
       │
       ▼
Backend (Next.js API Routes)
 - Game state management
 - Agent reasoning & dialog generation
 - Interrupt logic
 - Mafia mechanics (night actions, votes)
 - TTS API calls
 - Whisper transcription
       │
       ▼
In-Memory Game Store
 - Agents
 - Roles
 - Actions
 - Transcript
 - Votes
       │
       ▼
OpenAI API
 - TTS (realistic 20-something US voices)
 - LLM (dialogue, narration, game logic)
```

---

# 2. Game Structure

## Player + 7 AI Agents:
- **Player**
- **Agent 1:** Mafia  
- **Agent 2:** Doctor  
- **Agent 3:** Investigator  
- **Agent 4:** Citizen  
- **Agent 5:** Citizen  
- **Agent 6:** Citizen  
- **Agent 7:** Game Master (narrator)

---

# 3. Game Phases

### 1. **Introductions Phase**
- Game Master introduces the game.
- Each agent introduces themselves.
- Player asked to introduce themselves.
- Interruptions allowed.

### 2. **Day Phase**
- Open conversation.
- Agents accuse each other.
- Agents interrupt each other randomly.
- Player may speak at any time.
- After 2 minutes → Voting begins.

### 3. **Voting Phase**
- Player votes via UI.
- Agents vote using LLM logic.
- Highest votes = eliminated.
- Game Master reveals elimination.

### 4. **Night Phase**
- Game Master instructs “close your eyes”.
- Mafia chooses one player to kill.
- Doctor chooses one player to save.
- Investigator investigates a player.
- Continue to next day unless win conditions met.

### 5. **End Game**
- If Mafia eliminated → player wins.
- If citizens lose numbers → Mafia wins.
- All roles revealed.
- Game recap shown.

---

# 4. Requirements (Detailed)

## 4.1 Voice Input
- Capture player mic audio.
- Convert to text (Web Speech API or Whisper).
- Send text to backend for processing.

## 4.2 Voice Output
- OpenAI TTS converts all AI text to audio.
- Multiple voices may play simultaneously for chaos.
- AudioPlayer must support overlapping streams.

## 4.3 Transcript UI
- Timestamped messages.
- Show speaker name + avatar.
- Show interruptions as overlapping messages.

## 4.4 Avatars UI
- 6 agent avatars + 1 Game Master avatar.
- Highlight speaker when talking.

## 4.5 Game State (In-Memory)
Backend maintains a `gameState` object:

```ts
gameState = {
  agents: [
    { id, name, role, persona, memory, suspicionMap }
  ],
  player: { introduction, suspicionMap },
  transcript: [],
  votes: {},
  phase: "intro" | "day" | "vote" | "night" | "end",
  timers: {...},
  eliminatedPlayers: []
}
```

## 4.6 Agent Dialogue
Each agent uses an LLM prompt including:
- personality
- current role
- suspicions
- previous transcript context
- chaos mode (interrupt or overlap)

Backend returns:
- agent text
- audio blob (TTS)
- metadata (who interrupted who)

## 4.7 Chaos & Interruptions
Backend must randomly:
- choose 1–2 agents to speak simultaneously
- interrupt ongoing speech
- generate short interjections ("Wait what?", "Nah you're lying.")

## 4.8 Voting
- UI lets player select any alive agent.
- Backend generates votes for AI agents.
- Tally votes.
- Highest = eliminated.

## 4.9 Night Actions
Controlled by Game Master:
- Mafia selects target.
- Doctor selects save.
- Investigator selects investigation target.
- Store results for next day.

---

# 5. API Routes Specification

### `POST /api/start-game`
- Creates agents
- Assigns roles
- Returns agent metadata + initial state

### `POST /api/player-speech`
- Accepts player's text or audio
- Transcribes if needed
- Updates transcript
- Triggers agent reactions

### `POST /api/agent-turn`
- Generates next agent(s) speech
- Supports:
  - single speaker
  - overlapping speakers
  - interruptions

### `POST /api/tts`
- Input: { text, voice }
- Output: audio buffer

### `POST /api/advance-phase`
- Moves from intro → day → vote → night → end

### `POST /api/vote`
- Accepts player vote
- Generates AI votes
- Tallies + eliminates

---

# 6. Frontend Components

### `MicRecorder.tsx`
- Records audio
- Sends to backend

### `AudioPlayer.tsx`
- Can play multiple simultaneous audio streams

### `TranscriptList.tsx`
- Scrollable transcript

### `AvatarPanel.tsx`
- Shows avatars
- Highlights speaker

### `VotingUI.tsx`
- Shows clickable vote buttons

---

# 7. Step-by-Step Implementation Tasks (Cursor)

Cursor must follow the tasks **in this exact order**.

## **Task 1: Project Setup**
- Create Next.js + Tailwind project.
- Install dependencies.
- Add OpenAI SDK.

## **Task 2: UI Scaffold**
- Create `app/game/page.tsx`
- Render transcript panel, avatars panel, mic button, and voting placeholder.

## **Task 3: Mic Recorder**
- Implement audio recording.
- Add toggle button for recording.
- Send transcript to UI.

## **Task 4: TTS Endpoint**
- Implement `/api/tts` route using OpenAI TTS.
- Add AudioPlayer capable of playing TTS output.

## **Task 5: Game State System**
- Implement server-side game store.
- Create role assignment.
- Implement `start-game` route.

## **Task 6: Game Master Narration**
- Implement intro narration.
- Agents introduce themselves via LLM + TTS.

## **Task 7: Agent Conversation Engine**
- Create `/api/agent-turn`.
- Supports:
  - single speaker
  - two speakers overlapping
  - interruptions

## **Task 8: Voting UI**
- Show vote buttons.
- Send vote to backend.
- Generate AI votes.
- Eliminate highest.

## **Task 9: Night Phase**
- Game Master prompts night actions.
- Implement Mafia/Doctor/Investigator logic.

## **Task 10: End Game Sequence**
- Reveal roles.
- Show recap.

## **Task 11 (Optional): UI Polish**
- Tailwind animations
- Better avatar styling
- Sound effects

---

# 8. Rules for Cursor

You must ALWAYS follow these rules:

1. **Do not modify any code that the user did not explicitly ask you to modify.**
2. **Perform only the requested task. No extra changes.**
3. **Explain what you will do BEFORE writing any code.**
4. **Produce fully working, testable code — not placeholders.**
5. **Use stable versions of all libraries.**

---

# 9. Stretch Features (Not MVP)
- Animated avatars  
- Character generator (new personas per game)  
- Replay/share transcript  
- Persistent leaderboard  
- Multiplayer  
- Custom voice cloning  

---

# End of PRD
