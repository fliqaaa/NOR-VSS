/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, AlertCircle, RefreshCw } from 'lucide-react';

interface CameraFeedProps {
  onPermissionChange: (granted: boolean) => void;
  isActive: boolean;
}

export default function CameraFeed({ onPermissionChange, isActive }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamState, setStreamState] = useState<'requesting' | 'active' | 'fallback' | 'denied'>('requesting');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!isActive) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isActive]);

  const startCamera = async () => {
    setStreamState('requesting');
    setErrorMessage('');
    
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access API is not supported by this browser.');
      }

      // Try for environment (rear) camera, fallback to user camera if not present
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((e) => console.log('Video play interrupted:', e));
      }
      
      setStreamState('active');
      onPermissionChange(true);
    } catch (err: any) {
      console.warn('Camera feed failed or was denied:', err);
      // Graceful fallback to rich animated background
      setStreamState('fallback');
      onPermissionChange(false);
      setErrorMessage(err?.message || 'Permission denied or camera in use.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-black overflow-hidden select-none">
      {/* 1. Real Video Stream */}
      {streamState === 'active' && (
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* 2. Realistic Simulated AR Background (Fallback when browser camera is blocked/iframe-sandboxed) */}
      {(streamState === 'fallback' || streamState === 'requesting') && (
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          {/* Stunning Slovenian mountains and thermal park scenic background */}
          <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center opacity-85 scale-105 animate-pulse-slow"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1920&q=80')`,
              animationDuration: '10s'
            }}
          />
          
          {/* Subtle noise grain & scanning lines for high-tech AR camera texture */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.6)_100%)] opacity-85" />
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%] opacity-20" />

          {/* Fallback floating status alert */}
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-white/10 text-[10px] text-white/60 font-mono tracking-wider backdrop-blur-md">
            {streamState === 'requesting' ? (
              <>
                <RefreshCw size={11} className="animate-spin text-neon-blue" />
                <span>CONNECTING VIEWPORT CAMERA...</span>
              </>
            ) : (
              <>
                <CameraOff size={11} className="text-amber-400" />
                <span>AR ENVIRONMENT SIMULATOR ACTIVE</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* AR Viewfinder UI Accents (Corner brackets and crosshair) */}
      <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
        {/* Top corner brackets */}
        <div className="flex justify-between">
          <div className="w-6 h-6 border-t-2 border-l-2 border-neon-blue/40 rounded-tl-sm" />
          <div className="w-6 h-6 border-t-2 border-r-2 border-neon-blue/40 rounded-tr-sm" />
        </div>

        {/* Center Crosshair indicator */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <div className="w-8 h-8 border border-white/10 rounded-full flex items-center justify-center">
            <div className="w-1 h-1 bg-neon-blue rounded-full shadow-[0_0_8px_#00f0ff]" />
          </div>
        </div>

        {/* Bottom corner brackets */}
        <div className="flex justify-between">
          <div className="w-6 h-6 border-b-2 border-l-2 border-neon-blue/40 rounded-bl-sm" />
          <div className="w-6 h-6 border-b-2 border-r-2 border-neon-blue/40 rounded-br-sm" />
        </div>
      </div>
    </div>
  );
}
