import { createStore } from 'solid-js/store';
import { createSignal } from 'solid-js';
import { audioEngine } from '../lib/audioEngine';
import type { TransportState, Project } from '../types';

export const createTransportStore = (getProject?: () => Project) => {
  const [transport, setTransport] = createStore<TransportState>({
    isPlaying: false,
    isRecording: false,
    isLooping: false,
    currentTime: 0,
    loopStart: 0,
    loopEnd: 16, // 4 bars at 4/4
    tempo: 120,
    timeSignature: [4, 4]
  });

  const [positionSignal, setPositionSignal] = createSignal(0);
  let animationFrame: number | null = null;
  let clipsScheduled = false;

  const play = async () => {
    await audioEngine.ensureInitialized();
    
    // Always stop and reset transport before scheduling new clips
    audioEngine.stopTransport();
    clipsScheduled = false; // Reset flag to allow fresh scheduling
    
    // Schedule all clips from the project
    if (getProject) {
      const project = getProject();
      console.log('Scheduling clips for project with', project.tracks.length, 'tracks');
      
      project.tracks.forEach(track => {
        // Create default instrument if none exists
        if (!track.instrument) {
          const defaultInstrument = {
            id: `${track.id}-synth`,
            name: 'Default Synth',
            type: 'synth' as const,
            parameters: {}
          };
          audioEngine.createInstrument(defaultInstrument);
          track.instrument = defaultInstrument;
        } else {
          audioEngine.createInstrument(track.instrument);
        }
        
        // Schedule all clips in the track
        track.clips.forEach(clip => {
          audioEngine.scheduleClip(clip, track);
        });
      });
      clipsScheduled = true;
    }
    
    // Restore loop settings if looping is enabled
    if (transport.isLooping && window.Tone) {
      window.Tone.Transport.loop = true;
      
      // Convert beat values to Tone.js time notation
      const convertBeatsToToneTime = (beats: number) => {
        const bars = Math.floor(beats / 4);
        const remainingBeats = Math.floor(beats % 4);
        const sixteenths = Math.round((beats % 1) * 4);
        return `${bars}:${remainingBeats}:${sixteenths}`;
      };
      
      const loopStartTime = convertBeatsToToneTime(transport.loopStart);
      const loopEndTime = convertBeatsToToneTime(transport.loopEnd);
      
      window.Tone.Transport.loopStart = loopStartTime;
      window.Tone.Transport.loopEnd = loopEndTime;
      console.log('Restored loop settings: start=', transport.loopStart, 'beats (', loopStartTime, ') end=', transport.loopEnd, 'beats (', loopEndTime, ')');
    }
    
    setTransport('isPlaying', true);
    audioEngine.startTransport();
    startPositionUpdate();
  };

  const stop = () => {
    setTransport('isPlaying', false);
    setTransport('isRecording', false);
    audioEngine.stopTransport();
    audioEngine.setPosition(0);
    setCurrentTime(0);
    stopPositionUpdate();
    clipsScheduled = false; // Allow rescheduling on next play
    console.log('Transport stopped, clips scheduling reset');
  };

  const pause = () => {
    if (transport.isPlaying) {
      setTransport('isPlaying', false);
      audioEngine.pauseTransport();
      stopPositionUpdate();
    }
  };

  const record = () => {
    setTransport('isRecording', !transport.isRecording);
    if (transport.isRecording && !transport.isPlaying) {
      play();
    }
  };

  const toggleLoop = () => {
    const wasLooping = transport.isLooping;
    setTransport('isLooping', !transport.isLooping);
    
    // When enabling loop for the first time, set intelligent default loop end
    if (!wasLooping && getProject) {
      const project = getProject();
      let maxClipEnd = 0;
      
      // Find the end of the longest clip
      project.tracks.forEach(track => {
        track.clips.forEach(clip => {
          const clipEnd = clip.start + clip.duration;
          if (clipEnd > maxClipEnd) {
            maxClipEnd = clipEnd;
          }
        });
      });
      
      if (maxClipEnd > 0) {
        // Round up to next bar (4 beats) for a nice loop length
        const loopEndBeats = Math.ceil(maxClipEnd / 4) * 4;
        setTransport('loopEnd', Math.max(loopEndBeats, 4)); // At least 1 bar
        console.log('Set intelligent loop end to', loopEndBeats, 'beats based on clips ending at', maxClipEnd);
      }
    }
    
    if (window.Tone && audioEngine) {
      window.Tone.Transport.loop = !wasLooping;
      if (!wasLooping) {
        // Convert beat values to Tone.js time notation
        const convertBeatsToToneTime = (beats: number) => {
          const bars = Math.floor(beats / 4);
          const remainingBeats = Math.floor(beats % 4);
          const sixteenths = Math.round((beats % 1) * 4);
          return `${bars}:${remainingBeats}:${sixteenths}`;
        };
        
        window.Tone.Transport.loopStart = convertBeatsToToneTime(transport.loopStart);
        window.Tone.Transport.loopEnd = convertBeatsToToneTime(transport.loopEnd);
      }
    }
  };

  const setCurrentTime = (time: number) => {
    setTransport('currentTime', time);
    setPositionSignal(time);
    audioEngine.setPosition(time);
  };

  const setLoopStart = (time: number) => {
    setTransport('loopStart', time);
  };

  const setLoopEnd = (time: number) => {
    setTransport('loopEnd', time);
  };

  const setTempo = (tempo: number) => {
    setTransport('tempo', tempo);
    audioEngine.setTempo(tempo);
  };

  const setTimeSignature = (timeSignature: [number, number]) => {
    setTransport('timeSignature', timeSignature);
  };

  const startPositionUpdate = () => {
    const updatePosition = () => {
      if (transport.isPlaying) {
        const newTime = audioEngine.getCurrentTime();
        
        if (transport.isLooping && newTime >= transport.loopEnd) {
          setCurrentTime(transport.loopStart);
        } else {
          setCurrentTime(newTime);
        }
        
        animationFrame = requestAnimationFrame(updatePosition);
      }
    };
    animationFrame = requestAnimationFrame(updatePosition);
  };

  const stopPositionUpdate = () => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  };

  return {
    transport,
    positionSignal,
    play,
    stop,
    pause,
    record,
    toggleLoop,
    setCurrentTime,
    setLoopStart,
    setLoopEnd,
    setTempo,
    setTimeSignature
  };
};

export type TransportStore = ReturnType<typeof createTransportStore>;