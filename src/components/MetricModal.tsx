import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

interface MetricModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  value: string;
  subtitle: string;
  style: "vertical" | "radial" | "horizontal";
}

function KineticBackground({ style }: { style: "vertical" | "radial" | "horizontal" }) {
  if (style === "vertical") {
    return (
      <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute inset-0 flex justify-between px-4">
          {Array.from({ length: 40 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: ["20%", "80%", "40%"] }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.05,
              }}
              className="w-[1px] bg-primary"
            />
          ))}
        </div>
      </div>
    );
  }

  if (style === "horizontal") {
    return (
      <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute inset-0 flex flex-col justify-between py-6">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ width: 0 }}
              animate={{ width: ["10%", "90%", "30%"] }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.1,
              }}
              className="h-[1px] bg-primary"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
      <div className="absolute top-0 left-0 w-full h-full">
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i / 24) * 360;
          return (
            <motion.div
              key={i}
              style={{
                top: "0%",
                left: "0%",
                rotate: angle,
                transformOrigin: "top left",
              }}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.1,
              }}
              className="absolute w-[800px] h-[1px] bg-primary"
            />
          );
        })}
      </div>
    </div>
  );
}

export default function MetricModal({ isOpen, onClose, title, value, subtitle, style }: MetricModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="relative bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-2xl aspect-video overflow-hidden shadow-[0_0_100px_rgba(44,123,242,0.15)] flex flex-col justify-center items-center text-center p-12"
          >
            <KineticBackground style={style} />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-white transition-all z-20 group"
            >
              <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            </button>

            {/* Label */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute top-12 left-12 text-left"
            >
              <span className="text-zinc-500 text-[10px] uppercase tracking-[0.4em] font-black">{title}</span>
              <div className="w-8 h-0.5 bg-primary mt-2" />
            </motion.div>

            {/* Main Metric Value */}
            <div className="relative z-10 flex items-center">
              <motion.h1 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  duration: 0.8, 
                  type: "spring", 
                  stiffness: 100, 
                  damping: 15 
                }}
                className="font-headline font-black text-9xl md:text-[14rem] text-on-surface tracking-tighter leading-none"
              >
                {value}
              </motion.h1>
            </div>

            {/* Subtitle / Description */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="absolute bottom-12 right-12 text-right"
            >
              <p className="text-primary text-sm font-label tracking-widest uppercase mb-1">{subtitle}</p>
              <p className="text-zinc-600 text-[9px] uppercase tracking-widest">Real-time Telemetry Active</p>
            </motion.div>

            {/* Bottom Accent */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-30" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
