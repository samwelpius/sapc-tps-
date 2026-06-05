import React, { useState, useEffect } from "react";
import { Ad } from "../types";
import { X, Play, Volume2, Award, Zap } from "lucide-react";

interface AdDisplayProps {
  type: "banner" | "popup" | "video";
  ads: Ad[];
  enabled: boolean;
  onAdCompleted?: () => void;
}

export default function AdDisplay({ type, ads, enabled, onAdCompleted }: AdDisplayProps) {
  // Completely disabled and removed as requested by the user
  return null;

  const [activeAd, setActiveAd] = useState<Ad | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [videoTimer, setVideoTimer] = useState(5);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [rewardGranted, setRewardGranted] = useState(false);

  useEffect(() => {
    if (!enabled || ads.length === 0) {
      setActiveAd(null);
      return;
    }

    const matchedAds = ads.filter(a => a.type === type && a.active);
    if (matchedAds.length > 0) {
      // Pick random active ad for the slot
      const randomAd = matchedAds[Math.floor(Math.random() * matchedAds.length)];
      setActiveAd(randomAd);

      if (type === "popup") {
        const timer = setTimeout(() => {
          setShowPopup(true);
        }, 1500); // show popup after 1.5s
        return () => clearTimeout(timer);
      }
    }
  }, [type, ads, enabled]);

  // Video counter
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (type === "video" && videoPlaying && videoTimer > 0) {
      interval = setInterval(() => {
        setVideoTimer(prev => prev - 1);
      }, 1000);
    } else if (type === "video" && videoPlaying && videoTimer === 0 && !rewardGranted) {
      setRewardGranted(true);
      if (onAdCompleted) {
        onAdCompleted();
      }
    }
    return () => clearInterval(interval);
  }, [type, videoPlaying, videoTimer, rewardGranted]);

  if (!enabled || !activeAd) return null;

  // Render Banner Ad
  if (type === "banner") {
    return (
      <a
        href={activeAd.destination_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full bg-zinc-900 border border-amber-500/20 rounded-xl overflow-hidden hover:border-amber-500/50 transition-all duration-300 shadow-md group my-4"
        id={`ad-banner-${activeAd.id}`}
      >
        <div className="flex flex-col md:flex-row items-center">
          <div className="relative w-full md:w-1/3 h-32 md:h-24 bg-zinc-800 overflow-hidden">
            <img
              src={activeAd.image_url}
              alt={activeAd.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-2 left-2 bg-amber-500 text-xs text-black font-semibold uppercase px-1.5 py-0.5 rounded tracking-wide font-mono shadow-sm">
              Sponsor Ad
            </div>
          </div>
          <div className="p-4 flex-1 text-left">
            <h4 className="text-amber-400 font-semibold text-sm md:text-base leading-tight group-hover:text-amber-300 transition-colors">
              {activeAd.title}
            </h4>
            <p className="text-xs text-zinc-400 mt-1">
              Click to receive mega booster rewards, higher odds incentives, and register with our partner for standard sign up bonus.
            </p>
          </div>
          <div className="px-4 pb-4 md:pb-0 md:pr-6">
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black text-xs font-bold rounded-lg hover:from-amber-400 hover:to-amber-500 transition-colors uppercase tracking-wider">
              Join Sponsor
            </span>
          </div>
        </div>
      </a>
    );
  }

  // Render Popup Ad
  if (type === "popup" && showPopup) {
    return (
      <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fade-in" id="ad-popup-wrapper">
        <div className="bg-zinc-950 border-2 border-amber-500 rounded-2xl w-full max-w-md relative overflow-hidden shadow-2xl">
          {/* Close button */}
          <button
            onClick={() => setShowPopup(false)}
            className="absolute top-3 right-3 text-zinc-400 hover:text-amber-500 transition-colors p-1.5 bg-black/50 rounded-full z-10"
            aria-label="Close Ad"
            id="ad-close-btn"
          >
            <X size={18} />
          </button>

          {/* Ad Image / Graphics */}
          <div className="h-48 relative bg-zinc-900">
            <img
              src={activeAd.image_url}
              alt={activeAd.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>
            <div className="absolute bottom-3 left-4">
              <span className="bg-amber-500 text-black font-bold text-xxs uppercase px-2 py-0.5 rounded font-mono shadow">
                VIP ADS TIP
              </span>
            </div>
          </div>

          {/* Ad Content */}
          <div className="p-6 text-center">
            <Zap className="h-8 w-8 text-amber-400 mx-auto mb-2 animate-pulse" />
            <h3 className="text-amber-400 text-xl font-bold font-sans tracking-tight">
              {activeAd.title}
            </h3>
            <p className="text-sm text-zinc-300 mt-2 leading-relaxed">
              Unlock the maximum earning threshold today! Unlock high confidence ODDS 30 predictions or sign up with our premier sponsor to double your virtual deposit today.
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <a
                href={activeAd.destination_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowPopup(false)}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold text-sm tracking-wide rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/20 uppercase"
              >
                Claim Mega Bonus Now
              </a>
              <button
                onClick={() => setShowPopup(false)}
                className="w-full py-2.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Continue to SAPC TPS Tips
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Video Sponsor Ad
  if (type === "video") {
    return (
      <div className="w-full bg-zinc-900 border border-amber-500/30 rounded-2xl p-6 text-center my-6" id="sponsor-video-ad">
        <div className="flex items-center gap-2 justify-center mb-3 text-amber-400 text-xs uppercase tracking-widest font-mono">
          <Zap size={14} className="animate-spin" />
          <span>Sponsored Video Booster</span>
        </div>

        <h4 className="text-zinc-100 font-bold mb-2">Watch a 5-Second Sponsor Video to Help Developers</h4>
        <p className="text-xs text-zinc-400 mb-4 max-w-sm mx-auto">
          Support SAPC TPS and complete validation of your temporary vip credits in seconds!
        </p>

        {!videoPlaying ? (
          <button
            onClick={() => setVideoPlaying(true)}
            className="px-6 py-3 bg-zinc-800 text-amber-400 border border-amber-500/40 rounded-xl font-bold text-sm hover:bg-zinc-800/85 hover:border-amber-400 transition-all flex items-center gap-2 mx-auto"
            id="watch-video-btn"
          >
            <Play size={16} fill="currentColor" />
            <span>Watch Sponsor Video</span>
          </button>
        ) : (
          <div className="bg-black rounded-xl overflow-hidden aspect-video max-w-sm mx-auto relative flex flex-col items-center justify-center p-4">
            {/* Mocking video visualization */}
            <div className="absolute inset-0 bg-cover bg-center opacity-40 filter blur-sm" style={{ backgroundImage: `url(${activeAd.image_url})` }}></div>
            
            <div className="z-10 text-center">
              <Volume2 className="h-10 w-10 text-amber-500 mx-auto mb-2 animate-bounce" />
              <p className="text-sm font-semibold text-zinc-200">Playing: {activeAd.title}</p>
              
              {videoTimer > 0 ? (
                <div className="text-2xl font-mono text-amber-400 font-bold mt-4 bg-zinc-950/80 rounded-full w-12 h-12 flex items-center justify-center mx-auto border border-amber-500">
                  {videoTimer}s
                </div>
              ) : (
                <div className="mt-4">
                  <span className="bg-green-500 text-black font-semibold text-xs py-1.5 px-3 rounded-full flex items-center gap-1 mx-auto justify-center w-fit shadow-lg shadow-green-500/20">
                    <Award size={14} />
                    Reward Unlocked!
                  </span>
                </div>
              )}
            </div>

            {videoTimer === 0 && (
              <button
                onClick={() => {
                  setVideoPlaying(false);
                  setVideoTimer(5);
                  setRewardGranted(false);
                }}
                className="absolute bottom-3 right-3 text-xs bg-zinc-900 border border-zinc-700 hover:border-amber-500 text-amber-400 px-3 py-1.5 rounded transition-colors"
                id="close-rev-btn"
              >
                Close Video
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
}
