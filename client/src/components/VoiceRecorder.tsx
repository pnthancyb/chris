import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Square, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  onRecordingStateChange: (isRecording: boolean) => void;
}

export function VoiceRecorder({ onTranscription, onRecordingStateChange }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Transcribe the audio
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      onRecordingStateChange(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      onRecordingStateChange(false);
    }
  };

  const transcribeAudio = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.wav');

      const response = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const result = await response.json();
      onTranscription(result.text);
    } catch (error) {
      console.error('Error transcribing audio:', error);
      toast({
        title: "Transcription Error",
        description: "Failed to convert speech to text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const playRecording = () => {
    if (audioBlob) {
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audio.play();
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {!isRecording ? (
        <Button
          onClick={startRecording}
          variant="outline"
          size="sm"
          disabled={isProcessing}
          className="relative"
        >
          <Mic className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          onClick={stopRecording}
          variant="destructive"
          size="sm"
          className="relative animate-pulse"
        >
          <Square className="h-4 w-4" />
        </Button>
      )}
      
      {audioBlob && !isRecording && (
        <Button
          onClick={playRecording}
          variant="outline"
          size="sm"
          disabled={isProcessing}
        >
          <Play className="h-3 w-3" />
        </Button>
      )}
      
      {isProcessing && (
        <div className="text-xs text-muted-foreground animate-pulse">
          Converting speech to text...
        </div>
      )}
    </div>
  );
}