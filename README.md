# Single-Player Voice-Based Mafia Game

A voice-only, AI-driven single-player Mafia game built with Next.js, Tailwind CSS, and OpenAI API.

## Tech Stack

- **Next.js 16.1.1** (App Router) - Frontend and backend API routes
- **Tailwind CSS v4** - Styling
- **OpenAI API** - LLM reasoning and TTS (Text-to-Speech)
- **TypeScript** - Type safety
- **react-media-recorder** - Audio recording
- **howler** - Audio playback
- **@headlessui/react** - UI components

## Getting Started

### Prerequisites

- Node.js 18+ installed
- OpenAI API key

### Environment Variables

Create a `.env.local` file in the root directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

### Installation

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build

```bash
npm run build
npm start
```

## Project Structure

- `app/` - Next.js App Router pages and API routes
- `app/game/` - Main game page (to be created)
- `app/api/` - Backend API routes
- `public/` - Static assets

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Make sure to add your `OPENAI_API_KEY` environment variable in Vercel's project settings.
