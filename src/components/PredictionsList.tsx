import React, { useState, useEffect } from "react";
import { Prediction, Package, Subscription } from "../types";
import { 
  ShieldAlert, Lock, Crown, CheckCircle2, XCircle, Clock, 
  Percent, ListFilter, Award, Calendar, Check, Play, ArrowRight, BookOpen, AlertCircle
} from "lucide-react";

interface PredictionsListProps {
  predictions: Prediction[];
  packages: Package[];
  activeSubscriptions: Subscription[];
  userId: string;
  onSubscribeClick: (pkg: Package) => void;
}

const bookmakerConfig: Record<string, { 
  name: string; 
  author: string; 
  color: string; 
  initial: string; 
  bg: string; 
  defaultOdds: string; 
  stake: number; 
  accuracy: string;
  logoColor: string;
}> = {
  odds5: { 
    name: "SportyBet", 
    author: "Premium Verified Source", 
    color: "text-[#E31C24]", 
    initial: "S", 
    bg: "bg-[#E31C24]", 
    defaultOdds: "10.30", 
    stake: 6000,
    accuracy: "94.8% Win Ratio",
    logoColor: "#E31C24"
  },
  odds10: { 
    name: "BetPawa", 
    author: "Elite AI Predictor", 
    color: "text-[#00B027]", 
    initial: "bP", 
    bg: "bg-[#00B027]", 
    defaultOdds: "12.35", 
    stake: 6000,
    accuracy: "92.4% Win Ratio",
    logoColor: "#00B027"
  },
  odds20: { 
    name: "1XBet", 
    author: "Tactical VIP Scout", 
    color: "text-[#0087CD]", 
    initial: "1X", 
    bg: "bg-[#0087CD]", 
    defaultOdds: "22.40", 
    stake: 10000,
    accuracy: "91.2% Win Ratio",
    logoColor: "#0087CD"
  },
  odds30: { 
    name: "BetWay", 
    author: "VIP Golden Match Maker", 
    color: "text-[#FFFFFF]", 
    initial: "W", 
    bg: "bg-[#181C20]", 
    defaultOdds: "35.10", 
    stake: 15000,
    accuracy: "96.5% Win Ratio",
    logoColor: "#00E676"
  }
};

// Vectorized high-fidelity betting brand icons
function CompanyLogo({ pkgId, name, logoColor }: { pkgId: string; name: string; logoColor: string }) {
  if (pkgId === "odds5") {
    // SportyBet red modern circle holding dynamic football
    return (
      <div className="relative w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-red-600 via-red-700 to-black p-0.5 shadow-lg border border-red-500/20">
        <svg viewBox="0 0 100 100" className="w-10 h-10 text-white fill-current">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="6" />
          <path d="M50 20 L50 80 M20 50 L80 50" stroke="currentColor" strokeWidth="4" />
          <circle cx="50" cy="50" r="16" fill="currentColor" />
          <path d="M30 30 L70 70 M30 70 L70 30" stroke="currentColor" strokeWidth="4" />
        </svg>
        <span className="absolute -bottom-1 -right-1 bg-red-600 px-1 py-0.2 rounded text-[8px] font-black border border-zinc-950 font-mono text-white">SBT</span>
      </div>
    );
  }
  if (pkgId === "odds10") {
    // BetPawa dynamic field background shape with typography bP
    return (
      <div className="relative w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#00E676]/90 via-[#00B027] to-[#121212] p-0.5 shadow-lg border border-[#00E676]/20">
        <svg viewBox="0 0 100 100" className="w-10 h-10 text-black fill-current font-black">
          <path d="M25 75 L25 25 C25 25 50 15 65 30 C80 45 65 60 50 60 L37 60 L37 75 Z" fill="currentColor" />
          <circle cx="52" cy="42" r="10" fill="#000000" />
        </svg>
        <span className="absolute -bottom-1 -right-1 bg-[#00B027] px-1 py-0.2 rounded text-[8px] font-black border border-zinc-950 font-mono text-black">PAWA</span>
      </div>
    );
  }
  if (pkgId === "odds20") {
    // 1XBet royal blue brand badge
    return (
      <div className="relative w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#0087CD] via-[#005FA3] to-zinc-950 p-0.5 shadow-lg border border-[#0087CD]/20">
        <svg viewBox="0 0 100 100" className="w-10 h-10 text-white fill-current">
          <polygon points="20,80 35,20 55,20 40,80" />
          <polygon points="50,80 65,20 85,20 70,80" className="opacity-80" />
          <circle cx="75" cy="30" r="10" className="text-yellow-400" />
        </svg>
        <span className="absolute -bottom-1 -right-1 bg-[#0087CD] px-1 py-0.2 rounded text-[8px] font-black border border-zinc-950 font-mono text-white">1XB</span>
      </div>
    );
  }
  // BetWay bold absolute matte black sphere
  return (
    <div className="relative w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#1c242e] via-zinc-950 to-black p-0.5 shadow-lg border border-zinc-700">
      <svg viewBox="0 0 100 100" className="w-9 h-9 text-[#00E676] fill-none stroke-current" strokeWidth="8">
        <path d="M15 30 L35 75 L50 40 L65 75 L85 30" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="absolute -bottom-1 -right-1 bg-[#00E676] px-1 py-0.2 rounded text-[8px] font-black border border-zinc-950 font-mono text-black">WAY</span>
    </div>
  );
}

