import React, { useState, useEffect } from "react";
import { User, Prediction, Payment, Ad, AppSettings, Package } from "../types";
import { 
  Trophy, Users, DollarSign, Settings, Megaphone, PlusCircle, Check, X, 
  Trash2, Edit, CreditCard, ChevronRight, CheckCircle2, XCircle, AlertCircle, RefreshCw,
  BookOpen, Copy 
} from "lucide-react";

interface AdminDashboardProps {
  adminUser: User;
  onLogout: () => void;
  packages: Package[];
  onRefreshData: () => void;
}

interface StatsData {
  totalUsers: number;
  totalRevenue: number;
  activeSubscriptionsCount: number;
  completedPaymentsCount: number;
  pendingPaymentsCount: number;
  predictionsCount: {
    total: number;
    won: number;
    lost: number;
    pending: number;
  };
  packageRevenue: Record<string, number>;
}

export default function AdminDashboard({ adminUser, onLogout, packages, onRefreshData }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "predictions" | "users" | "payments" | "ads" | "settings" | "supabase">("overview");
  
  // Dashboard states
  const [stats, setStats] = useState<StatsData | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "success" });
  const [sqlText, setSqlText] = useState("");
  const [sqlCopied, setSqlCopied] = useState(false);

  // Creation forms states (Predictions)
  const [newPred, setNewPred] = useState({
    package_id: "odds5",
    home_team: "",
    away_team: "",
    league: "English Premier League",
    match_time: "",
    prediction: "",
    odds: "1.80",
    confidence: "85",
    analysis: ""
  });

  // Manual grant states
  const [manualGrant, setManualGrant] = useState({
    userId: "",
    packageId: "odds5",
    days: 1
  });

  // Editing predictions
  const [editingPredId, setEditingPredId] = useState<string | null>(null);
  const [editPredData, setEditPredData] = useState<any>(null);

  // Load everything
  const loadAdminDatabase = async () => {
    setLoading(true);
    try {
      // Load stats
      const statsRes = await fetch(`/api/admin/stats?adminId=${adminUser.id}`);
      if (statsRes.ok) setStats(await statsRes.json());

      // Load users
      const usersRes = await fetch(`/api/admin/users?adminId=${adminUser.id}`);
      if (usersRes.ok) setUsersList(await usersRes.json());

      // Load predictions
      const predRes = await fetch(`/api/predictions?userId=${adminUser.id}`);
      if (predRes.ok) setPredictions(await predRes.json());

      // Load payments
      const payRes = await fetch(`/api/payments/history?userId=${adminUser.id}`);
      if (payRes.ok) setPayments(await payRes.json());

      // Load Ads
      const adsRes = await fetch("/api/ads");
      if (adsRes.ok) setAds(await adsRes.json());

      // Load settings
      const settingsRes = await fetch(`/api/settings?userId=${adminUser.id}`);
      if (settingsRes.ok) setSettings(await settingsRes.json());

    } catch (err) {
      console.error("Error fetching admin data", err);
      showMsg("Failed to synchronized admin databases.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminDatabase();
    
    // Fetch production database schema
    fetch("/api/supabase-schema")
      .then(res => res.text())
      .then(text => setSqlText(text))
      .catch(err => console.error("Error loading query schema files", err));
  }, [adminUser.id]);

  const showMsg = (text: string, type: "success" | "error" = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "success" }), 4000);
  };

  // --- ACTIONS HANDLERS ---

  // Create prediction
  const handleCreatePrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPred.home_team || !newPred.away_team || !newPred.prediction || !newPred.match_time) {
      return showMsg("Please fill in all prediction details.", "error");
    }

    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: adminUser.id,
          ...newPred
        })
      });

      if (res.ok) {
        showMsg("VIP Prediction created successfully!");
        setNewPred({
          package_id: "odds5",
          home_team: "",
          away_team: "",
          league: "English Premier League",
          match_time: "",
          prediction: "",
          odds: "1.80",
          confidence: "85",
          analysis: ""
        });
        loadAdminDatabase();
        onRefreshData();
      } else {
        const err = await res.json();
        showMsg(err.error || "Failed to create prediction", "error");
      }
    } catch (err) {
      showMsg("Network error creating prediction", "error");
    }
  };

  // Update prediction status (WON / LOST)
  const handleResolvePrediction = async (id: string, status: "won" | "lost" | "pending") => {
    try {
      const res = await fetch(`/api/predictions/${id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: adminUser.id, status })
      });

      if (res.ok) {
        showMsg(`Prediction status resolved to ${status.toUpperCase()}!`);
        loadAdminDatabase();
        onRefreshData();
      } else {
        showMsg("Failed to resolve prediction status", "error");
      }
    } catch (err) {
      showMsg("Network error resolving prediction", "error");
    }
  };

  // Delete prediction
  const handleDeletePrediction = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this betting tip?")) return;
    try {
      const res = await fetch(`/api/predictions/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: adminUser.id })
      });

      if (res.ok) {
        showMsg("Prediction tip successfully deleted!");
        loadAdminDatabase();
        onRefreshData();
      } else {
        showMsg("Error deleting prediction", "error");
      }
    } catch (err) {
      showMsg("Network error deleting prediction", "error");
    }
  };

  // Start inline editing
  const startEditPred = (pred: Prediction) => {
    setEditingPredId(pred.id);
    setEditPredData({ ...pred });
  };

  // Update/Edit prediction
  const handleSaveEditPrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/predictions/${editingPredId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: adminUser.id,
          ...editPredData
        })
      });

      if (res.ok) {
        showMsg("Betting tip updated successfully!");
        setEditingPredId(null);
        loadAdminDatabase();
        onRefreshData();
      } else {
        showMsg("Failed to save changes", "error");
      }
    } catch (err) {
      showMsg("Network error updating prediction", "error");
    }
  };

  // Manual Sub / Payment activate
  const handleManualActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualGrant.userId) return showMsg("Please select a target user.", "error");

    try {
      const res = await fetch("/api/payments/manual-activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: adminUser.id,
          targetUserId: manualGrant.userId,
          packageId: manualGrant.packageId,
          days: Number(manualGrant.days)
        })
      });

      if (res.ok) {
        showMsg("VIP Access granted successfully!");
        setManualGrant({ userId: "", packageId: "odds5", days: 1 });
        loadAdminDatabase();
        onRefreshData();
      } else {
        showMsg("Failed to manually activate package", "error");
      }
    } catch (err) {
      showMsg("Network error granting custom packages", "error");
    }
  };

  // Confirm PesaPal pending payment
  const handleForceCompletePayment = async (ref: string) => {
    try {
      const res = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: adminUser.id,
          reference: ref,
          action: "complete"
        })
      });

      if (res.ok) {
        showMsg("Payment manually MARKED COMPLETED and subscription provisioned!");
        loadAdminDatabase();
        onRefreshData();
      } else {
        showMsg("Failed to force complete order reference", "error");
      }
    } catch (err) {
      showMsg("Network error verifying transaction", "error");
    }
  };

  // Toggle/Edit Ads settings
  const handleToggleAd = async (id: string, activeState: boolean) => {
    try {
      const res = await fetch(`/api/ads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: adminUser.id,
          active: activeState
        })
      });

      if (res.ok) {
        showMsg("Ad visibility configured successfully.");
        loadAdminDatabase();
      }
    } catch (err) {
      showMsg("Error setting ad properties", "error");
    }
  };

  // Update Settings (API keys & Package prices)
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: adminUser.id,
          ...settings
        })
      });

      if (res.ok) {
        showMsg("Global core settings and integration keys updated!");
        loadAdminDatabase();
        onRefreshData();
      } else {
        showMsg("Error updating settings database", "error");
      }
    } catch (err) {
      showMsg("Network error updating parameters", "error");
    }
  };

  return (
    <div className="bg-black min-h-screen text-zinc-100 p-4 md:p-8" id="admin-super-dashboard">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Controls */}
        <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div>
            <h1 className="text-2xl font-black font-sans tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#00E676] to-[#00C853]">
              SAPC TPS CONTROL TOWER
            </h1>
            <p className="text-xs text-zinc-400 mt-1">Logged in securely as Super Administrator: {adminUser.email}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={loadAdminDatabase}
              className="p-2 bg-zinc-800 text-zinc-400 hover:text-[#00E676] hover:bg-zinc-800/80 rounded-xl transition-all border border-zinc-700/50 cursor-pointer"
              id="admin-sync-btn"
              title="Sync Database"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onLogout}
              className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/25 border border-red-500/30 text-red-400 font-bold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer"
              id="admin-logout-btn"
            >
              Exit Dashboard
            </button>
          </div>
        </div>

        {/* Global Notifications Segment */}
        {message.text && (
          <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 animate-fade-in ${
            message.type === "success" 
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" 
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`} id="admin-toast">
            <AlertCircle size={16} />
            <span>{message.text}</span>
          </div>
        )}

        {/* Navigation Sidebar/Rail tabs */}
        <div className="flex overflow-x-auto gap-1 bg-zinc-900/40 p-1 border border-zinc-900 rounded-xl scrollbar-none">
          {([
            { id: "overview", label: "Overview Status", icon: Trophy },
            { id: "predictions", label: "Predictions Panel", icon: PlusCircle },
            { id: "users", label: "User VIP Accounts", icon: Users },
            { id: "payments", label: "PesaPal Invoices", icon: CreditCard },
            { id: "settings", label: "Keys & Settings", icon: Settings },
            { id: "supabase", label: "Supabase & SQL", icon: BookOpen }
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#00E676] text-black shadow-lg shadow-[#00E676]/10"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
              }`}
              id={`adm-tab-${tab.id}`}
            >
              <tab.icon size={14} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* LOADING SHIMMER */}
        {loading && !stats && (
          <div className="py-24 text-center">
            <RefreshCw size={36} className="animate-spin text-amber-500 mx-auto mb-3" />
            <p className="text-sm font-semibold text-zinc-400 font-mono tracking-wide">FETCHING CONSOLE DATA INTEGRITY STATE...</p>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && stats && (
          <div className="space-y-6" id="overview-tab-view">
            {/* Bento Stats Numbers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl flex items-center gap-4">
                <div className="p-4 bg-amber-500/15 border border-amber-500/35 text-amber-500 rounded-xl">
                  <DollarSign size={24} />
                </div>
                <div>
                  <span className="text-xxs uppercase tracking-wider text-zinc-500 font-bold block">Total Revenue</span>
                  <span className="text-xl font-black font-mono text-white tracking-tight">
                    TZS {stats.totalRevenue.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl flex items-center gap-4">
                <div className="p-4 bg-emerald-500/15 border border-emerald-500/35 text-emerald-500 rounded-xl">
                  <Users size={24} />
                </div>
                <div>
                  <span className="text-xxs uppercase tracking-wider text-zinc-500 font-bold block">VIP Bettors</span>
                  <span className="text-xl font-black font-mono text-white tracking-tight">
                    {stats.totalUsers} registered
                  </span>
                </div>
              </div>

              <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl flex items-center gap-4">
                <div className="p-4 bg-blue-500/15 border border-blue-500/35 text-blue-500 rounded-xl">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <span className="text-xxs uppercase tracking-wider text-zinc-500 font-bold block">Completed Subs</span>
                  <span className="text-xl font-black font-mono text-white tracking-tight">
                    {stats.activeSubscriptionsCount} active
                  </span>
                </div>
              </div>

              <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl flex items-center gap-4">
                <div className="p-4 bg-red-500/15 border border-red-500/35 text-red-500 rounded-xl">
                  <Trophy size={24} />
                </div>
                <div>
                  <span className="text-xxs uppercase tracking-wider text-zinc-500 font-bold block">Won / Lost slips</span>
                  <span className="text-xl font-black font-mono text-white tracking-tight">
                    {stats.predictionsCount.won} W - {stats.predictionsCount.lost} L
                  </span>
                </div>
              </div>

            </div>

            {/* Income Allocation Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-zinc-900/40 border border-zinc-850 p-6 rounded-2xl shadow">
                <h3 className="font-bold text-sm uppercase tracking-wide text-zinc-400 mb-4 font-mono">Revenue Breakdown By ODDS Category</h3>
                <div className="space-y-4">
                  {packages.map(pkg => {
                    const rev = stats.packageRevenue[pkg.id] || 0;
                    const percent = stats.totalRevenue > 0 ? (rev / stats.totalRevenue) * 100 : 0;
                    return (
                      <div key={pkg.id} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-zinc-300 font-sans">{pkg.name} Package</span>
                          <span className="font-mono text-amber-400">TZS {rev.toLocaleString()} ({percent.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-zinc-800/80 rounded-full h-2 overflow-hidden border border-zinc-800">
                          <div className="bg-gradient-to-r from-amber-500 to-yellow-400 h-2 rounded-full" style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-zinc-900/40 border border-zinc-850 p-6 rounded-2xl shadow flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wide text-zinc-400 mb-2 font-mono">Odds Slip Resolver Metrics</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Total predictions: {stats.predictionsCount.total}. Keep your winning accuracy above 85% to grow your premium customer renewals daily!
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center mt-6">
                  <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase font-mono mb-1">Pending</div>
                    <div className="text-xl font-black text-zinc-400 font-mono">{stats.predictionsCount.pending}</div>
                  </div>
                  <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-emerald-400">
                    <div className="text-[10px] text-emerald-500/80 uppercase font-mono mb-1">Won Slips</div>
                    <div className="text-xl font-black font-mono">{stats.predictionsCount.won}</div>
                  </div>
                  <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-red-400">
                    <div className="text-[10px] text-red-500/80 uppercase font-mono mb-1">Lost Slips</div>
                    <div className="text-xl font-black font-mono">{stats.predictionsCount.lost}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PREDICTIONS PANEL (CREATE / EDIT / RESOLVE) */}
        {activeTab === "predictions" && (
          <div className="space-y-8" id="predictions-tab-view">
            
            {/* Create Slip Section */}
            <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl shadow">
              <h3 className="text-lg font-black tracking-tight text-[#00E676] mb-4 uppercase">Create New Betting Prediction</h3>
              
              <form onSubmit={handleCreatePrediction} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wide mb-2">Target Package</label>
                  <select
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-[#00E676] font-bold"
                    value={newPred.package_id}
                    onChange={e => setNewPred({ ...newPred, package_id: e.target.value })}
                  >
                    {packages.map(p => (
                      <option key={p.id} value={p.id}>{p.name} Package</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wide mb-2">League Information</label>
                  <input
                    type="text"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-[#00E676]"
                    placeholder="e.g. English Premier League, Serie A"
                    value={newPred.league}
                    onChange={e => setNewPred({ ...newPred, league: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wide mb-2">Match Kickoff Time (UTC)</label>
                  <input
                    type="datetime-local"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-[#00E676]"
                    value={newPred.match_time}
                    onChange={e => setNewPred({ ...newPred, match_time: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wide mb-2">Home Team</label>
                  <input
                    type="text"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-[#00E676]"
                    placeholder="Chelsea"
                    value={newPred.home_team}
                    onChange={e => setNewPred({ ...newPred, home_team: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wide mb-2">Away Team</label>
                  <input
                    type="text"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-[#00E676]"
                    placeholder="Arsenal"
                    value={newPred.away_team}
                    onChange={e => setNewPred({ ...newPred, away_team: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wide mb-2">Prediction Bet Tip</label>
                  <input
                    type="text"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-[#00E676]"
                    placeholder="GG (Both Teams To Score) / Home Win"
                    value={newPred.prediction}
                    onChange={e => setNewPred({ ...newPred, prediction: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wide mb-2">Odds Information</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-[#00E676]"
                    placeholder="1.85"
                    value={newPred.odds}
                    onChange={e => setNewPred({ ...newPred, odds: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wide mb-2">Confidence Level (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-[#00E676]"
                    placeholder="90"
                    value={newPred.confidence}
                    onChange={e => setNewPred({ ...newPred, confidence: e.target.value })}
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wide mb-2">Scout Analysis & Team News breakdown</label>
                  <textarea
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-[#00E676] h-24"
                    placeholder="Provide depth team statistics, injury logs, or goal indices..."
                    value={newPred.analysis}
                    onChange={e => setNewPred({ ...newPred, analysis: e.target.value })}
                  ></textarea>
                </div>

                <div className="md:col-span-3">
                  <button
                    type="submit"
                    className="w-full md:w-auto px-8 py-3.5 bg-[#00E676] hover:bg-[#00C853] text-black font-black text-sm uppercase tracking-wide rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    Publish Premium Tip
                  </button>
                </div>
              </form>
            </div>

            {/* List and manage predictions */}
            <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl shadow">
              <h3 className="text-lg font-black tracking-tight text-amber-500 mb-4 uppercase">Manage Existing Predictions Slips</h3>
              
              <div className="space-y-4">
                {predictions.map(pred => {
                  const isEditing = editingPredId === pred.id;

                  return (
                    <div
                      key={pred.id}
                      className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all flex flex-col md:flex-row justify-between gap-6"
                      id={`adm-pred-${pred.id}`}
                    >
                      {isEditing ? (
                        /* Editing form */
                        <form onSubmit={handleSaveEditPrediction} className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-3 font-semibold text-xs text-amber-500">Editing Betting Slip: {pred.id}</div>
                          
                          <input
                            type="text"
                            className="bg-zinc-900 text-sm border border-zinc-750 p-2 rounded"
                            value={editPredData.league}
                            onChange={e => setEditPredData({ ...editPredData, league: e.target.value })}
                            placeholder="League"
                          />
                          <input
                            type="text"
                            className="bg-zinc-900 text-sm border border-zinc-750 p-2 rounded"
                            value={editPredData.home_team}
                            onChange={e => setEditPredData({ ...editPredData, home_team: e.target.value })}
                            placeholder="Home Team"
                          />
                          <input
                            type="text"
                            className="bg-zinc-900 text-sm border border-zinc-750 p-2 rounded"
                            value={editPredData.away_team}
                            onChange={e => setEditPredData({ ...editPredData, away_team: e.target.value })}
                            placeholder="Away Team"
                          />
                          <input
                            type="text"
                            className="bg-zinc-900 text-sm border border-zinc-750 p-2 rounded"
                            value={editPredData.prediction}
                            onChange={e => setEditPredData({ ...editPredData, prediction: e.target.value })}
                            placeholder="Tip prediction"
                          />
                          <input
                            type="number"
                            step="0.01"
                            className="bg-zinc-900 text-sm border border-zinc-750 p-2 rounded"
                            value={editPredData.odds}
                            onChange={e => setEditPredData({ ...editPredData, odds: e.target.value })}
                            placeholder="Odds"
                          />
                          <input
                            type="number"
                            className="bg-zinc-900 text-sm border border-zinc-750 p-2 rounded"
                            value={editPredData.confidence}
                            onChange={e => setEditPredData({ ...editPredData, confidence: e.target.value })}
                            placeholder="Confidence"
                          />
                          <textarea
                            className="bg-zinc-900 text-sm border border-zinc-750 p-2 rounded md:col-span-3 h-16"
                            value={editPredData.analysis}
                            onChange={e => setEditPredData({ ...editPredData, analysis: e.target.value })}
                            placeholder="Analysis"
                          ></textarea>

                          <div className="md:col-span-3 flex gap-2 justify-end">
                            <button
                              type="submit"
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-1.5 px-4 rounded"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingPredId(null)}
                              className="bg-zinc-800 text-zinc-400 font-bold text-xs py-1.5 px-4 rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        /* Standard display with resolve triggers */
                        <>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-zinc-900 text-zinc-500 border border-zinc-800 px-2 py-0.5 rounded uppercase font-mono tracking-wider font-bold">
                                {pred.package_id === "odds5" && "ODDS 5"}
                                {pred.package_id === "odds10" && "ODDS 10"}
                                {pred.package_id === "odds20" && "ODDS 20"}
                                {pred.package_id === "odds30" && "ODDS 30"}
                              </span>
                              <span className="text-xs text-zinc-400 font-semibold">{pred.league}</span>
                            </div>
                            <h4 className="text-base font-bold text-zinc-200">
                              {pred.home_team} v {pred.away_team}
                            </h4>
                            <p className="text-xs text-zinc-500 leading-relaxed italic">{pred.prediction} • Odds: {pred.odds.toFixed(2)} • Confidence: {pred.confidence}%</p>
                          </div>

                          <div className="flex items-center gap-3 self-center">
                            {/* Resolve Outcomes */}
                            {pred.status === "pending" ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleResolvePrediction(pred.id, "won")}
                                  className="p-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-xs font-bold"
                                  title="Mark Won"
                                >
                                  <CheckCircle2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleResolvePrediction(pred.id, "lost")}
                                  className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg text-xs font-bold"
                                  title="Mark Lost"
                                >
                                  <XCircle size={16} />
                                </button>
                              </div>
                            ) : (
                              <span className={`px-2 py-0.5 rounded text-xxs font-black tracking-wider uppercase border border-opacity-35 ${
                                pred.status === "won" 
                                  ? "bg-green-500/10 border-green-500/40 text-green-400" 
                                  : "bg-red-500/10 border-red-500/40 text-red-400"
                              }`}>
                                {pred.status}
                              </span>
                            )}

                            {/* Editing Controls */}
                            <button
                              onClick={() => startEditPred(pred)}
                              className="p-1.5 bg-zinc-900 border border-zinc-800 hover:text-amber-400 rounded-lg text-zinc-400 transition-colors"
                              title="Edit Slip"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeletePrediction(pred.id)}
                              className="p-1.5 bg-zinc-900 border border-zinc-800 hover:text-red-400 rounded-lg text-zinc-400 transition-colors"
                              title="Delete Slip"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: USER VIP ACCOUNTS */}
        {activeTab === "users" && (
          <div className="space-y-6" id="users-tab-view">
            
            {/* Force Manual Grant Form */}
            <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl shadow">
              <h3 className="text-base font-black text-amber-400 uppercase mb-4">Grant Free VIP Package Access (Administrative override)</h3>
              
              <form onSubmit={handleManualActivate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 tracking-wide uppercase mb-2">Target User</label>
                  <select
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-300 font-bold focus:outline-none"
                    value={manualGrant.userId}
                    onChange={e => setManualGrant({ ...manualGrant, userId: e.target.value })}
                  >
                    <option value="">-- Choose User --</option>
                    {usersList.filter(u => u.role !== "admin").map(u => (
                      <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 tracking-wide uppercase mb-2">Target VIP Package</label>
                  <select
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-300 font-bold focus:outline-none"
                    value={manualGrant.packageId}
                    onChange={e => setManualGrant({ ...manualGrant, packageId: e.target.value })}
                  >
                    {packages.map(p => (
                      <option key={p.id} value={p.id}>{p.name} Package</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 tracking-wide uppercase mb-2">Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
                    value={manualGrant.days}
                    onChange={e => setManualGrant({ ...manualGrant, days: Number(e.target.value) })}
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow h-fit"
                >
                  Activate VIP Link
                </button>
              </form>
            </div>

            {/* Registered Users Table */}
            <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl shadow overflow-hidden">
              <h3 className="text-base font-black text-amber-500 uppercase mb-4">Registered Premium Bettors List</h3>
              
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 uppercase text-zinc-500 font-mono tracking-widest py-2">
                      <th className="py-3 px-4">Username</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Subscribed VIP Packs</th>
                      <th className="py-3 px-4">Join Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((usr: any) => (
                      <tr key={usr.id} className="border-b border-zinc-900/65 py-2.5 bg-zinc-950/20 hover:bg-zinc-900/20" id={`adm-usr-row-${usr.id}`}>
                        <td className="py-3 px-4 font-bold text-zinc-100">{usr.username}</td>
                        <td className="py-3 px-4 font-mono text-zinc-400">{usr.email}</td>
                        <td className="py-3 px-4 uppercase font-bold text-xxs">
                          <span className={`px-2 py-0.5 rounded ${
                            usr.role === "admin" ? "bg-amber-500/25 border border-amber-500/40 text-amber-400" : "bg-zinc-800 text-zinc-500"
                          }`}>
                            {usr.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {usr.active_packages && usr.active_packages.length > 0 ? (
                            <div className="flex gap-1.5 flex-wrap">
                              {usr.active_packages.map((pk: string) => (
                                <span key={pk} className="bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">
                                  {pk.toUpperCase()}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-zinc-600 font-mono text-xxs">NO VIP PACKAGE active</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-zinc-500">{new Date(usr.registered_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: PESAPAL INVOICES / PAYMENTS */}
        {activeTab === "payments" && (
          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl shadow" id="payments-tab-view">
            <h3 className="text-lg font-black tracking-tight text-amber-400 mb-4 uppercase">PesaPal Payments Log History</h3>
            
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 font-mono uppercase tracking-widest">
                    <th className="py-3.5 px-4">Reference</th>
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-4">Package ID</th>
                    <th className="py-3.5 px-4">Invoiced Cost</th>
                    <th className="py-3.5 px-4">Gate Method</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Action Overrides</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(pay => {
                    const matchedUsr = usersList.find(u => u.id === pay.user_id);
                    return (
                      <tr key={pay.id} className="border-b border-zinc-900 py-2.5 hover:bg-zinc-900/15" id={`pay-invoice-row-${pay.id}`}>
                        <td className="py-3.5 px-4 font-mono text-zinc-300 font-bold">{pay.reference}</td>
                        <td className="py-3.5 px-4 leading-normal">
                          <span className="block font-bold text-zinc-200">{matchedUsr?.username || "Unknown user"}</span>
                          <span className="block text-xxs text-zinc-500 font-mono">{matchedUsr?.email || "Unknown"}</span>
                        </td>
                        <td className="py-3.5 px-4 uppercase font-bold font-mono text-xxs text-amber-400">{pay.package_id}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-zinc-300">{pay.currency} {pay.amount.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-zinc-500 font-mono text-[10px]">{pay.method}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                            pay.status === "completed" 
                              ? "bg-green-500/10 border-green-500/40 text-green-400" 
                              : pay.status === "failed"
                                ? "bg-red-500/10 border-red-500/40 text-red-400"
                                : "bg-yellow-500/10 border-yellow-500/40 text-yellow-400"
                          }`}>
                            {pay.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {pay.status === "pending" && (
                            <button
                              onClick={() => handleForceCompletePayment(pay.reference)}
                              className="px-3 py-1.5 bg-gradient-to-r from-emerald-500/90 to-emerald-600 text-black text-[10px] font-black uppercase rounded shadow hover:scale-105 transition-transform"
                            >
                              Verify / Complete
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* TAB 5: AD SYSTEM CONTROL */}
        {activeTab === "ads" && (
          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl shadow space-y-6" id="ads-tab-view">
            <h3 className="text-lg font-black tracking-tight text-amber-500 mb-2 uppercase">Core Advertising & Video Ads Campaign Integrator</h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4 max-w-2xl">
              Turn campaigns ON/OFF instantly, customize targeted link outs for Gal Sport Betting, Premier Bet or visual affiliate platforms to capitalize on normal traffic visits.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ads.map(ad => (
                <div
                  key={ad.id}
                  className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl space-y-4"
                  id={`adm-ad-card-${ad.id}`}
                >
                  <div className="flex justify-between items-center bg-zinc-900/40 p-3 rounded-lg border border-zinc-850">
                    <span className="text-xxs uppercase font-mono tracking-widest text-zinc-400 font-bold block">{ad.type} AD SPACE</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ad.active}
                        onChange={e => handleToggleAd(ad.id, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-black"></div>
                    </label>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Ad Header Title</span>
                      <p className="text-sm font-semibold text-zinc-200">{ad.title}</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Destination URL / Deep Link</span>
                      <p className="text-xs text-zinc-400 font-mono select-all truncate">{ad.destination_url}</p>
                    </div>

                    <div className="h-20 bg-zinc-900 border border-zinc-850 rounded-lg overflow-hidden flex items-center">
                      <img src={ad.image_url} alt="" className="w-20 h-full object-cover border-r border-zinc-850" referrerPolicy="no-referrer" />
                      <div className="p-3">
                        <span className="text-xxs text-zinc-500 block">Graphic Frame Link</span>
                        <span className="text-xs font-mono text-zinc-300 select-all tracking-tight truncate max-w-[200px] block">{ad.image_url}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* TAB 6: KEYS & SETTINGS */}
        {activeTab === "settings" && settings && (
          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl shadow" id="settings-tab-view">
            <h3 className="text-lg font-black tracking-tight text-amber-400 mb-4 uppercase">Portal Integrations & Packages pricing API</h3>
            
            <form onSubmit={handleSaveSettings} className="space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Sports API Config */}
                <div className="space-y-4">
                  <h4 className="text-xs uppercase tracking-widest text-amber-500 font-bold font-mono border-b border-zinc-800 pb-2">Sports Football API</h4>
                  
                  <div>
                    <label className="block text-xxs font-bold text-zinc-400 uppercase mb-2">Sports API Football Key (v3)</label>
                    <input
                      type="password"
                      className="w-full bg-zinc-950 border border-zinc-805 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-mono"
                      placeholder="Enter Football-API Token key (e.g. RAPIDAPI)"
                      value={settings.football_api_key}
                      onChange={e => setSettings({ ...settings, football_api_key: e.target.value })}
                    />
                    <span className="text-[10px] text-zinc-500 mt-1 block">Key keeps server requests securely authenticated. Default is live simulation model.</span>
                  </div>
                </div>

                {/* PesaPal Gateway Config */}
                <div className="space-y-4">
                  <h4 className="text-xs uppercase tracking-widest text-amber-500 font-bold font-mono border-b border-zinc-800 pb-2">PesaPal Tanzania Gateway</h4>
                  
                  <div>
                    <label className="block text-xxs font-bold text-zinc-400 uppercase mb-2">PesaPal Consumer Key</label>
                    <input
                      type="text"
                      className="w-full bg-zinc-950 border border-zinc-805 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-mono"
                      placeholder="Enter Consumer Key"
                      value={settings.pesapal_consumer_key}
                      onChange={e => setSettings({ ...settings, pesapal_consumer_key: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-zinc-400 uppercase mb-2">PesaPal secret Key</label>
                    <input
                      type="password"
                      className="w-full bg-zinc-950 border border-zinc-805 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-mono"
                      placeholder="Enter Consumer Secret"
                      value={settings.pesapal_consumer_secret}
                      onChange={e => setSettings({ ...settings, pesapal_consumer_secret: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center gap-4 py-1">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.is_pesapal_sandbox}
                        onChange={e => setSettings({ ...settings, is_pesapal_sandbox: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-black"></div>
                    </label>
                    <div>
                      <span className="text-xs font-bold text-zinc-300 block">Sandbox Mode enabled</span>
                      <span className="text-[10px] text-zinc-500 block">Forces mobile simulation verification when completing transactions</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Toggle general controls */}
              <div className="space-y-4 border-t border-zinc-850 pt-6">
                <h4 className="text-xs uppercase tracking-widest text-[#00E676] font-bold font-mono">General App Features Toggle</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  
                  <div className="bg-zinc-950/80 p-4 border border-zinc-800 rounded-xl flex items-center justify-between col-span-1 md:col-span-4">
                    <div>
                      <span className="text-xs font-bold text-zinc-200 block">Maintenance mode</span>
                      <span className="text-[10px] text-zinc-500">Block customer client access during system upgrades</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.maintenance_mode}
                      onChange={e => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                      className="accent-[#00E676] w-4 h-4 cursor-pointer"
                    />
                  </div>

                </div>
              </div>

              {/* Form submit */}
              <div className="border-t border-zinc-850 pt-6 flex justify-end">
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg"
                >
                  Save Integration settings
                </button>
              </div>

            </form>
          </div>
        )}

        {/* TAB: SUPABASE PROFILES AND TABLES SCHEMAS */}
        {activeTab === "supabase" && (
          <div className="bg-zinc-900/40 border border-zinc-805 rounded-3xl p-6 shadow-xl space-y-4 animate-fade-in" id="admin-supabase-view">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-zinc-850 pb-4">
              <div>
                <h3 className="text-base font-black text-amber-400 flex items-center gap-2 uppercase tracking-tight">
                  <BookOpen size={16} />
                  Production Supabase Schema Setup & RLS Policies
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-normal">
                  Ready-to-use transactional script representing all 9 relational structures. Copy and paste directly to Supabase SQL editor.
                </p>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(sqlText);
                  setSqlCopied(true);
                  setTimeout(() => setSqlCopied(false), 2000);
                }}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-xs uppercase rounded-lg shadow-md flex items-center gap-1.5 self-start sm:self-auto hover:from-amber-400 hover:to-amber-500"
                id="copy-sql-adm-btn"
              >
                {sqlCopied ? <Check size={14} /> : <Copy size={14} />}
                <span>{sqlCopied ? "Copied SQL!" : "Copy SQL Script"}</span>
              </button>
            </div>

            <div className="relative">
              <pre className="p-4 bg-black rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed text-zinc-300 max-h-96 select-all scrollbar-thin border border-zinc-850">
                {sqlText || "-- Retrieving tables schema..."}
              </pre>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
