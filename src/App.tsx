import React, { useState, useEffect } from "react";
import { User, Prediction, Payment, Ad, AppSettings, Package, Subscription } from "./types";
import AdDisplay from "./components/AdDisplay";
import PredictionsList from "./components/PredictionsList";
import AdminDashboard from "./components/AdminDashboard";
import { 
  Crown, Trophy, Clock, User as UserIcon, LogIn, Lock, CheckCircle2, 
  XCircle, Copy, Check, Zap, AlertCircle, ShoppingBag, ArrowRight, BookOpen, Key, Smartphone, RefreshCw, Settings
} from "lucide-react";

export default function App() {
  // Session / Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<"login" | "register" | "forgot">("login");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [authForm, setAuthForm] = useState({ email: "", password: "", username: "" });

  // Main UI routing
  const [currentTab, setCurrentTab] = useState<"predictions" | "history" | "profile" | "admin">("predictions");

  // Core database states
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [activeSubs, setActiveSubs] = useState<Subscription[]>([]);
  const [paymentsHistory, setPaymentsHistory] = useState<Payment[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  
  // Checkout process states
  const [checkoutPkg, setCheckoutPkg] = useState<Package | null>(null);
  const [paymentPhone, setPaymentPhone] = useState("");
  const [paymentProvider, setPaymentProvider] = useState<"MPESA" | "TIGOPESA" | "AIRTEL_MONEY" | "HALOPESA">("MPESA");
  const [chektRef, setChektRef] = useState("");
  const [checkoutStatus, setCheckoutStatus] = useState<"idle" | "billing" | "processing" | "success" | "failed">("idle");
  const [checkoutRedirectUrl, setCheckoutRedirectUrl] = useState("");
  const [checkoutError, setCheckoutError] = useState("");

  // Modals & General notification toast
  const [showProfileToast, setShowProfileToast] = useState("");
  const [sqlCopied, setSqlCopied] = useState(false);
  const [sqlText, setSqlText] = useState("");

  // Load and synchronize application state
  const loadPortalData = async () => {
    try {
      // Get packages
      const pkgRes = await fetch("/api/packages");
      if (pkgRes.ok) setPackages(await pkgRes.json());

      // Get configuration parameters
      const configRes = await fetch(`/api/settings?userId=${currentUser?.id || ""}`);
      if (configRes.ok) setSettings(await configRes.json());

      // Get predictions
      const predRes = await fetch(`/api/predictions?userId=${currentUser?.id || ""}`);
      if (predRes.ok) setPredictions(await predRes.json());

      // Get ads
      const adsRes = await fetch("/api/ads");
      if (adsRes.ok) setAds(await adsRes.json());

      // If user is logged, fetch subscriptions and payments logs
      if (currentUser) {
        const subRes = await fetch(`/api/subscriptions/active?userId=${currentUser.id}`);
        if (subRes.ok) setActiveSubs(await subRes.json());

        const payRes = await fetch(`/api/payments/history?userId=${currentUser.id}`);
        if (payRes.ok) setPaymentsHistory(await payRes.json());
      }
    } catch (err) {
      console.error("Error loading index data", err);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, [currentUser?.id]);

  // Load SQL schema layout from server
  useEffect(() => {
    fetch("/api/supabase-schema")
      .then(res => res.text())
      .then(text => setSqlText(text))
      .catch(err => console.error("Error loading query schema files", err));
  }, []);

  // --- AUTH ACTIONS ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!authForm.email || !authForm.password) {
      return setAuthError("Please provide an email and password.");
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authForm.email, password: authForm.password })
      });

      if (res.ok) {
        const data = await res.ok ? await res.json() : null;
        if (data && data.user) {
          setCurrentUser(data.user);
          setAuthForm({ email: "", password: "", username: "" });
        }
      } else {
        const errorData = await res.json();
        setAuthError(errorData.error || "Invalid credentials. Try again.");
      }
    } catch (err) {
      setAuthError("Failed to communicate with authentication servers.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!authForm.email || !authForm.password || !authForm.username) {
      return setAuthError("All credentials fields are required.");
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: authForm.email, 
          password: authForm.password, 
          username: authForm.username 
        })
      });

      if (res.ok) {
        setAuthSuccess("VIP Account registered! Login to access analytics predictions.");
        setAuthView("login");
        setAuthForm({ ...authForm, password: "" });
      } else {
        const err = await res.json();
        setAuthError(err.error || "Error registering credentials.");
      }
    } catch (err) {
      setAuthError("Network server error registering.");
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!authForm.email) {
      return setAuthError("Registered email address is required.");
    }

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authForm.email })
      });

      if (res.ok) {
        setAuthSuccess("Recovery code processed. Please inspect inbox logs.");
      } else {
        const err = await res.json();
        setAuthError(err.error || "Email not registered.");
      }
    } catch (err) {
      setAuthError("Communication index error.");
    }
  };

  const handleUpdateProfile = async (username: string, email: string, pass?: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: currentUser.id, 
          username, 
          email, 
          password: pass 
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setShowProfileToast("VIP Account profile changes saved.");
        setTimeout(() => setShowProfileToast(""), 3000);
      } else {
        setShowProfileToast("Error updating profile.");
      }
    } catch (err) {
      setShowProfileToast("Database index error.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveSubs([]);
    setPaymentsHistory([]);
    setAuthForm({ email: "", password: "", username: "" });
    setAuthView("login");
    setCurrentTab("predictions");
  };

  // --- PAYMENT / CHECKOUT SYSTEM ACTIONS ---

  const handleStartCheckout = (pkg: Package) => {
    if (!currentUser) {
      // Direct user to authenticated state
      setAuthView("register");
      // Scroll to bottom form
      const el = document.getElementById("auth-form-card");
      if (el) el.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setCheckoutPkg(pkg);
    setCheckoutStatus("billing");
    setCheckoutError("");
  };

  const handleCloseCheckout = () => {
    if ((window as any).pesapalPollInterval) {
      clearInterval((window as any).pesapalPollInterval);
    }
    setCheckoutPkg(null);
    setCheckoutStatus("idle");
    setCheckoutRedirectUrl("");
    setCheckoutError("");
  };

  const handleManualVerifyStatus = async () => {
    if (!chektRef) return;
    setCheckoutError("");
    try {
      const verifyRes = await fetch("/api/payments/verify-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: chektRef })
      });

      if (verifyRes.ok) {
        const verifyData = await verifyRes.json();
        if (verifyData.status === "completed") {
          setCheckoutStatus("success");
          loadPortalData();
        } else {
          setCheckoutError(`Bado: ${verifyData.message || "Malipo hayajapokelewa na PesaPal bado"}`);
        }
      } else {
        setCheckoutError("Mawasiliano na PesaPal yalifeli. Jaribu tena.");
      }
    } catch (err) {
      setCheckoutError("Mtandao una shida. Jaribu tena.");
    }
  };

  const handleProcessMobilePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutPkg || !currentUser) return;

    if (!paymentPhone || paymentPhone.length < 9) {
      return setCheckoutError("Please enter a valid Tanzanian mobile cash number.");
    }

    setCheckoutStatus("processing");
    setCheckoutError("");
    setCheckoutRedirectUrl("");

    try {
      // Post transaction request to PesaPal express backend handler
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          packageId: checkoutPkg.id,
          phone: "0" + paymentPhone,
          method: `PesaPal (${paymentProvider}: ${paymentPhone})`
        })
      });

      if (res.ok) {
        const orderData = await res.json();
        setChektRef(orderData.payment.reference);
        
        if (orderData.redirectUrl) {
          setCheckoutRedirectUrl(orderData.redirectUrl);
          
          // Try to auto-open in new window/tab safely (though standard prompt will be shown to user)
          try {
            window.open(orderData.redirectUrl, "_blank");
          } catch (e) {
            console.warn("Popup blocked by browser engine");
          }
        }

        // Real automated verification engine: Poll every 3 seconds for 2 minutes
        let attempts = 0;
        const maxAttempts = 40;
        
        const pollInterval = setInterval(async () => {
          attempts++;
          if (attempts > maxAttempts || checkoutStatus === "success") {
            clearInterval(pollInterval);
            return;
          }

          try {
            const verifyRes = await fetch("/api/payments/verify-status", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reference: orderData.payment.reference })
            });

            if (verifyRes.ok) {
              const verifyData = await verifyRes.json();
              if (verifyData.status === "completed") {
                clearInterval(pollInterval);
                setCheckoutStatus("success");
                loadPortalData();
              } else if (verifyData.status === "failed") {
                clearInterval(pollInterval);
                setCheckoutStatus("failed");
                setCheckoutError("PesaPal payment declined. Please check your ledger and retry.");
              }
            }
          } catch (err) {
            console.warn("Background polling error:", err);
          }
        }, 3000);

        // Save reference to clear later
        (window as any).pesapalPollInterval = pollInterval;

      } else {
        setCheckoutStatus("failed");
        setCheckoutError("Could not place order with Tanzanian PesaPal gateway.");
      }
    } catch (err) {
      setCheckoutStatus("failed");
      setCheckoutError("Fatal PesaPal connection interface error.");
    }
  };

  // --- COPY SQL HELPER ---
  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlText);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  // Extract won/lost calculations
  const finishedBetsHistory = predictions.filter(p => p.status !== "pending");

  // Admin access bypass validation check
  const isUserAdmin = currentUser?.role === "admin";

  return (
    <div className="bg-black font-sans min-h-screen text-zinc-100 selection:bg-[#00E676] selection:text-black">
      
      {/* Top Navigation Frame */}
      <header className="bg-zinc-950 border-b border-zinc-900 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Logo brand */}
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-[#00E676] to-[#00C853] p-2.5 rounded-xl shadow-[0_2px_12px_rgba(0,230,118,0.2)]">
              <Trophy className="text-black h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tighter text-white font-sans block leading-none">SAPC TPS</span>
              <span className="text-[9px] uppercase tracking-widest text-[#00E676] font-bold block leading-none font-mono mt-1">Premium Betting Tips</span>
            </div>
          </div>

          {/* User authenticated block widget */}
          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="flex items-center gap-3" id="nav-user-widget">
                <button
                  onClick={() => setCurrentTab("profile")}
                  className={`flex items-center gap-2 p-1 px-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-[#00E676]/65 transition-all text-left ${
                    currentTab === "profile" ? "border-[#00E676]" : ""
                  }`}
                >
                  <div className="h-7 w-7 rounded-lg bg-[#00E676]/10 flex items-center justify-center text-[#00E676] font-bold border border-[#00E676]/20 text-xs font-mono">
                    {currentUser.username[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="hidden sm:block">
                    <span className="block text-xs font-bold text-zinc-200 leading-tight truncate max-w-[80px]">
                      {currentUser.username}
                    </span>
                    <span className="block text-[9px] text-zinc-500 leading-none">
                      {currentUser.role === "admin" ? "Admin" : "Prem. Client"}
                    </span>
                  </div>
                </button>

                <button
                  onClick={handleLogout}
                  className="p-2 sm:px-3 text-xs bg-zinc-900 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 border border-zinc-800 text-zinc-500 rounded-xl transition-all font-bold uppercase tracking-wide cursor-pointer"
                  id="header-logout-btn"
                >
                  Exit
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* ADMIN CONTROL OVERLAY - Renders immediately at top if administrator is logged in */}
      {currentUser && isUserAdmin && (
        <div className="bg-[#00E676]/5 border-b border-[#00E676]/20 py-2.5 px-4 text-center">
          <span className="text-xxs uppercase tracking-widest font-black text-[#00E676] mr-2">👑 Administrative State Console:</span>
          <span className="text-xs text-zinc-300">You have absolute controls over prices, ads, payments, and tips resolving dashboard.</span>
        </div>
      )}

      {/* Main Container viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 pb-28">
        
        {!currentUser ? (
          /* WELCOME SPLASH GATE WITH CENTRAL AUTHENTICATION CARD */
          <div className="py-8 sm:py-16 flex flex-col items-center justify-center animate-fade-in" id="auth-unregistered-gate">
            <div className="max-w-md w-full text-center space-y-4 mb-8">
              <div className="bg-gradient-to-br from-[#00E676] to-[#00C853] p-4 rounded-2xl w-fit mx-auto shadow-[0_4px_22px_rgba(0,230,118,0.25)]">
                <Trophy size={32} className="text-black stroke-[2.5]" />
              </div>
              <h2 className="text-3xl font-black text-white font-sans uppercase tracking-tight">SAPC TPS PORTAL</h2>
              <span className="text-xxs uppercase tracking-widest text-[#00E676] font-bold block font-mono">Premium Betting Tips</span>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                Tanzania's elite betting platform. Register an account or login below to unmask daily ODDS 5, ODDS 10, exact soccer slip matrices today.
              </p>
            </div>

            {/* AUTH INPUTS CARD */}
            <div className="max-w-md w-full bg-[#0D0F12] border border-zinc-90 w-full rounded-2xl p-6 sm:p-8 shadow-2xl relative" id="auth-form-card">
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#00E676]/5 rounded-full filter blur-xl"></div>
              
              <div className="flex items-center justify-around border-b border-zinc-900 pb-4 mb-6">
                <button
                  onClick={() => {
                    setAuthView("login");
                    setAuthError("");
                    setAuthSuccess("");
                  }}
                  className={`font-black text-sm uppercase pb-2 tracking-wide border-b-2 cursor-pointer ${
                    authView === "login" ? "border-[#00E676] text-[#00E676]" : "border-transparent text-zinc-500"
                  }`}
                  id="switch-login"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setAuthView("register");
                    setAuthError("");
                    setAuthSuccess("");
                  }}
                  className={`font-black text-sm uppercase pb-2 tracking-wide border-b-2 cursor-pointer ${
                    authView === "register" ? "border-[#00E676] text-[#00E676]" : "border-transparent text-zinc-500"
                  }`}
                  id="switch-reg"
                >
                  Register
                </button>
              </div>

              {authError && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/25 rounded-xl text-center text-red-500 text-xs font-semibold mb-4 flex items-center justify-center gap-1">
                  <AlertCircle size={14} />
                  <span>{authError}</span>
                </div>
              )}
              {authSuccess && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-center text-emerald-400 text-xs font-semibold mb-4 flex items-center justify-center gap-1">
                  <CheckCircle2 size={14} />
                  <span>{authSuccess}</span>
                </div>
              )}

              {authView === "login" && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xxs font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">Registered Email</label>
                    <input
                      type="email"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-[#00E676] font-mono"
                      placeholder="bettor@tps.tz"
                      value={authForm.email}
                      onChange={e => setAuthForm({ ...authForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xxs font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">Account Password</label>
                    <input
                      type="password"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-[#00E676] font-mono"
                      placeholder="••••••••"
                      value={authForm.password}
                      onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between pb-2">
                    <button
                      type="button"
                      onClick={() => setAuthView("forgot")}
                      className="text-[10px] text-zinc-500 hover:text-[#00E676] transition-colors cursor-pointer font-mono"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#00E676] hover:bg-[#00C853] text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer"
                    id="login-submit-btn"
                  >
                    Authenticate Access →
                  </button>
                </form>
              )}

              {authView === "register" && (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-xxs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Full username</label>
                    <input
                      type="text"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-[#00E676]"
                      placeholder="e.g. Master Bettor"
                      value={authForm.username}
                      onChange={e => setAuthForm({ ...authForm, username: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xxs font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">Registered Email</label>
                    <input
                      type="email"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-[#00E676] font-mono"
                      placeholder="bettor@tps.tz"
                      value={authForm.email}
                      onChange={e => setAuthForm({ ...authForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xxs font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">Create Secure password</label>
                    <input
                      type="password"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-[#00E676] font-mono"
                      placeholder="••••••••"
                      value={authForm.password}
                      onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#00E676] hover:bg-[#00C853] text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer"
                    id="reg-submit-btn"
                  >
                    Create VIP Account →
                  </button>
                </form>
              )}

              {authView === "forgot" && (
                <form onSubmit={handleForgot} className="space-y-4">
                  <div>
                    <label className="block text-xxs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Enrolled Email Address</label>
                    <input
                      type="email"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-mono"
                      placeholder="bettor@tps.tz"
                      value={authForm.email}
                      onChange={e => setAuthForm({ ...authForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-xs uppercase tracking-wide rounded-xl"
                    >
                      Reset Password
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthView("login")}
                      className="px-4 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold uppercase rounded-xl"
                    >
                      Back
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        ) : (
          /* OTHERWISE: RENDER STANDARD LOGGED IN VIEWS */
          <div className="space-y-12">
            
            {/* Render Admin Dashboard Segment when the currentTab is set to 'admin' */}
            {currentUser && isUserAdmin && currentTab === "admin" ? (
              <AdminDashboard 
                adminUser={currentUser} 
                onLogout={handleLogout} 
                packages={packages} 
                onRefreshData={loadPortalData} 
              />
            ) : (
              /* OTHERWISE: STANDARD END USER PORTAL */
              <div className="space-y-12" id="standard-client-portal">

            {/* RENDER TAB content viewports */}
            <div className="space-y-8">

              {/* TAB OR VIEW: PREDICTIONS */}
            {currentTab === "predictions" && (
              <div className="space-y-12 animate-fade-in" id="pricing-grid-view">
                
                {/* Banner Ad Display (If enabled on Admin setting) */}
                <AdDisplay 
                  type="banner" 
                  ads={ads} 
                  enabled={settings?.banner_ads_enabled ?? true} 
                />

                {/* Premium Gold Entrance Banner */}
                <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 border border-zinc-800/80 rounded-3xl p-8 md:p-12 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
                  
                  {/* Gold Ambient Orbs Backdrop */}
                  <div className="absolute top-0 right-0 h-48 w-48 bg-amber-500/5 rounded-full filter blur-3xl opacity-60"></div>
                  
                  <div className="space-y-4 max-w-2xl relative z-10">
                    <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold font-mono text-xxs px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                      <Zap size={10} className="animate-spin" />
                      <span>SAPC TPS Premium VIP tips</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-black font-sans tracking-tight text-white leading-tight">
                      Win Over <span className="text-amber-400">92.4%</span> Of Your Football Slip Bets Today
                    </h2>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      Join Tanzania's elite master-tipping network. Elevate your bet slip yields via daily handpicked metrics, exact projections, halftime matrices, and direct PesaPal auto-activation.
                    </p>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-mono text-zinc-300">
                      <span className="flex items-center gap-1.5 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-850"><CheckCircle2 size={12} className="text-emerald-500" /> TZS pricing</span>
                      <span className="flex items-center gap-1.5 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-850"><CheckCircle2 size={12} className="text-emerald-500" /> Instant Mobile Activation</span>
                      <span className="flex items-center gap-1.5 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-850"><CheckCircle2 size={12} className="text-emerald-500" /> API Sports scores</span>
                    </div>
                  </div>

                  {/* VIP Crown Card Graphic decoration */}
                  <div className="bg-zinc-950 border-2 border-amber-500/40 p-6 rounded-2xl w-full max-w-[280px] shadow-2xl relative overflow-hidden group hover:border-amber-400 transition-all">
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/10 rounded-full filter blur-2xl"></div>
                    <Trophy size={40} className="text-amber-500 mb-4 animate-bounce" />
                    <h4 className="text-base font-black text-zinc-100 font-sans tracking-tight uppercase">SAPC GOLD CROWN</h4>
                    <p className="text-xxs text-zinc-400 mt-1 leading-relaxed">Includes ODDS 5, ODDS 10, ODDS 20 and exact scores slips today.</p>
                    <button
                      onClick={() => {
                        const el = document.getElementById("packages-pricing-grid");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="mt-6 w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black text-xs font-black rounded-lg uppercase tracking-wide flex items-center justify-center gap-2 hover:from-amber-400 hover:to-amber-500"
                      id="glow-explore-btn"
                    >
                      <span>Explore VIP Pricing</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>

                </div>

                {/* Package Prices Section Header */}
                <div className="text-center space-y-2 py-4 shadow-sm" id="packages-pricing-grid">
                  <h2 className="text-2xl sm:text-3xl font-black text-white font-sans uppercase tracking-tight">Active Premium VIP Packages</h2>
                  <p className="text-sm text-zinc-400 max-w-xl mx-auto font-medium">Click Subscribe on any daily package of choice and activate instantly using standard PesaPal.</p>
                </div>

                  {/* Pricing grid cards for visual packages */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {packages.map(pkg => {
                      const isClientSubscribed = activeSubs.some(
                        s => s.package_id === pkg.id && s.status === "active" && new Date(s.expiry_date).getTime() > Date.now()
                      );

                      return (
                        <div
                          key={pkg.id}
                          className="bg-zinc-950 border border-zinc-850 hover:border-amber-500/20 rounded-2xl p-6 flex flex-col justify-between hover:scale-101 hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
                          id={`pkg-tier-${pkg.id}`}
                        >
                          <div className="absolute top-0 right-0 p-3 text-zinc-800">
                            <Crown size={20} />
                          </div>

                          <div className="space-y-4">
                            <div>
                              <span className="text-xxs uppercase tracking-widest text-amber-500 font-bold font-mono">Bettor Class</span>
                              <h4 className="text-xl font-bold text-zinc-100 mt-1">{pkg.name} PACK</h4>
                            </div>

                            <p className="text-xs text-zinc-400 leading-normal">{pkg.description}</p>
                          </div>

                          <div className="space-y-5 pt-8 mt-4 border-t border-zinc-900">
                            <div>
                              <span className="text-[10px] text-zinc-500 font-mono tracking-widest block font-bold uppercase">Daily Ticket rate</span>
                              <div className="text-2xl font-black text-amber-400 font-mono">
                                TZS {pkg.price.toLocaleString()}{" "}
                                <span className="text-zinc-500 text-xs font-normal font-sans">/ day</span>
                              </div>
                            </div>

                            {isClientSubscribed ? (
                              <div className="block w-full py-2.5 bg-green-500/10 text-green-400 border border-green-500/20 font-bold text-xs uppercase tracking-wider text-center rounded-xl font-mono">
                                active access unlocked
                              </div>
                            ) : (
                              <button
                                onClick={() => handleStartCheckout(pkg)}
                                className="block w-full py-2.5 bg-zinc-900 hover:bg-amber-500 hover:text-black border border-zinc-800 hover:border-amber-400 text-amber-400 font-black text-xs uppercase tracking-wide text-center rounded-xl transition-all"
                                id={`pkg-grid-sub-${pkg.id}`}
                              >
                                Subscribe now
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Main lists of predictions */}
                  <PredictionsList
                    predictions={predictions}
                    packages={packages}
                    activeSubscriptions={activeSubs}
                    userId={currentUser?.id || ""}
                    onSubscribeClick={handleStartCheckout}
                  />

                </div>
              )}



              {/* TAB CODE: Betting historical logs */}
              {currentTab === "history" && (
                <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-6 shadow-xl space-y-6 animate-fade-in" id="history-view">
                  <div className="flex items-center gap-2.5 text-amber-400 mb-2">
                    <Clock size={20} />
                    <h2 className="text-lg font-black uppercase tracking-tight">VIP Bettors Slip logs History</h2>
                  </div>
                  
                  <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
                    Transparency remains our main cornerstone. Inspect the comprehensive historic sheets of completed bets generated by our computer analytical engines.
                  </p>

                  <div className="overflow-x-auto scrollbar-thin">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-widest font-mono py-2">
                          <th className="py-3 px-4">Placement Date</th>
                          <th className="py-3 px-4">Club matchups</th>
                          <th className="py-3 px-4 text-center">odds target</th>
                          <th className="py-3 px-4">Bet tip prediction</th>
                          <th className="py-3 px-4 text-right">Result Badge</th>
                        </tr>
                      </thead>
                      <tbody>
                        {finishedBetsHistory.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-zinc-500 italic">No completed slips in historical ledger yet. Check back later and build slips history.</td>
                          </tr>
                        ) : (
                          finishedBetsHistory.map(pred => (
                            <tr key={pred.id} className="border-b border-zinc-900 hover:bg-zinc-900/10" id={`hist-row-${pred.id}`}>
                              <td className="py-4 px-4 font-mono text-zinc-500">
                                {new Date(pred.match_time).toLocaleDateString("en-TZ")}
                              </td>
                              <td className="py-4 px-4 font-bold text-zinc-200">
                                {pred.home_team} v {pred.away_team}
                                <span className="block text-[10px] text-zinc-500 font-normal mt-0.5">{pred.league}</span>
                              </td>
                              <td className="py-4 px-4 font-mono font-bold text-center text-amber-400">
                                {pred.odds.toFixed(2)}
                              </td>
                              <td className="py-4 px-4">
                                <span className="font-semibold text-zinc-300 block">{pred.prediction}</span>
                                <span className="text-[10px] text-zinc-500 block mt-0.5">Confidence indices: {pred.confidence}%</span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                {pred.status === "won" ? (
                                  <span className="inline-flex items-center gap-1 text-green-500 font-black text-xxs bg-green-500/10 border border-green-500/20 py-1 px-3 rounded-full">
                                    ✓ WON
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-red-500 font-black text-xxs bg-red-500/10 border border-red-500/20 py-1 px-3 rounded-full">
                                    ✗ LOST
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB CODE: Customer VIP Profile change form */}
              {currentTab === "profile" && currentUser && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in" id="profile-view">
                  
                  {/* Account detail editor */}
                  <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl shadow">
                    <h3 className="text-base font-black text-amber-400 uppercase mb-4">Edit Profile and Password</h3>
                    
                    {showProfileToast && (
                      <div className="p-3.5 bg-zinc-950 border border-zinc-800 text-amber-400 text-xs font-bold rounded-lg mb-4 text-center">
                        {showProfileToast}
                      </div>
                    )}

                    <form onSubmit={e => {
                      e.preventDefault();
                      const items = e.currentTarget.elements as any;
                      handleUpdateProfile(items.username.value, items.email.value, items.password.value || undefined);
                    }} className="space-y-4">
                      <div>
                        <label className="block text-xxs font-bold text-zinc-400 uppercase mb-1">Username / Bettor Name</label>
                        <input
                          type="text"
                          name="username"
                          className="w-full bg-zinc-950 border border-zinc-805 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none"
                          defaultValue={currentUser.username}
                        />
                      </div>

                      <div>
                        <label className="block text-xxs font-bold text-zinc-400 uppercase mb-1">Email Address</label>
                        <input
                          type="email"
                          name="email"
                          className="w-full bg-zinc-950 border border-zinc-805 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none"
                          defaultValue={currentUser.email}
                        />
                      </div>

                      <div>
                        <label className="block text-xxs font-bold text-zinc-400 uppercase mb-1">Change Account Password</label>
                        <input
                          type="password"
                          name="password"
                          className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none"
                          placeholder="••••••••"
                        />
                        <span className="text-[10px] text-zinc-500 mt-1 block">Leave empty to keep existing password</span>
                      </div>

                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-xs uppercase tracking-wide rounded-xl"
                      >
                        Save Profiles change
                      </button>
                    </form>
                  </div>

                  {/* Customer current Active Subscriptions */}
                  <div className="bg-zinc-900/40 border border-zinc-850 p-6 rounded-2xl shadow space-y-4">
                    <h3 className="text-base font-black text-amber-500 uppercase">Subscribed Active VIP Passes</h3>
                    
                    {activeSubs.length === 0 ? (
                      <div className="py-8 text-center text-zinc-500 text-xs italic bg-zinc-950/20 border border-zinc-900 rounded-xl">
                        You have no active subscription passes yet. Subscribe to unlock master prediction panels.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activeSubs.map(sub => {
                          const matchedPkg = packages.find(p => p.id === sub.package_id);
                          const expiry = new Date(sub.expiry_date);
                          const daysLeft = Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

                          return (
                            <div key={sub.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
                              <div>
                                <span className="text-xs font-bold text-amber-400 block uppercase font-sans">{matchedPkg?.name || "VIP PACK"} PASS</span>
                                <span className="text-xxs text-zinc-500 block font-mono mt-0.5">Expiry: {expiry.toLocaleString()}</span>
                              </div>
                              <span className="bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 font-bold font-mono text-xxs py-1 px-2.5 rounded-full uppercase tracking-wider">
                                {daysLeft} Day(s) Left
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Historical Payment Receipts */}
                    <div className="pt-4 border-t border-zinc-850">
                      <h4 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-3">Your PesaPal payment receipts</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
                        {paymentsHistory.map(pay => (
                          <div key={pay.id} className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-900 flex justify-between items-center text-xxs font-mono">
                            <div>
                              <span className="block font-bold text-zinc-300">{pay.reference}</span>
                              <span className="block text-zinc-500 mt-0.5">{pay.method}</span>
                            </div>
                            <div className="text-right">
                              <span className="block font-bold text-amber-400">TZS {pay.amount.toLocaleString()}</span>
                              <span className="block text-green-400 uppercase font-black text-[9px]">{pay.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>

          </div>
        )}

        {/* Daily Ad Popups (If enabled) */}
        <AdDisplay 
          type="popup" 
          ads={ads} 
          enabled={settings?.popup_ads_enabled ?? true} 
        />

      </div>
    )}

      </main>

      {/* CHECKOUT PESAPAL OVERLAY DIALOG MODAL */}
      {checkoutPkg && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fade-in" id="checkout-modal-overlay">
          <div className="bg-zinc-950 border-2 border-amber-500 rounded-2xl w-full max-w-md overflow-hidden relative shadow-2xl">
            
            {/* Modal Exit */}
            <button
              onClick={handleCloseCheckout}
              className="absolute top-4 right-4 text-zinc-400 hover:text-amber-500 p-1.5 bg-zinc-900 rounded-full transition-colors font-bold text-xs leading-none z-10"
              aria-label="Exit Checkout"
              id="exit-chek-btn"
            >
              ✕
            </button>

            {/* Billing/Payment Providers Selection */}
            {checkoutStatus === "billing" && (
              <div className="p-6 space-y-6">
                <div className="text-center">
                  <div className="bg-amber-500/10 border border-amber-500/25 p-3 rounded-full text-amber-500 w-fit mx-auto mb-3">
                    <ShoppingBag size={24} />
                  </div>
                  <h3 className="text-lg font-black tracking-tight text-zinc-100 uppercase">PesaPal Express Checkout</h3>
                  <p className="text-xs text-zinc-500 mt-1">Acquiring pass for: {checkoutPkg.name} package plan</p>
                </div>

                <div className="bg-zinc-900/60 p-4 border border-zinc-850 rounded-xl font-mono text-center">
                  <span className="text-zinc-500 block text-xxs uppercase tracking-wider font-semibold">Tanzania Price Total</span>
                  <span className="text-2xl font-black text-amber-400 block mt-1">TZS {checkoutPkg.price.toLocaleString()}</span>
                </div>

                <form onSubmit={handleProcessMobilePayment} className="space-y-4">
                  {/* Select M-Cash provider */}
                  <div>
                    <label className="block text-xxs font-bold text-zinc-400 uppercase tracking-widest mb-2">Billing Mobile Operator</label>
                    <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold">
                      {(["MPESA", "TIGOPESA", "AIRTEL_MONEY", "HALOPESA"] as const).map(prov => (
                        <button
                          key={prov}
                          type="button"
                          onClick={() => setPaymentProvider(prov)}
                          className={`p-3 rounded-xl border font-mono transition-all uppercase tracking-wide flex items-center justify-center gap-1.5 ${
                            paymentProvider === prov 
                              ? "bg-amber-500 text-black border-amber-400 font-extrabold shadow-md shadow-amber-500/10" 
                              : "bg-zinc-900 text-zinc-400 border-zinc-850 hover:bg-zinc-850 hover:text-zinc-200"
                          }`}
                        >
                          <Smartphone size={12} />
                          <span>{prov.replace("_", " ")}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Phone input */}
                  <div>
                    <label className="block text-xxs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Operator Phone Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none font-mono text-xs text-zinc-500 font-bold">
                        +255
                      </div>
                      <input
                        type="tel"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-14 pr-4 text-sm text-zinc-200 font-mono focus:outline-none focus:border-amber-500 tracking-wider"
                        placeholder="712345678"
                        maxLength={9}
                        value={paymentPhone}
                        onChange={e => setPaymentPhone(e.target.value.replace(/\D/g, ""))}
                        required
                      />
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 block">Enter 9 digits. SMS PesaPal checkout token will be generated.</span>
                  </div>

                  {checkoutError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-xxs font-semibold text-center leading-relaxed">
                      {checkoutError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md"
                    id="chek-billing-btn"
                  >
                    Authorize billing order
                  </button>
                </form>
              </div>
            )}

            {/* Processing checkout */}
            {checkoutStatus === "processing" && (
              <div className="p-6 text-center space-y-6" id="chek-processing">
                <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500/10 opacity-75"></span>
                  <RefreshCw size={36} className="animate-spin text-amber-500 relative" />
                </div>
                
                <div>
                  <h3 className="text-zinc-100 font-bold text-base uppercase tracking-wider">Malipo Yanashughulikiwa</h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
                    Tumeanzisha salama muamala wa PesaPal kwa namba <span className="text-amber-400 font-extrabold font-mono">+255 {paymentPhone}</span>.
                  </p>
                </div>

                {checkoutRedirectUrl ? (
                  <div className="space-y-3 bg-zinc-900 border border-zinc-850 p-4 rounded-xl">
                    <span className="text-zinc-500 text-[10px] font-bold block uppercase tracking-wider leading-tight">PesaPal Secure Gateway is Ready</span>
                    
                    <a
                      href={checkoutRedirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full py-2.5 items-center justify-center bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md gap-2"
                    >
                      Bofya Hapa Kulipia (Pay Now) ↗
                    </a>
                    
                    <p className="text-[10px] text-zinc-500 leading-tight">
                      If the window did not open automatically, click the gold button above to pay securely on PesaPal portal.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 bg-zinc-900/60 p-4 border border-zinc-855 rounded-xl font-mono text-center">
                    <span className="text-zinc-500 text-xxs uppercase tracking-wider">Manual Simulation Action</span>
                    <button
                      type="button"
                      onClick={async () => {
                        const confirmRes = await fetch("/api/payments/confirm", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            userId: currentUser.id,
                            reference: chektRef,
                            action: "complete"
                          })
                        });
                        if (confirmRes.ok) {
                          setCheckoutStatus("success");
                          loadPortalData();
                        }
                      }}
                      className="w-full text-xxs py-1.5 px-3 border border-dashed border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors font-bold mt-2"
                    >
                      [DEV] Simulate Auto Sandbox Approval ✓
                    </button>
                  </div>
                )}

                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xxs text-zinc-400 justify-center bg-zinc-900/30 py-2 border border-zinc-900 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                    <span>Poller: Checking PesaPal for payment receipt...</span>
                  </div>

                  <button
                    onClick={handleManualVerifyStatus}
                    className="w-full py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-amber-500 font-bold text-xxs uppercase rounded-xl transition-all tracking-wider"
                  >
                    Thibitisha malipo (Verify Payment)
                  </button>
                </div>

                {checkoutError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-xxs font-semibold text-center leading-relaxed">
                    {checkoutError}
                  </div>
                )}

                <div className="p-2.5 bg-zinc-900 border border-zinc-850 rounded-xl font-mono text-[10px] text-zinc-500 select-all">
                  REF: {chektRef || "Generating..."}
                </div>
              </div>
            )}

            {/* Success checkout */}
            {checkoutStatus === "success" && (
              <div className="p-8 text-center space-y-6" id="chek-success">
                <div className="bg-emerald-500/15 border border-emerald-500/35 p-4 rounded-full text-emerald-400 w-fit mx-auto shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 size={36} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-zinc-100 uppercase font-sans tracking-tight">Payment Approved</h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
                    Invoice completed! Invoiced TZS {checkoutPkg.price.toLocaleString()} cleared successfully. Your {checkoutPkg.name} package VIP pass is active for the next 24 Hours.
                  </p>
                </div>
                <button
                  onClick={handleCloseCheckout}
                  className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 text-amber-500 border border-zinc-800 text-xs font-black uppercase rounded-xl transition-colors tracking-wider"
                  id="chek-done-success"
                >
                  Start viewing VIP Tips
                </button>
              </div>
            )}

            {/* Failed checkout */}
            {checkoutStatus === "failed" && (
              <div className="p-8 text-center space-y-6" id="chek-failed">
                <div className="bg-red-500/15 border border-red-500/35 p-4 rounded-full text-red-500 w-fit mx-auto shadow-lg shadow-red-500/10">
                  <XCircle size={36} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-zinc-100 uppercase font-sans tracking-tight">Payment Declined</h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
                    {checkoutError || "PesaPal returned decline code. Ensure your wallet has sufficient balance and retry."}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setCheckoutStatus("billing")}
                    className="flex-1 py-2.5 bg-[#00E676] hover:bg-[#00C853] text-black font-bold text-xs uppercase rounded-xl transition-all cursor-pointer"
                  >
                    Retry transaction
                  </button>
                  <button
                    onClick={handleCloseCheckout}
                    className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold text-xs uppercase rounded-xl hover:text-zinc-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
      {currentUser && (
        <div className="fixed bottom-0 inset-x-0 bg-[#0A0C0E]/95 backdrop-blur-md border-t border-zinc-90 w-full px-3 py-2.5 z-40 block shadow-[0_-5px_20px_rgba(0,0,0,0.8)]" id="bottom-mobile-dock">
          <div className="max-w-md mx-auto flex items-center justify-around">
            {(["predictions", "history", "profile", ...(isUserAdmin ? ["admin" as const] : [])] as const).map(tab => {
              const isActive = currentTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setCurrentTab(tab)}
                  className={`flex flex-col items-center gap-1.5 py-1 px-3.5 rounded-xl transition-all duration-300 cursor-pointer ${
                    isActive ? "text-[#00E676] font-bold bg-[#00E676]/5" : "text-zinc-500 hover:text-zinc-350"
                  }`}
                  id={`bottom-tab-${tab}`}
                >
                  {tab === "predictions" && (
                    <>
                      <Trophy size={18} className={isActive ? "text-[#00E676] scale-110" : ""} />
                      <span className="text-[10px] tracking-tight uppercase font-mono font-bold">Home</span>
                    </>
                  )}
                  {tab === "history" && (
                    <>
                      <Clock size={18} className={isActive ? "text-[#00E676] scale-110" : ""} />
                      <span className="text-[10px] tracking-tight uppercase font-mono font-bold">Historia</span>
                    </>
                  )}
                  {tab === "profile" && (
                    <>
                      <Settings size={18} className={isActive ? "text-[#00E676] scale-110" : ""} />
                      <span className="text-[10px] tracking-tight uppercase font-mono font-bold">Setting</span>
                    </>
                  )}
                  {tab === "admin" && (
                    <>
                      <Crown size={18} className={isActive ? "text-[#00E676] scale-110 animate-pulse" : ""} />
                      <span className="text-[10px] tracking-tight uppercase font-mono font-black">Admin Panel</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Branding credits */}
      <footer className="bg-zinc-950 border-t border-zinc-900 py-10 mt-12 text-center text-zinc-600 text-xs">
        <div className="max-w-7xl mx-auto px-4 space-y-4">
          <div className="flex items-center justify-center gap-1.5 text-zinc-500">
            <Trophy size={12} className="text-[#00E676]" />
            <span className="font-bold tracking-tight text-zinc-400 uppercase font-sans">SAPC TPS Premium Soccer</span>
          </div>
          <p className="max-w-lg mx-auto text-[11px] leading-relaxed">
            Responsible bet awareness statement: Football predictions represent deep mathematical models. Gambling contains financial risks. Always bet responsibly (18+). Crafted for Tanzania bettors.
          </p>
          <div className="text-[10px] text-zinc-700 font-mono uppercase tracking-widest pt-2">
            © 2026 SAPC TPS Portal. All rights reserved. Registered PesaPal client.
          </div>
        </div>
      </footer>

    </div>
  );
}
