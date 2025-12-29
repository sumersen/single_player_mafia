import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// OpenAI TTS voice options (realistic 20-something US voices)
// Available voices: alloy, echo, fable, onyx, nova, shimmer
export type TTSVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voice = 'nova' }: { text: string; voice?: TTSVoice } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    if (text.length > 4096) {
      return NextResponse.json(
        { error: 'Text must be 4096 characters or less' },
        { status: 400 }
      );
    }

    // Call OpenAI TTS API
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1', // or 'tts-1-hd' for higher quality (more expensive)
      voice: voice,
      input: text,
    });

    // Convert response to buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());

    // Return audio as MP3
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('TTS API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate speech' },
      { status: 500 }
    );
  }
}

