/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Clock, Thermometer, Sparkles, Heart } from 'lucide-react';
import { WellnessType } from '../types';
import { wellnessData } from '../data';
import { audioSynth } from '../utils/audio';

interface InfoPanelProps {
  selectedObject: WellnessType | null;
  onClose: () => void;
}

export default function InfoPanel({ selectedObject, onClose }: InfoPanelProps) {
  const data = selectedObject ? wellnessData[selectedObject] : null;

  const handleClose = () => {
    audioSynth.playClose();
    onClose();
  };

  return (
    <AnimatePresence>
      {data && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-6 left-4 right-4 md:left-auto md:right-6 md:top-20 md:bottom-auto md:w-[380px] z-50 rounded-2xl glass-panel-heavy shadow-2xl overflow-hidden border border-white/10 flex flex-col pointer-events-auto"
        >
          {/* Header Image with Neon Vignette Overlay */}
          <div className="relative h-44 w-full overflow-hidden select-none">
            <img
              src={data.imageUrl}
              alt={data.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080c18] via-transparent to-black/40" />
            
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-white/80 hover:text-white hover:bg-black/80 border border-white/10 transition-colors pointer-events-auto shadow-md"
            >
              <X size={18} />
            </button>

            {/* Glowing Accent Badge */}
            <div className="absolute bottom-3 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neon-blue/25 border border-neon-blue/40 backdrop-blur-md">
              <Sparkles size={11} className="text-neon-blue" />
              <span className="text-[10px] uppercase tracking-widest font-mono text-neon-blue font-semibold">
                Interactive Info
              </span>
            </div>
          </div>

          {/* Panel Body Content */}
          <div className="p-5 flex-1 overflow-y-auto max-h-[300px] md:max-h-[420px] flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-display font-semibold text-white tracking-tight leading-snug">
                {data.title}
              </h2>
              <p className="text-xs text-neon-teal font-mono font-medium tracking-wide uppercase mt-0.5">
                {data.subtitle}
              </p>
            </div>

            <p className="text-xs text-white/75 leading-relaxed">
              {data.description}
            </p>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 bg-white/5 border border-white/5 p-3 rounded-xl">
              {data.metrics.map((metric, idx) => (
                <div key={idx} className="text-center flex flex-col items-center justify-center py-1">
                  <span className="text-[10px] text-white/50 uppercase tracking-wider font-mono">
                    {metric.label}
                  </span>
                  <span className="text-xs font-mono font-semibold text-white mt-0.5 flex items-center gap-1">
                    {metric.label.toLowerCase() === 'stay' || metric.label.toLowerCase() === 'duration' ? (
                      <Clock size={11} className="text-neon-teal shrink-0" />
                    ) : metric.label.toLowerCase() === 'temp' ? (
                      <Thermometer size={11} className="text-neon-teal shrink-0" />
                    ) : (
                      <Heart size={11} className="text-neon-teal shrink-0" />
                    )}
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Benefits Checklist */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-white/40 uppercase tracking-widest font-mono">
                Key Benefits:
              </span>
              <div className="flex flex-col gap-1.5">
                {data.benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-white/90">
                    <div className="w-4 h-4 rounded-full bg-neon-teal/10 border border-neon-teal/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={10} className="text-neon-teal" />
                    </div>
                    <span className="capitalize">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Luxury CTA */}
          <div className="p-4 bg-black/40 border-t border-white/5 flex items-center justify-between">
            <span className="text-[10px] text-white/40 uppercase font-mono tracking-widest">
              Terme Topolšica Wellness
            </span>
            <button
              onClick={handleClose}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-neon-blue to-neon-teal text-black font-semibold text-xs transition-all hover:opacity-90 active:scale-95 shadow-[0_0_15px_rgba(0,240,255,0.2)]"
            >
              Close Guide
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
