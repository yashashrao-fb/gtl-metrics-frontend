import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, Lock, ShieldCheck } from "lucide-react";
import logo from "../assets/logo.png";

interface NavLink {
  label: string;
  href: string;
  active?: boolean;
}

const NAV_LINKS: NavLink[] = [
  { label: "Dashboard", href: "dashboard" },
  { label: "Flight Data", href: "flight-data" },
  { label: "Statistics", href: "statistics" },
  { label: "Reports", href: "reports" },
];

export default function Header({
  onNavigate,
  activePage = "dashboard",
  pfaEnabled = false,
}: {
  onNavigate?: (page: string) => void,
  activePage?: string,
  pfaEnabled?: boolean,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCollapsed(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const showFullNav = !isCollapsed || isHovered;
  const activeLabel = NAV_LINKS.find(link => link.href === activePage)?.label || "Menu";

  return (
    <>
      {/* Top Left Logo */}
      <div
        className="fixed top-6 left-10 z-[110] flex items-center cursor-pointer"
        onClick={() => onNavigate?.("dashboard")}
      >
        <img
          src={logo}
          alt="FlytBase"
          className="h-7 w-auto object-contain select-none"
          style={{ filter: "brightness(0) invert(1)" }}
        />
      </div>

      <header className="fixed top-0 left-0 right-0 z-[100] flex justify-center items-start pt-6 pointer-events-none">
        <motion.nav
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          layout
          transition={{ type: "spring", stiffness: 400, damping: 30, mass: 1 }}
          className="relative bg-surface/80 backdrop-blur-3xl border border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.3)] flex items-center justify-center overflow-hidden pointer-events-auto cursor-pointer h-12 rounded-full px-4"
        >
          {/* Orange Accent Glow (Bottom) */}
          <div className="absolute bottom-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-secondary to-transparent opacity-50" />
          
          <motion.div layout className="flex items-center gap-6">
            <AnimatePresence mode="wait">
              {!showFullNav ? (
                <motion.div
                  key="mini"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-3 px-2"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse shadow-[0_0_8px_#FA8500]" />
                  <span className="text-[10px] font-black text-on-surface tracking-[0.2em] uppercase opacity-80">
                    {activeLabel}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-secondary" />
                </motion.div>
              ) : (
                <motion.div
                  key="full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center"
                >
                  <div className="flex items-center gap-6">
                    {NAV_LINKS.map((link) => (
                      <button
                        key={link.label}
                        onClick={() => onNavigate?.(link.href)}
                        className={`font-headline font-bold uppercase tracking-widest text-[10px] transition-all duration-300 px-2 py-1 rounded-md ${
                          activePage === link.href
                            ? "text-primary bg-primary/10"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        {link.label}
                      </button>
                    ))}
                  </div>

                  {/* Flight Authentication — enabled/disabled by PFA setting */}
                  <div className="relative ml-6 group">
                    <button
                      onClick={() => pfaEnabled && onNavigate?.("post-flight-auth")}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-headline font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95 ${
                        pfaEnabled
                          ? activePage === "post-flight-auth"
                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                            : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50"
                          : "bg-zinc-800/60 border border-white/5 text-zinc-600 cursor-not-allowed"
                      }`}
                    >
                      {pfaEnabled
                        ? <ShieldCheck className="w-3 h-3" />
                        : <Lock className="w-3 h-3" />
                      }
                      Flight Auth
                    </button>

                    {/* Tooltip when disabled */}
                    {!pfaEnabled && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-zinc-900 border border-white/10 rounded-xl text-[9px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50">
                        Enable in Settings
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 border-l border-t border-white/10 rotate-45" />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.nav>
      </header>
    </>
  );
}
