import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { MicrophoneIcon, StopIcon } from './Icons';
import LiveWhiteboard from './LiveWhiteboard';
import { LiveSegment } from '../types';
import { extractKeyIdeaFromTranscript, generateImage } from '../services/geminiService';

type LiveSession = Awaited<ReturnType<InstanceType<typeof GoogleGenAI>['live']['connect']>>;

export const LiveClassroom: React.FC = () => {
    const [isLive, setIsLive] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [segments, setSegments] = useState<LiveSegment[]>([]);
    
    const sessionRef = useRef<LiveSession | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const transcriptRef = useRef('');
    const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const sessionContextRef = useRef<string>('');
    const aiRef = useRef<GoogleGenAI | null>(null);

    const stopSession = useCallback(() => {
        setIsLive(false);
        setIsConnecting(false);
        
        if (sessionRef.current) {
            sessionRef.current.close();
            sessionRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (processingIntervalRef.current) {
            clearInterval(processingIntervalRef.current);
            processingIntervalRef.current = null;
        }
    }, []);

    const processTranscript = useCallback(async () => {
        if (transcriptRef.current.trim().length < 15) return;

        const transcriptToProcess = transcriptRef.current;
        transcriptRef.current = '';

        try {
            const segmentData = await extractKeyIdeaFromTranscript(transcriptToProcess, sessionContextRef.current);
            const newSegment: LiveSegment = {
                ...segmentData,
                id: Date.now().toString(),
            };
            setSegments(prev => [...prev, newSegment]);

            // Update session context
            sessionContextRef.current += `\n- ${segmentData.keyIdea}: ${segmentData.detailedExplanation}`;

            // Generate image asynchronously
            generateImage(segmentData.imagePrompt).then(imageUrl => {
                setSegments(prev => prev.map(seg => seg.id === newSegment.id ? { ...seg, imageUrl } : seg));
            }).catch(err => {
                console.error("Image generation failed for segment:", newSegment.id, err);
            });

        } catch (err: any) {
            console.error("Failed to process transcript segment:", err);
            setError("Error generating content from speech.");
        }
    }, []);
    
    const startSession = async () => {
        setIsConnecting(true);
        setError(null);
        setSegments([]);
        transcriptRef.current = '';
        sessionContextRef.current = '';

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            if (!aiRef.current) aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const session = await aiRef.current.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setIsConnecting(false);
                        setIsLive(true);
                        
                        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                        const source = audioContextRef.current.createMediaStreamSource(streamRef.current!);
                        mediaStreamSourceRef.current = source;
                        
                        const scriptProcessor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) {
                                int16[i] = inputData[i] * 32768;
                            }
                            let binary = '';
                            for (let i = 0; i < int16.buffer.byteLength; i++) {
                                binary += String.fromCharCode(new Uint8Array(int16.buffer)[i]);
                            }
                            session.sendRealtimeInput({ media: { data: btoa(binary), mimeType: 'audio/pcm;rate=16000' } });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(audioContextRef.current.destination);
                        
                        processingIntervalRef.current = setInterval(processTranscript, 7000);
                    },
                    onmessage: (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            transcriptRef.current += message.serverContent.inputTranscription.text + ' ';
                        }
                    },
                    onerror: (e) => {
                        console.error('Session error:', e);
                        setError('A connection error occurred.');
                        stopSession();
                    },
                    onclose: () => {
                        stopSession();
                        processTranscript(); // Process any remaining transcript
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO], // Required for this model
                    inputAudioTranscription: {},
                },
            });
            sessionRef.current = session;
        } catch (err) {
            console.error("Failed to start session:", err);
            setError("Could not access microphone. Please check permissions and try again.");
            setIsConnecting(false);
        }
    };
    
    useEffect(() => {
        return () => stopSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="flex flex-col items-center w-full">
            <div className="w-full max-w-7xl">
                <LiveWhiteboard segments={segments} isLive={isLive} />
            </div>
            <div className="mt-6 flex flex-col items-center">
                <button
                    onClick={isLive ? stopSession : startSession}
                    disabled={isConnecting}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg transform hover:scale-110 ${isLive ? 'bg-red-600 hover:bg-red-700' : 'bg-sky-500 hover:bg-sky-600'} disabled:bg-gray-600 disabled:scale-100`}
                >
                    {isConnecting ? (
                        <div className="w-8 h-8 border-2 border-dashed rounded-full animate-spin border-white"></div>
                    ) : isLive ? (
                        <StopIcon className="w-10 h-10 text-white" />
                    ) : (
                        <MicrophoneIcon className="w-10 h-10 text-white" />
                    )}
                </button>
                <p className="text-gray-400 mt-3 text-sm font-medium">
                    {isConnecting ? 'Connecting...' : isLive ? 'Session is Live' : 'Start Live Session'}
                </p>
                {error && <p className="mt-2 text-red-400 bg-red-900/50 border border-red-700 px-3 py-1 rounded-md text-sm">{error}</p>}
            </div>
        </div>
    );
};
