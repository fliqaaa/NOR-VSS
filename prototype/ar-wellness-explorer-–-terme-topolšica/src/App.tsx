/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  MapPin, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Sparkles, 
  Info, 
  Compass, 
  Grid, 
  Heart,
  Droplet,
  Flame,
  UserCheck
} from 'lucide-react';
import { ARState, WellnessType } from './types';
import CameraFeed from './components/CameraFeed';
import ARCanvas from './components/ARCanvas';
import InfoPanel from './components/InfoPanel';
import { audioSynth } from './utils/audio';

export default function App() {
  const [state, setState] = useState<ARState>({
    step: 'intro',
    selectedObject: null,
    cameraActive: false,
    cameraPermissionGranted: false,
    surfaceDetected: false,
  });

  const [isMuted, setIsMuted] = useState(false);
  const [arLogs, setArLogs] = useState<string[]>([]);

  // Function to add system logs for AR-experience feel
  const addLog = (msg: string) => {
    setArLogs((prev) => [msg, ...prev.slice(0, 4)]);
  };

  useEffect(() => {
    addLog('AR Core system loaded.');
    addLog('Terme Topolšica database active.');
  }, []);

  const handleStartAR = () => {
    audioSynth.playSelect();
    setState((prev) => ({ ...prev, step: 'scanning', cameraActive: true }));
    addLog('Requesting device camera stream...');
    addLog('Plane detection sensors calibrating...');
  };

  const handleSurfaceDetected = () => {
    if (state.step === 'scanning') {
      audioSynth.playScan();
      setState((prev) => ({ ...prev, step: 'ready_to_place', surfaceDetected: true }));
      addLog('Horizontal surface detected (Plane #1).');
      addLog('AR grid alignment calibrated (98.4% lock).');
    }
  };

  const handlePlaceWellness = () => {
    audioSynth.playPlace();
    setState((prev) => ({ ...prev, step: 'placed' }));
    addLog('Wellness platform anchored successfully.');
    addLog('Interact: tap Pool, Sauna, or Massage structures.');
  };

  const handleSelectObject = (type: WellnessType | null) => {
    setState((prev) => ({ ...prev, selectedObject: type }));
    if (type) {
      addLog(`Selected building: ${type.toUpperCase()}`);
    } else {
      addLog('Reset layout selection.');
    }
  };

  const handleReset = () => {
    audioSynth.playClose();
    setState({
      step: 'scanning',
      selectedObject: null,
      cameraActive: true,
      cameraPermissionGranted: state.cameraPermissionGranted,
      surfaceDetected: false,
    });
    setArLogs([]);
    addLog('Sensors re-calibrated.');
    addLog('Scanning for new plane surface...');
  };

  const toggleMute = () => {
    const nextMuted = audioSynth.toggleMute();
    setIsMuted(nextMuted);
  };

  // Play ambient periodic sonar clicks when in scanning phase
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state.step === 'scanning') {
      interval = setInterval(() => {
        audioSynth.playScan();
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [state.step]);

  return (
    <div className="min-h-screen bg-[#04060b] text-white font-sans flex items-center justify-center p-0 md:p-6 select-none overflow-hidden bg-gradient-to-tr from-[#020306] via-[#050914] to-[#0a1228]">
      {/* 1. Device Mockup frame on desktop, Full screen on mobile */}
      <div className="relative w-full h-screen md:h-[840px] md:max-w-[412px] md:rounded-[40px] md:border-[10px] md:border-neutral-800 md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] bg-black overflow-hidden flex flex-col">
        {/* Mobile top notch mockup on desktop */}
        <div className="hidden md:block absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-neutral-800 rounded-b-2xl z-50 pointer-events-none" />

        {/* ========================================================
            BACKGROUND: AR CAMERA FEED & SIMULATOR
            ======================================================== */}
        {state.cameraActive && (
          <CameraFeed 
            isActive={state.cameraActive} 
            onPermissionChange={(granted) => {
              setState(prev => ({ ...prev, cameraPermissionGranted: granted }));
              if (granted) {
                addLog('Local video camera permission granted.');
              } else {
                addLog('Using high-fidelity panoramic environment fallback.');
              }
            }} 
          />
        )}

        {/* ========================================================
            MIDDLEGROUND: THREE.JS 3D INTERACTIVE CANVAS
            ======================================================== */}
        {state.cameraActive && (
          <div className="absolute inset-0 z-20 pointer-events-auto">
            <ARCanvas
              step={state.step === 'intro' ? 'scanning' : state.step as any}
              selectedObject={state.selectedObject}
              onSelectObject={handleSelectObject}
              onSurfaceDetected={handleSurfaceDetected}
            />
          </div>
        )}

        {/* ========================================================
            FOREGROUND OVERLAYS: HUD / UI HEADERS & PANEL CONTROLS
            ======================================================== */}

        {/* 1. TOP HUD HEADER BAR */}
        <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
          {/* Logo / Location Info */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 border border-white/5 backdrop-blur-md pointer-events-auto shadow-md">
            <MapPin size={14} className="text-neon-blue" />
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold tracking-wider font-display text-white">
                TERME TOPOLŠICA
              </span>
              <span className="text-[8px] font-mono tracking-widest text-white/50 leading-none">
                SLOVENIA • AR CORE
              </span>
            </div>
          </div>

          {/* Sound, Logs & Reset Actions */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {/* Mute Button */}
            <button
              onClick={toggleMute}
              className="p-2 rounded-full bg-black/50 border border-white/5 text-white/80 hover:text-white backdrop-blur-md transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>

            {/* Reposition Reset Button (Visible after platform placed) */}
            {state.step === 'placed' && (
              <button
                onClick={handleReset}
                className="p-2 rounded-full bg-black/50 border border-white/5 text-neon-blue hover:text-white backdrop-blur-md transition-colors flex items-center justify-center"
                title="Reset/Reposition"
              >
                <RotateCcw size={14} className="animate-spin-slow" />
              </button>
            )}
          </div>
        </div>

        {/* 2. REALTIME AR SYSTEM LOGS (Floating left) */}
        {state.cameraActive && (
          <div className="absolute top-20 left-4 z-30 pointer-events-none flex flex-col gap-1 max-w-[200px]">
            {arLogs.map((log, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: Math.max(0.15, 0.9 - idx * 0.25) }}
                className="px-2 py-0.5 rounded-md bg-black/40 border border-white/5 text-[8px] font-mono text-neon-blue font-semibold tracking-wider backdrop-blur-[2px]"
              >
                &gt; {log}
              </motion.div>
            ))}
          </div>
        )}

        {/* 3. APP INTRO / LANDING VIEW */}
        <AnimatePresence>
          {state.step === 'intro' && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 z-50 bg-[#060a14] bg-gradient-to-b from-[#080f24] via-[#050915] to-[#020408] p-6 flex flex-col justify-between pointer-events-auto"
            >
              {/* Luxury Top Branding design */}
              <div className="flex flex-col items-center mt-12 text-center">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-neon-blue to-neon-teal p-[1px] shadow-[0_0_20px_rgba(0,240,255,0.25)] mb-4">
                  <div className="w-full h-full rounded-3xl bg-[#080d1a] flex items-center justify-center">
                    <Sparkles className="text-neon-teal animate-pulse" size={28} />
                  </div>
                </div>
                <h1 className="text-2xl font-display font-semibold tracking-tight text-white mb-1">
                  AR Wellness Explorer
                </h1>
                <p className="text-xs text-neon-blue font-mono font-bold tracking-widest uppercase">
                  Terme Topolšica
                </p>
                <div className="w-16 h-[2px] bg-gradient-to-r from-neon-blue to-neon-teal mt-4 rounded-full" />
              </div>

              {/* Middle Scenic Card */}
              <div className="my-auto px-4 py-5 rounded-2xl glass-panel border border-white/10 flex flex-col gap-4 text-center">
                <h3 className="text-sm font-semibold tracking-wider font-display text-white">
                  DIGITAL THERMAL TOUR
                </h3>
                <p className="text-xs text-white/70 leading-relaxed">
                  Step into an interactive 3D miniature showcase of Slovenia's renowned natural health spa. Scan any table or floor surface to overlay the virtual wellness platform in real space.
                </p>

                {/* Features Highlights */}
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="flex flex-col items-center p-2 rounded-lg bg-white/5 border border-white/5">
                    <Droplet size={16} className="text-neon-teal" />
                    <span className="text-[9px] font-mono text-white/60 mt-1">Pool</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-lg bg-white/5 border border-white/5">
                    <Flame size={16} className="text-amber-500" />
                    <span className="text-[9px] font-mono text-white/60 mt-1">Sauna</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-lg bg-white/5 border border-white/5">
                    <Sparkles size={16} className="text-neon-blue" />
                    <span className="text-[9px] font-mono text-white/60 mt-1">Massage</span>
                  </div>
                </div>
              </div>

              {/* Bottom Launch Button */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleStartAR}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-neon-blue to-neon-teal text-black font-semibold tracking-wider font-display hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,240,255,0.3)]"
                >
                  <Camera size={18} />
                  ACTIVATE AR CAMERA
                </button>
                <p className="text-[9px] text-center text-white/40 font-mono tracking-wider">
                  REQUIRES CAMERA PERMISSION • VER. 1.0.3 (OFFLINE)
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. SURFACE SCANNING HUD (Active when scanning) */}
        <AnimatePresence>
          {state.step === 'scanning' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-10 left-4 right-4 z-40 pointer-events-none flex flex-col items-center gap-3"
            >
              {/* Interactive Pulsing Instructions Panel */}
              <div className="px-4 py-3 rounded-xl glass-panel-heavy border border-neon-blue/30 text-center flex flex-col items-center gap-1.5 shadow-lg max-w-[320px]">
                <div className="flex items-center gap-2">
                  <Grid size={14} className="text-neon-blue animate-pulse" />
                  <span className="text-xs font-semibold text-white tracking-wide">
                    SURFACE SCAN ACTIVE
                  </span>
                </div>
                <p className="text-[10px] text-white/70 leading-normal font-mono uppercase tracking-tight">
                  Move your camera slowly around a horizontal tabletop or floor
                </p>
              </div>

              {/* Glowing blue progress spinner bar */}
              <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-neon-blue animate-pulse w-2/3 rounded-full" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 5. READY TO PLACE WELLNESS BUTTON */}
        <AnimatePresence>
          {state.step === 'ready_to_place' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute bottom-10 left-4 right-4 z-40 flex flex-col items-center gap-3"
            >
              {/* Alert: Surface detected */}
              <div className="px-3 py-1.5 rounded-full bg-neon-teal/20 border border-neon-teal/40 text-[10px] text-neon-teal font-semibold font-mono tracking-widest flex items-center gap-1.5 backdrop-blur-md animate-bounce">
                <UserCheck size={11} />
                SURFACE PLANE MATCH FOUND
              </div>

              {/* Glowing Call-to-action */}
              <button
                onClick={handlePlaceWellness}
                className="w-full max-w-[280px] py-4 rounded-xl bg-neon-teal text-black font-bold tracking-widest font-display text-sm hover:opacity-90 active:scale-95 transition-all shadow-[0_0_25px_rgba(0,245,212,0.45)] uppercase flex items-center justify-center gap-2 pointer-events-auto"
              >
                <MapPin size={16} />
                Place Wellness
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 6. PLACED STATE HUD - EXPLORING GUIDE DIRECTIONS */}
        <AnimatePresence>
          {state.step === 'placed' && !state.selectedObject && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="absolute bottom-8 left-4 right-4 z-30 pointer-events-none flex justify-center"
            >
              <div className="px-4 py-2.5 rounded-xl glass-panel border border-white/5 text-center flex items-center gap-2 shadow-md max-w-[320px]">
                <Compass size={13} className="text-neon-teal animate-spin-slow" />
                <span className="text-[10px] text-white/80 font-semibold font-mono uppercase tracking-wider">
                  Drag to Orbit • Pinch to Zoom • Tap Building to View Details
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 7. DETAILED INFORMATION GLASSMORPHISM MODAL */}
        <InfoPanel
          selectedObject={state.selectedObject}
          onClose={() => handleSelectObject(null)}
        />

        {/* 8. DEVICE FOOTER BAR IN MOBILE MOCKUP */}
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full z-40 pointer-events-none" />
      </div>
    </div>
  );
}
