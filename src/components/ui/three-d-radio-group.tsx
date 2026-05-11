import React from "react";
import { motion } from "motion/react";

interface ThreeDRadioGroupProps {
  options: { label: string; value: string }[];
  value: string;
  onValueChange: (value: string) => void;
}

export default function ThreeDRadioGroup({ options, value, onValueChange }: ThreeDRadioGroupProps) {
  return (
    <div className="flex bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-1.5 gap-1 relative overflow-hidden">
      {options.map((option) => {
        const isActive = value === option.value;
        
        return (
          <button
            key={option.value}
            onClick={() => onValueChange(option.value)}
            className="relative flex-1 px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all outline-none group"
            style={{ perspective: "1000px" }}
          >
            {isActive && (
              <motion.div
                layoutId="active-bg-3d"
                className="absolute inset-0 bg-blue-900/40 backdrop-blur-md rounded-xl border border-white/10 shadow-[0_12px_24px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)]"
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                  mass: 1
                }}
              >
                {/* 3D bevel and frosty glass layers */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 via-transparent to-black/20" />
                <div className="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_50%_0%,rgba(44,123,242,0.2),transparent_70%)]" />
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/40 rounded-b-xl" />
              </motion.div>
            )}
            
            <motion.span
              animate={{
                color: isActive ? "#ffffff" : "#71717a",
                translateZ: isActive ? 10 : 0
              }}
              className="relative z-10 block"
            >
              {option.label}
            </motion.span>
            
            {/* Hover shadow effect */}
            {!isActive && (
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity" />
            )}
          </button>
        );
      })}
    </div>
  );
}
