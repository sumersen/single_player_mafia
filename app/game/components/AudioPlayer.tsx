'use client';

import { useEffect, useRef } from 'react';
import { Howl } from 'howler';

interface AudioPlayerProps {
  audioUrl: string | null;
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
  volume?: number;
}

/**
 * AudioPlayer component that can play TTS audio
 * Supports multiple simultaneous streams for chaos mode
 */
export function AudioPlayer({ 
  audioUrl, 
  onPlayStart, 
  onPlayEnd,
  volume = 1.0 
}: AudioPlayerProps) {
  const howlRef = useRef<Howl | null>(null);

  useEffect(() => {
    if (!audioUrl) return;

    // Create new Howl instance for each audio URL
    const howl = new Howl({
      src: [audioUrl],
      format: ['mp3'],
      volume: volume,
      onplay: () => {
        onPlayStart?.();
      },
      onend: () => {
        onPlayEnd?.();
        // Clean up
        howl.unload();
      },
      onloaderror: (id, error) => {
        console.error('Audio load error:', error);
        onPlayEnd?.();
      },
      onplayerror: (id, error) => {
        console.error('Audio play error:', error);
        onPlayEnd?.();
      },
    });

    howlRef.current = howl;
    howl.play();

    // Cleanup on unmount
    return () => {
      if (howlRef.current) {
        howlRef.current.unload();
        howlRef.current = null;
      }
    };
  }, [audioUrl, volume, onPlayStart, onPlayEnd]);

  return null; // This component doesn't render anything
}

/**
 * Hook to play TTS audio from text
 * Returns a function that fetches TTS and plays it
 */
export function useTTSPlayer() {
  const activeSoundsRef = useRef<Howl[]>([]);

  const playTTS = async (text: string, voice: string = 'nova', onEnd?: () => void) => {
    try {
      // Fetch TTS audio from API
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, voice }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate TTS');
      }

      // Create blob URL from response
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and play Howl instance
      const howl = new Howl({
        src: [audioUrl],
        format: ['mp3'],
        volume: 1.0,
        onend: () => {
          // Clean up blob URL
          URL.revokeObjectURL(audioUrl);
          // Remove from active sounds
          activeSoundsRef.current = activeSoundsRef.current.filter(s => s !== howl);
          onEnd?.();
        },
        onloaderror: (id, error) => {
          console.error('TTS audio load error:', error);
          URL.revokeObjectURL(audioUrl);
          activeSoundsRef.current = activeSoundsRef.current.filter(s => s !== howl);
          onEnd?.();
        },
        onplayerror: (id, error) => {
          console.error('TTS audio play error:', error);
          URL.revokeObjectURL(audioUrl);
          activeSoundsRef.current = activeSoundsRef.current.filter(s => s !== howl);
          onEnd?.();
        },
      });

      activeSoundsRef.current.push(howl);
      howl.play();

      return howl;
    } catch (error) {
      console.error('Error playing TTS:', error);
      onEnd?.();
      return null;
    }
  };

  const stopAll = () => {
    activeSoundsRef.current.forEach(howl => {
      howl.stop();
      howl.unload();
    });
    activeSoundsRef.current = [];
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopAll();
    };
  }, []);

  return { playTTS, stopAll };
}