export default function PredictionsList({
  predictions,
  packages,
  activeSubscriptions,
  userId,
  onSubscribeClick
}: PredictionsListProps) {
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [timeString, setTimeString] = useState("10h 02m 23s");

  // Carousel slider images
  const slides = [
    {
      image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=85&w=1200",
      title: "⚽ Professional Football Predictions",
      subtitle: "Join over 25,000 daily winners across Tanzania with premium handpicked slips."
    },
    {
      image: "https://images.unsplash.com/photo-1540747737956-378724044af1?auto=format&fit=crop&q=85&w=1200",
      title: "⚡ Tanzanian PesaPal Auto-activation",
      subtitle: "Activate and unmask matched slips instantly via fully automatic local mobile money tokens."
    },
    {
      image: "https://images.unsplash.com/photo-1518063319789-7217e6706b04?auto=format&fit=crop&q=85&w=1200",
      title: "📈 Master Matched Odds Analytics Today",
      subtitle: "Our deep neural computer models calculate direct halftime/fulltime outcomes over 92% accurate."
    }
  ];

  // Auto-rotate slider
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Live countdown to midnight (matching "Expires in 10h 02m 23s" visual high-fidelity)
  useEffect(() => {
    const updateCountdown = () => {
      const tomorrow = new Date();
      tomorrow.setHours(24, 0, 0, 0); // Next 12am midnight
      const diff = tomorrow.getTime() - Date.now();
      
      if (diff <= 0) {
        setTimeString("00h 00m 00s");
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeString(
        `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check if subscribed to specific tier package
  const isSubscribedTo = (pkgId: string) => {
    return activeSubscriptions.some(
      sub => sub.package_id === pkgId && 
             sub.status === "active" && 
             new Date(sub.expiry_date).getTime() > Date.now()
    );
  };

  const getSubExpirationText = (pkgId: string) => {
    const sub = activeSubscriptions.find(
      s => s.package_id === pkgId && s.status === "active" && new Date(s.expiry_date).getTime() > Date.now()
    );
    if (!sub) return "";
    
    const diff = new Date(sub.expiry_date).getTime() - Date.now();
    const hours = Math.round(diff / (1000 * 60 * 60));
    
    if (hours > 24) {
      const days = Math.round(hours / 24);
      return `${days} Days Left`;
    }
    return `${hours} Hrs Left`;
  };

  // Helper dynamic odds multiplier
  const getDynamicOdds = (pkgId: string, defaultOdds: string) => {
    const matching = predictions.filter(p => p.package_id === pkgId);
    if (matching.length === 0) return defaultOdds;
    const multiplied = matching.reduce((acc, p) => acc * p.odds, 1);
    return multiplied > 1 ? multiplied.toFixed(2) : defaultOdds;
  };

  const getStatusBadge = (status: "pending" | "won" | "lost") => {
    switch (status) {
      case "won":
        return (
          <span className="inline-flex items-center gap-1 bg-green-500/10 border border-green-500/30 text-[#00E676] font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
            ✓ WON
          </span>
        );
      case "lost":
        return (
          <span className="inline-flex items-center gap-1 bg-red-500/10 border border-red-500/30 text-red-500 font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
            ✗ LOST
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
            ● PENDING match
          </span>
        );
    }
  };

  return (
    <div className="space-y-8" id="predictions-center-module">
      
      {/* 1. PREMIUM ROTATING BANNER SLIDER GRAPHIC (Matching top header on mobile) */}
      <div className="relative rounded-3xl overflow-hidden h-44 sm:h-56 md:h-64 border border-zinc-900 shadow-2xl bg-black">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent z-10"></div>
        
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 flex flex-col justify-end p-5 md:p-8 z-0 ${
              idx === currentSlide ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
            }`}
          >
            {/* Background Image with ReferrerPolicy */}
            <img
              src={slide.image}
              alt={slide.title}
              className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-luminosity hover:mix-blend-normal transition-all duration-700"
              referrerPolicy="no-referrer"
            />
            
            <div className="relative z-20 space-y-1.5 max-w-xl animate-fade-in text-left">
              <h3 className="text-base sm:text-lg md:text-xl font-black text-white uppercase tracking-tight font-display drop-shadow">
                {slide.title}
              </h3>
              <p className="text-[10px] sm:text-xs text-zinc-300 leading-normal font-sans">
                {slide.subtitle}
              </p>
            </div>
          </div>
        ))}

        {/* Carousel Pagination Indicator Dots */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-25">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentSlide ? "w-6 bg-[#00E676]" : "w-1.5 bg-zinc-600"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* 2. TABULAR HEADER LOGS IN FRONT */}
      <div className="flex justify-between items-center bg-zinc-950/20 py-2 border-b border-zinc-900/60">
        <div className="flex items-center gap-2">
          <span className="text-md sm:text-lg font-black text-white flex items-center gap-1.5 font-display tracking-tight uppercase">
            🔥 Premium Active Betslips
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#00E676] font-mono font-bold bg-[#00E676]/10 border border-[#00E676]/20 px-3 py-1 rounded-full">
          <span className="h-1.5 w-1.5 bg-[#00E676] rounded-full animate-ping"></span>
          <span>4 Live Tips Available</span>
        </div>
      </div>

      {/* 3. VERIFIED BOOKMAKER ACTIVE BETSLIPS (STACKED CARDS STYLE MATCHING USER SCREENSHOT) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="betslip-stack-grid">
        {packages.map(pkg => {
          const config = bookmakerConfig[pkg.id] || bookmakerConfig.odds5;
          const isSubscribed = isSubscribedTo(pkg.id);
          const pkgPredictions = predictions.filter(p => p.package_id === pkg.id);
          const calcOdds = getDynamicOdds(pkg.id, config.defaultOdds);
          const stake = config.stake;

          return (
            <div
              key={pkg.id}
              className="bg-[#0D0F12] rounded-2xl p-6 border border-zinc-900 hover:border-[#00E676]/45 transition-all duration-300 text-left flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.8)] relative group"
              id={`slip-pack-${pkg.id}`}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#00E676]/2 rounded-full filter blur-2xl group-hover:bg-[#00E676]/5 transition-all"></div>

              {/* Row 1: Bookmaker Logo + Verified Badge + Odds */}
              <div className="flex items-center justify-between border-b border-zinc-900/80 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <CompanyLogo pkgId={pkg.id} name={config.name} logoColor={config.logoColor} />
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-base font-black text-white font-sans tracking-tight leading-none">{config.name}</span>
                      <span className="bg-[#00E676]/10 text-[#00E676] p-0.5 rounded-full" title="TPS Verified Tip">
                        <Check size={11} strokeWidth={4} />
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#00E676] font-mono block mt-1.5">
                      {config.accuracy}
                    </span>
                  </div>
                </div>

                {/* ODDS BOX (Styled like premium bet indicators) */}
                <div className="border border-[#00E676]/20 bg-[#00E676]/5 rounded-xl px-4 py-1.5 text-center min-w-[85px] shadow-[0_0_10px_rgba(0,230,118,0.05)]">
                  <span className="block text-[8px] uppercase font-bold text-zinc-400 font-mono tracking-widest leading-none">TOTAL ODDS</span>
                  <span className="text-[#00E676] font-black font-mono text-base sm:text-lg mt-1 block leading-tight">
                    {calcOdds}
                  </span>
                </div>
              </div>

              {/* Row 2: Stake + Price & Countdown timer */}
              <div className="grid grid-cols-2 gap-4 border-b border-zinc-900/80 pb-4 mb-4 font-mono">
                <div>
                  <span className="text-[9px] uppercase font-semibold tracking-wider text-zinc-500 block">Pricing (Unmask Pass)</span>
                  <span className="text-xs sm:text-sm font-black text-white mt-1 block font-mono">
                    TZS {pkg.price.toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase font-semibold tracking-wider text-zinc-500 block">Starts In / Expires</span>
                  <span className="text-xs font-black text-[#00E676] mt-1 block tracking-wider animate-pulse font-mono">
                    {timeString}
                  </span>
                </div>
              </div>

              {/* Row 3: Accuracy Indicator Badge + View detailed tip button */}
              <div className="flex justify-between items-center h-10">
                <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-[10px] text-zinc-300 font-mono uppercase tracking-wider font-extrabold">
                  <span className="h-1.5 w-1.5 bg-[#00E676] rounded-full animate-ping"></span>
                  <span>{config.author}</span>
                </div>

                <div className="flex items-center gap-2">
                  {isSubscribed && (
                    <span className="text-[9px] px-2 py-1 rounded-md bg-emerald-500/10 text-[#00E676] border border-emerald-500/20 uppercase tracking-wider font-mono font-bold leading-none h-fit">
                      {getSubExpirationText(pkg.id)}
                    </span>
                  )}
                  <button
                    onClick={() => setSelectedPkg(pkg)}
                    className="bg-[#00E676] hover:bg-[#00C853] text-black px-5 py-2.5 rounded-xl font-black text-xxs sm:text-xs transition-all duration-300 hover:scale-103 shadow-lg shadow-[#00E676]/10 uppercase tracking-wide flex items-center gap-1 cursor-pointer"
                    id={`view-slip-action-${pkg.id}`}
                  >
                    <span>View Betslip →</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. MODAL DRAWER OVERLAY DETAILED PREDICTIONS SHEETS */}
      {selectedPkg && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 animate-fade-in" id="betslip-detail-overlay">
          <div className="bg-[#0A0C0E] border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden relative shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Header branding info */}
            <div className="bg-[#12151A] p-5 border-b border-zinc-900 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <CompanyLogo pkgId={selectedPkg.id} name={selectedPkg.name} logoColor="#00E676" />
                <div>
                  <h3 className="text-sm font-black text-white font-display uppercase tracking-tight">
                    {selectedPkg.name} PREDICTION SLIP
                  </h3>
                  <p className="text-[10px] uppercase font-bold text-[#00E676] font-mono tracking-wider">
                    Target {selectedPkg.odds_target}+ Odds • HIGH ACCURACY
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setSelectedPkg(null)}
                className="text-zinc-500 hover:text-white p-2 bg-zinc-900 rounded-full transition-all text-xs font-bold leading-none cursor-pointer"
                aria-label="Close detailed slip View"
                id="close-slip-details-btn"
              >
                ✕
              </button>
            </div>

            {/* Content viewport area */}
            <div className="p-5 overflow-y-auto space-y-6 scrollbar-thin flex-1 text-left">
              
              {/* IF NOT VIP SUBSCRIBED: Mask matches lists and present beautiful PesaPal prompt */}
              {!isSubscribedTo(selectedPkg.id) ? (
                <div className="py-6 text-center space-y-5 animate-fade-in">
                  
                  {/* Visual Lock */}
                  <div className="p-4 bg-[#00E676]/10 border border-[#00E676]/20 text-[#00E676] rounded-full w-fit mx-auto animate-pulse">
                    <Lock size={32} />
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-zinc-100 font-extrabold text-base uppercase tracking-tight font-display text-transparent bg-clip-text bg-gradient-to-r from-[#00E676] to-white">
                      Prediction Slip Is Locked!
                    </h4>
                    <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed font-sans">
                      This is a <strong>Premium VIP {selectedPkg.name} slip</strong>. Get instant access to soccer match selections backed by master tipping algorithms.
                    </p>
                  </div>

                  {/* Highlights checklist */}
                  <div className="bg-black border border-zinc-900 rounded-xl p-4 text-left max-w-sm mx-auto space-y-2.5 text-xs font-sans">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Check size={12} className="text-[#00E676] stroke-[3]" />
                      <span>Unlock exact Soccer match placements & leagues</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Check size={12} className="text-[#00E676] stroke-[3]" />
                      <span>Access correct predictions with real-time odds</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Check size={12} className="text-[#00E676] stroke-[3]" />
                      <span>Read premium match analytical projections</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Check size={12} className="text-[#00E676] stroke-[3]" />
                      <span>24-Hour VIP pass starts immediately upon payment</span>
                    </div>
                  </div>

                  {/* Pricing action button and checkout triggers */}
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setSelectedPkg(null);
                        onSubscribeClick(selectedPkg);
                      }}
                      className="w-full max-w-sm py-3.5 bg-[#00E676] hover:bg-[#00C853] text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      id="unlock-now-inside-modal"
                    >
                      <Crown size={14} />
                      <span>Unlock for TZS {selectedPkg.price.toLocaleString()}</span>
                    </button>
                    <span className="block text-[10px] text-zinc-500 mt-2 font-mono">
                      Payments securely processed via automated Tanzania PesaPal mobile APIs.
                    </span>
                  </div>

                </div>
              ) : (
                /* OTHERWISE: VIP CLIENT ACCESS - Show unmasked match results lists */
                <div className="space-y-5 animate-fade-in text-left">
                  <div className="bg-[#00E676]/10 border border-[#00E676]/20 p-4 rounded-xl text-[#00E676] text-xs flex items-center gap-2 justify-center font-bold font-mono">
                    <CheckCircle2 size={14} className="animate-bounce text-[#00E676]" />
                    <span>YOUR VIP {selectedPkg.name} TICKET ACCESS IS UNLOCKED</span>
                  </div>

                  {/* Table lists matching package */}
                  {predictions.filter(p => p.package_id === selectedPkg.id).length === 0 ? (
                    <div className="py-12 text-center text-zinc-500 text-xs italic">
                      Predictions are currently being selected by advisors. Check back shortly.
                    </div>
                  ) : (
                    predictions.filter(p => p.package_id === selectedPkg.id).map(pred => (
                      <div 
                        key={pred.id} 
                        className="bg-black border border-zinc-900 rounded-xl p-4 space-y-3 hover:border-[#00E676]/30 transition-all duration-300"
                        id={`modal-pred-item-${pred.id}`}
                      >
                        {/* League & Kickoff headers */}
                        <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
                          <span className="text-[#00E676] font-extrabold uppercase">{pred.league}</span>
                          <span className="flex items-center gap-1 uppercase">
                            <Calendar size={10} />
                            {new Date(pred.match_time).toLocaleDateString("en-TZ", {
                              hour: "2-digit", 
                              minute: "2-digit"
                            })}
                          </span>
                        </div>

                        {/* Matchup */}
                        <h4 className="text-sm font-black text-zinc-100 font-display">
                          {pred.home_team} <span className="text-zinc-500 font-normal text-xs">vs</span> {pred.away_team}
                        </h4>

                        {/* Analysis info block */}
                        {pred.analysis && (
                          <p className="text-xxs text-zinc-400 bg-zinc-950 p-3 rounded-lg leading-relaxed font-sans border border-zinc-900">
                            {pred.analysis}
                          </p>
                        )}

                        {/* Outcomes & Tip badge */}
                        <div className="grid grid-cols-3 gap-2 bg-zinc-950 p-3 rounded-lg border border-zinc-90 w-full font-mono text-center items-center">
                          <div>
                            <span className="text-[8px] text-zinc-500 uppercase font-extrabold block">Bet Tip</span>
                            <span className="text-xxs text-white font-bold block mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{pred.prediction}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-zinc-500 uppercase font-extrabold block">Odds</span>
                            <span className="text-xxs text-[#00E676] font-black block mt-0.5 font-mono">{pred.odds.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-zinc-500 uppercase font-extrabold block">Result Status</span>
                            <span className="block mt-0.5 font-sans">{getStatusBadge(pred.status)}</span>
                          </div>
                        </div>

                      </div>
                    ))
                  )}
                </div>
              )}

            </div>

            {/* Dialog Footer */}
            <div className="bg-[#12151A] p-4.5 border-t border-zinc-900 text-center shrink-0">
              <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest leading-none">
                SAPC Premium Soccer Scout Networks • (18+)
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
