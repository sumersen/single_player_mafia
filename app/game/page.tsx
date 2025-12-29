'use client';

import { useState, useEffect, useRef } from 'react';
import { useTTSPlayer } from './components/AudioPlayer';

// TypeScript declarations for Speech Recognition API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface Window {
  webkitSpeechRecognition: {
    new (): SpeechRecognition;
  };
  SpeechRecognition?: {
    new (): SpeechRecognition;
  };
}

// Transcript entry type
type TranscriptEntry = {
  id: string;
  speaker: string;
  message: string;
  timestamp: string;
  avatarId: string;
};

// Agent data structure (will be replaced with real data later)
const AGENTS = [
  { id: 'gm', name: 'Game Master', role: 'Game Master', isActive: false },
  { id: 'agent1', name: 'Agent 1', role: 'Mafia', isActive: false },
  { id: 'agent2', name: 'Agent 2', role: 'Doctor', isActive: false },
  { id: 'agent3', name: 'Agent 3', role: 'Investigator', isActive: false },
  { id: 'agent4', name: 'Agent 4', role: 'Citizen', isActive: false },
  { id: 'agent5', name: 'Agent 5', role: 'Citizen', isActive: false },
  { id: 'agent6', name: 'Agent 6', role: 'Citizen', isActive: false },
];

// Helper function to format timestamp
const formatTimestamp = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function GamePage() {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([
    { id: '1', speaker: 'Game Master', message: 'Welcome to the game. Let\'s begin.', timestamp: '00:00', avatarId: 'gm' },
    { id: '2', speaker: 'Agent 1', message: 'Hello everyone!', timestamp: '00:05', avatarId: 'agent1' },
  ]);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);
  const { playTTS } = useTTSPlayer();

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        // Update transcript with final result
        if (finalTranscript.trim()) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          const newEntry: TranscriptEntry = {
            id: Date.now().toString(),
            speaker: 'You',
            message: finalTranscript.trim(),
            timestamp: formatTimestamp(elapsed),
            avatarId: 'player',
          };
          setTranscript((prev) => [...prev, newEntry]);
          setTranscriptionError(null);
        }
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setTranscriptionError(`Speech recognition error: ${event.error}`);
      };

      recognitionRef.current.onend = () => {
        // Auto-restart if we're still supposed to be recording
        // This will be controlled by the recording state
      };
    } else if (typeof window !== 'undefined' && !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setTranscriptionError('Speech recognition not supported in this browser. Please use Chrome or Edge.');
    }
  }, []);

  // Native MediaRecorder for audio capture (backup/alternative approach)
  const startMediaRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        console.log('Audio recorded:', audioUrl);
        // Audio blob is available here if needed for Whisper API later
        // Clean up the stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
    } catch (error) {
      console.error('Error starting media recording:', error);
      setTranscriptionError('Failed to access microphone. Please check permissions.');
    }
  };

  const stopMediaRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  };

  // Auto-scroll transcript to bottom when new messages arrive
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const handleMicToggle = async () => {
    if (isRecording) {
      // Stop recording
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopMediaRecording();
      setIsRecording(false);
      setTranscriptionError(null);
    } else {
      // Start recording
      startTimeRef.current = Date.now();
      setIsRecording(true);
      
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          await startMediaRecording();
          setTranscriptionError(null);
        } catch (error) {
          console.error('Error starting recording:', error);
          setTranscriptionError('Failed to start recording. Please check microphone permissions.');
          setIsRecording(false);
        }
      } else {
        // Fallback to media recorder only if speech recognition not available
        try {
          await startMediaRecording();
          setTranscriptionError('Speech recognition not available. Audio is being recorded but not transcribed.');
        } catch (error) {
          console.error('Error starting media recording:', error);
          setTranscriptionError('Failed to access microphone. Please check permissions.');
          setIsRecording(false);
        }
      }
    }
  };

  // Test TTS function
  const handleTestTTS = async () => {
    setIsPlayingTTS(true);
    await playTTS(
      'Hello! This is a test of the text-to-speech system. The game is working correctly.',
      'nova',
      () => {
        setIsPlayingTTS(false);
      }
    );
  };

  return (
    <div className="flex h-screen flex-col bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Single-Player Mafia Game</h1>
          <button
            onClick={handleTestTTS}
            disabled={isPlayingTTS}
            className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
              isPlayingTTS
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isPlayingTTS ? 'Playing...' : 'Test TTS'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Avatars Panel */}
        <div className="border-b border-gray-700 bg-gray-800 px-4 py-4">
          <div className="flex flex-wrap items-center justify-center gap-4">
            {AGENTS.map((agent) => (
              <div
                key={agent.id}
                className={`flex flex-col items-center transition-all ${
                  activeSpeaker === agent.id
                    ? 'scale-110 transform'
                    : ''
                }`}
              >
                <div
                  className={`relative h-16 w-16 rounded-full border-2 transition-all ${
                    activeSpeaker === agent.id
                      ? 'border-yellow-400 bg-yellow-400/20 shadow-lg shadow-yellow-400/50'
                      : 'border-gray-600 bg-gray-700'
                  }`}
                >
                  <div className="flex h-full w-full items-center justify-center text-2xl">
                    {agent.name.charAt(0)}
                  </div>
                  {activeSpeaker === agent.id && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 animate-pulse rounded-full bg-yellow-400"></div>
                  )}
                </div>
                <span className="mt-2 text-xs font-medium">{agent.name}</span>
                <span className="text-xs text-gray-400">{agent.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Transcript Panel */}
        <div className="flex-1 overflow-y-auto bg-gray-900 px-4 py-4">
          <div className="mx-auto max-w-4xl space-y-3">
            {transcript.length === 0 ? (
              <div className="flex h-full items-center justify-center text-gray-500">
                <p>No messages yet. The game will begin shortly...</p>
              </div>
            ) : (
              <>
                {transcript.map((entry) => (
                  <div
                    key={entry.id}
                    className={`flex items-start gap-3 rounded-lg p-3 transition-colors ${
                      entry.speaker === 'You'
                        ? 'bg-blue-900/30 border border-blue-700/50'
                        : 'bg-gray-800 hover:bg-gray-750'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                        entry.speaker === 'You'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      {entry.speaker === 'You' ? '👤' : entry.speaker.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-white">{entry.speaker}</span>
                        <span className="text-xs text-gray-400">{entry.timestamp}</span>
                      </div>
                      <p className="mt-1 text-gray-300">{entry.message}</p>
                    </div>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </>
            )}
            {transcriptionError && (
              <div className="mx-auto max-w-4xl rounded-lg bg-red-900/30 border border-red-700/50 p-3">
                <p className="text-sm text-red-300">{transcriptionError}</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="border-t border-gray-700 bg-gray-800 px-4 py-4">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
            {/* Mic Button */}
            <button
              onClick={handleMicToggle}
              className={`flex h-14 w-14 items-center justify-center rounded-full transition-all ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {isRecording ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                )}
              </svg>
            </button>

            {/* Voting UI Placeholder */}
            <div className="flex-1 rounded-lg bg-gray-700 px-4 py-3">
              <p className="text-sm text-gray-400">
                Voting UI will appear here during voting phase
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

