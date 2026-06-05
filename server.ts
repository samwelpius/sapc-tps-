import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { PesaPalService } from "./src/lib/pesapal";
import { 
  User, Package, Subscription, Payment, Prediction, Ad, AppSettings, LiveMatch, LeagueStanding 
} from "./src/types";

// Setup types for Database schema
interface Database {
  users: User[];
  passwords: Record<string, string>; // user_id -> password
  packages: Package[];
  subscriptions: Subscription[];
  payments: Payment[];
  predictions: Prediction[];
  ads: Ad[];
  settings: AppSettings;
}

const DB_FILE = path.join(process.cwd(), "db.json");

// Default seeding of DB
const DEFAULT_DB: Database = {
  users: [
    {
      id: "admin-1",
      email: "djafloekemoda@gmail.com",
      username: "SAPC Admin",
      role: "admin",
      registered_at: new Date("2026-05-01T12:00:00Z").toISOString()
    },
    {
      id: "u-1",
      email: "customer1@gmail.com",
      username: "Tanzania Bettor",
      role: "user",
      registered_at: new Date("2026-06-01T08:30:00Z").toISOString()
    }
  ],
  passwords: {
    "admin-1": "samwerip20",
    "u-1": "password123"
  },
  packages: [
    {
      id: "odds5",
      name: "ODDS 5",
      price: 3000,
      odds_target: 5,
      description: "Daily selection of highly analytical matches totaling 5+ odds. Perfect for a steady grow strategy."
    },
    {
      id: "odds10",
      name: "ODDS 10",
      price: 5000,
      odds_target: 10,
      description: "Supercharged selection curated with high defense and attack correlation. Targeted 10+ odds."
    },
    {
      id: "odds20",
      name: "ODDS 20",
      price: 10000,
      odds_target: 20,
      description: "Weekend and midweek special booster predictions containing higher risks with 20+ yields."
    },
    {
      id: "odds30",
      name: "ODDS 30",
      price: 15000,
      odds_target: 30,
      description: "Exclusive VIP Golden ticket package. Combines multiple exact scores, Halftime/Fulltime tips, targeting 30+ odds."
    }
  ],
  subscriptions: [
    {
      id: "sub-1",
      user_id: "u-1",
      package_id: "odds5",
      status: "active",
      start_date: new Date().toISOString(),
      expiry_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24H from now
    }
  ],
  payments: [
    {
      id: "pay-1",
      user_id: "u-1",
      package_id: "odds5",
      amount: 3000,
      currency: "TZS",
      status: "completed",
      reference: "PESA-Z93019X",
      paid_at: new Date().toISOString(),
      method: "PesaPal (M-Pesa)"
    }
  ],
  predictions: [
    // ODDS 5
    {
      id: "pred-1",
      package_id: "odds5",
      home_team: "Chelsea",
      away_team: "Newcastle",
      league: "English Premier League",
      match_time: "2026-06-05T15:00:00Z",
      prediction: "Both Teams To Score (GG)",
      odds: 1.65,
      confidence: 88,
      analysis: "Chelsea has converted GG in 8 of their last 10 home matches. Newcastle has a strong counter-attack and scored in 9 of their last 10 games.",
      status: "pending",
      created_at: new Date().toISOString()
    },
    {
      id: "pred-2",
      package_id: "odds5",
      home_team: "Real Madrid",
      away_team: "Valencia",
      league: "Spanish La Liga",
      match_time: "2026-06-05T19:00:00Z",
      prediction: "Real Madrid Win & Over 1.5 Goals",
      odds: 1.45,
      confidence: 90,
      analysis: "Real Madrid needs a win to seal the league leadership. In their last 5 matchups at the Bernabeu against Valencia, Madrid averages 2.4 goals per match.",
      status: "pending",
      created_at: new Date().toISOString()
    },
    {
      id: "pred-3",
      package_id: "odds5",
      home_team: "Juventus",
      away_team: "Lazio",
      league: "Italian Serie A",
      match_time: "2026-06-05T18:45:00Z",
      prediction: "Juventus Win",
      odds: 2.10,
      confidence: 76,
      analysis: "Lazio currently struggles with their away form, losing 4 of their last 5 away matches. Juventus enters full strength.",
      status: "pending",
      created_at: new Date().toISOString()
    },
    // HISTORICAL WINS
    {
      id: "pred-hist-1",
      package_id: "odds10",
      home_team: "Arsenal",
      away_team: "Brighton",
      league: "English Premier League",
      match_time: "2026-06-04T12:00:00Z",
      prediction: "Arsenal (Home Win) & Over 2.5 Goals",
      odds: 1.95,
      confidence: 85,
      analysis: "Brighton is highly attacking but weak on transitions. Arsenal scored 3 against them recently.",
      status: "won",
      created_at: new Date(Date.now() - 48*60*60*1000).toISOString()
    },
    {
      id: "pred-hist-2",
      package_id: "odds10",
      home_team: "Bayern Munich",
      away_team: "RB Leipzig",
      league: "German Bundesliga",
      match_time: "2026-06-04T14:30:00Z",
      prediction: "Over 3.5 Goals",
      odds: 2.20,
      confidence: 82,
      analysis: "Both teams play hyper-offensive styles. Historically, encounters in Allianz Arena yield more than 4 goals.",
      status: "won",
      created_at: new Date(Date.now() - 48*60*60*1000).toISOString()
    },
    {
      id: "pred-hist-3",
      package_id: "odds10",
      home_team: "Monaco",
      away_team: "Nice",
      league: "French Ligue 1",
      match_time: "2026-06-04T17:00:00Z",
      prediction: "Monaco Over 1.5 Team Goals",
      odds: 1.85,
      confidence: 79,
      analysis: "Monaco's attack handles home fixtures with high precision. Nice is on positive goal conceded momentum.",
      status: "won",
      created_at: new Date(Date.now() - 48*60*60*1000).toISOString()
    }
  ],
  ads: [
    {
      id: "ad-banner-1",
      type: "banner",
      title: "Get TZS 50,000 Welcome Bonus with Gal Sport Betting!",
      image_url: "https://images.unsplash.com/photo-1518063319789-7217e6706b04?auto=format&fit=crop&q=80&w=1200",
      destination_url: "https://www.gsb.co.tz",
      active: true,
      frequency: 30
    },
    {
      id: "ad-popup-1",
      type: "popup",
      title: "VIP ODDS 30 GUARANTEED BOOSTER",
      image_url: "https://images.unsplash.com/photo-1540747737956-378724044af1?auto=format&fit=crop&q=80&w=600",
      destination_url: "#packages",
      active: true,
      frequency: 120
    }
  ],
  settings: {
    football_api_key: "",
    pesapal_consumer_key: "Okk9lo39iyyaDej/M/xKkn9QjTjGXT9v",
    pesapal_consumer_secret: "At0zBrq27siwtvqIj+/+oIV51K8=",
    is_pesapal_sandbox: false,
    banner_ads_enabled: false,
    popup_ads_enabled: false,
    video_ads_enabled: false,
    maintenance_mode: false
  }
};

// Database helper utilities
function readDB(): Database {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      const db = JSON.parse(data);
      // Force real production API credentials, LIVE production mode & disable ads
      db.settings.pesapal_consumer_key = "Okk9lo39iyyaDej/M/xKkn9QjTjGXT9v";
      db.settings.pesapal_consumer_secret = "At0zBrq27siwtvqIj+/+oIV51K8=";
      db.settings.is_pesapal_sandbox = false;
      db.settings.banner_ads_enabled = false;
      db.settings.popup_ads_enabled = false;
      db.settings.video_ads_enabled = false;
      writeDB(db);
      return db;
    }
  } catch (err) {
    console.error("Error reading database file", err);
  }
  // Initialize and save if not exists or error
  writeDB(DEFAULT_DB);
  return DEFAULT_DB;
}

function writeDB(data: Database) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database file", err);
  }
}

// Generate highly realistic live football center mock data mapping
const MOCK_LIVE_MATCHES: LiveMatch[] = [
  {
    id: "m-1",
    home_team: "Manchester City",
    away_team: "Manchester United",
    league: "English Premier League",
    home_score: 2,
    away_score: 1,
    status: "1H",
    minute: 38,
    match_time: "Live"
  },
  {
    id: "m-2",
    home_team: "Barcelona",
    away_team: "Atletico Madrid",
    league: "Spanish La Liga",
    home_score: 0,
    away_score: 0,
    status: "NS",
    match_time: "Today 22:00"
  },
  {
    id: "m-3",
    home_team: "AC Milan",
    away_team: "Inter Milan",
    league: "Italian Serie A",
    home_score: 1,
    away_score: 3,
    status: "FT",
    match_time: "Completed"
  },
  {
    id: "m-4",
    home_team: "Paris SG",
    away_team: "Marseille",
    league: "French Ligue 1",
    home_score: 1,
    away_score: 1,
    status: "2H",
    minute: 74,
    match_time: "Live"
  },
  {
    id: "m-5",
    home_team: "Liverpool",
    away_team: "Everton",
    league: "English Premier League",
    home_score: 0,
    away_score: 0,
    status: "NS",
    match_time: "Tomorrow 17:00"
  }
];

const MOCK_STANDINGS: LeagueStanding[] = [
  { position: 1, team: "Manchester City", played: 38, won: 28, drawn: 7, lost: 3, points: 91, goals_diff: 62 },
  { position: 2, team: "Arsenal", played: 38, won: 28, drawn: 5, lost: 5, points: 89, goals_diff: 60 },
  { position: 3, team: "Liverpool", played: 38, won: 24, drawn: 10, lost: 4, points: 82, goals_diff: 45 },
  { position: 4, team: "Aston Villa", played: 38, won: 20, drawn: 8, lost: 10, points: 68, goals_diff: 15 },
  { position: 5, team: "Tottenham", played: 38, won: 20, drawn: 6, lost: 12, points: 66, goals_diff: 13 },
  { position: 6, team: "Chelsea", played: 38, won: 18, drawn: 9, lost: 11, points: 63, goals_diff: 14 }
];

async function startServer() {
  const app = express();
  app.use(express.json());

  // Ensure DB initialized
  readDB();

  // Helper: check subscription status
  const checkSubscription = (userId: string, packageId: string): boolean => {
    const db = readDB();
    const activeSub = db.subscriptions.find(
      sub => sub.user_id === userId && 
             sub.package_id === packageId && 
             sub.status === "active" && 
             new Date(sub.expiry_date).getTime() > Date.now()
    );
    return !!activeSub;
  };

  // -------------------------------------------------------------
  // API ROUTES
  // -------------------------------------------------------------

  // --- AUTH ENDPOINTS ---
  app.post("/api/auth/register", (req, res) => {
    const { email, password, username } = req.body;
    if (!email || !password || !username) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const db = readDB();
    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    const userId = "u-" + Math.random().toString(36).substring(2, 11);
    const newUser: User = {
      id: userId,
      email: email.toLowerCase(),
      username,
      role: email.toLowerCase() === "djafloekemoda@gmail.com" ? "admin" : "user",
      registered_at: new Date().toISOString()
    };

    db.users.push(newUser);
    db.passwords[userId] = password;
    writeDB(db);

    res.status(201).json({ user: newUser });
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    const db = readDB();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const correctPassword = db.passwords[user.id];
    if (correctPassword !== password) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    res.json({ user });
  });

  app.post("/api/auth/forgot-password", (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const db = readDB();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(404).json({ error: "No user found with that email address" });
    }

    res.json({ message: "Password reset link sent successfully details. Please check your inbox (simulated)." });
  });

  app.put("/api/auth/profile", (req, res) => {
    const { userId, username, password, email } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const db = readDB();
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: "User not found" });
    }

    if (username) db.users[userIndex].username = username;
    if (email) db.users[userIndex].email = email.toLowerCase();
    if (password) db.passwords[userId] = password;

    writeDB(db);
    res.json({ user: db.users[userIndex], message: "Profile updated successfully" });
  });

  // --- PREDICTIONS ENDPOINTS ---
  app.get("/api/predictions", (req, res) => {
    const userId = req.query.userId as string;
    const db = readDB();

    // Normal users who aren't logged in see only LOCKED indicators or basic info.
    // Let's filter predictions based on user's active subscriptions or admin role
    const requestUser = db.users.find(u => u.id === userId);
    const isAdmin = requestUser?.role === "admin";

    const filtered = db.predictions.map(pred => {
      const isSubscribed = userId ? checkSubscription(userId, pred.package_id) : false;
      const hoursToMatch = (new Date(pred.match_time).getTime() - Date.now()) / (1000 * 60 * 60);

      // If matches completed or marked as won/lost, we can fully expose to enhance historical transparency!
      const isCompleted = pred.status !== "pending";

      if (isAdmin || isSubscribed || isCompleted) {
        return {
          ...pred,
          locked: false
        };
      } else {
        // Locked package structure
        return {
          id: pred.id,
          package_id: pred.package_id,
          league: pred.league,
          match_time: pred.match_time,
          odds: pred.odds,
          status: pred.status,
          home_team: pred.home_team,
          away_team: pred.away_team,
          created_at: pred.created_at,
          // Hide sensitive premium analysis & tips
          prediction: "Premium Tip (Locked)",
          confidence: 0,
          analysis: "Analyze betting options. Subscribe to the " + db.packages.find(p => p.id === pred.package_id)?.name + " package to unlock full master-tips coverage, exact metrics and team news breakdown.",
          locked: true
        };
      }
    });

    res.json(filtered);
  });

  app.post("/api/predictions", (req, res) => {
    const { 
      adminId, package_id, home_team, away_team, league, match_time, prediction, odds, confidence, analysis 
    } = req.body;

    const db = readDB();
    const adminUser = db.users.find(u => u.id === adminId);
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized access: Admin only" });
    }

    const newPred: Prediction = {
      id: "pred-" + Math.random().toString(36).substring(2, 11),
      package_id,
      home_team,
      away_team,
      league,
      match_time,
      prediction,
      odds: Number(odds),
      confidence: Number(confidence),
      analysis,
      status: "pending",
      created_at: new Date().toISOString()
    };

    db.predictions.unshift(newPred);
    writeDB(db);

    res.status(201).json(newPred);
  });

  app.put("/api/predictions/:id", (req, res) => {
    const { adminId, home_team, away_team, league, match_time, prediction, odds, confidence, analysis, status } = req.body;
    const { id } = req.params;

    const db = readDB();
    const adminUser = db.users.find(u => u.id === adminId);
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized access: Admin only" });
    }

    const index = db.predictions.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Prediction not found" });
    }

    const current = db.predictions[index];
    db.predictions[index] = {
      ...current,
      home_team: home_team !== undefined ? home_team : current.home_team,
      away_team: away_team !== undefined ? away_team : current.away_team,
      league: league !== undefined ? league : current.league,
      match_time: match_time !== undefined ? match_time : current.match_time,
      prediction: prediction !== undefined ? prediction : current.prediction,
      odds: odds !== undefined ? Number(odds) : current.odds,
      confidence: confidence !== undefined ? Number(confidence) : current.confidence,
      analysis: analysis !== undefined ? analysis : current.analysis,
      status: status !== undefined ? status : current.status
    };

    writeDB(db);
    res.json(db.predictions[index]);
  });

  app.delete("/api/predictions/:id", (req, res) => {
    const { adminId } = req.body;
    const { id } = req.params;

    const db = readDB();
    const adminUser = db.users.find(u => u.id === adminId);
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized access: Admin only" });
    }

    const lenBefore = db.predictions.length;
    db.predictions = db.predictions.filter(p => p.id !== id);
    if (db.predictions.length === lenBefore) {
      return res.status(404).json({ error: "Prediction not found" });
    }

    writeDB(db);
    res.json({ success: true, message: "Prediction deleted successfully" });
  });

  app.post("/api/predictions/:id/resolve", (req, res) => {
    const { adminId, status } = req.body; // 'won' or 'lost' or 'pending'
    const { id } = req.params;

    const db = readDB();
    const adminUser = db.users.find(u => u.id === adminId);
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    const index = db.predictions.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Prediction not found" });
    }

    db.predictions[index].status = status;
    writeDB(db);

    res.json(db.predictions[index]);
  });

  // --- PACKAGES ENDPOINTS ---
  app.get("/api/packages", (req, res) => {
    const db = readDB();
    res.json(db.packages);
  });

  app.put("/api/packages/:id", (req, res) => {
    const { adminId, price, name, description, odds_target } = req.body;
    const { id } = req.params;

    const db = readDB();
    const adminUser = db.users.find(u => u.id === adminId);
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    const index = db.packages.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Package not found" });
    }

    if (price !== undefined) db.packages[index].price = Number(price);
    if (name !== undefined) db.packages[index].name = name;
    if (description !== undefined) db.packages[index].description = description;
    if (odds_target !== undefined) db.packages[index].odds_target = Number(odds_target);

    writeDB(db);
    res.json(db.packages[index]);
  });

  // --- PAYMENTS & SUBSCRIPTIONS ---
  app.get("/api/payments/history", (req, res) => {
    const { userId } = req.query;
    const db = readDB();

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const user = db.users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role === "admin") {
      // Admin gets all payments
      return res.json(db.payments);
    } else {
      // Normal user gets only theirs
      const userPayments = db.payments.filter(p => p.user_id === userId);
      return res.json(userPayments);
    }
  });

  app.get("/api/subscriptions/active", (req, res) => {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const db = readDB();
    const userSubs = db.subscriptions.filter(
      sub => sub.user_id === userId && 
             sub.status === "active" && 
             new Date(sub.expiry_date).getTime() > Date.now()
    );

    res.json(userSubs);
  });

  // Helper utilities for payment resolving and status updates in the DB
  const resolvePaymentInDB = (reference: string, method: string, paidAt: string | null): any => {
    const db = readDB();
    const paymentIndex = db.payments.findIndex(p => p.reference === reference);
    if (paymentIndex === -1) return null;

    const payment = db.payments[paymentIndex];
    if (payment.status === "completed") return payment;

    db.payments[paymentIndex].status = "completed";
    db.payments[paymentIndex].paid_at = paidAt || new Date().toISOString();
    db.payments[paymentIndex].method = method || payment.method;

    const existingSubIndex = db.subscriptions.findIndex(
      s => s.user_id === payment.user_id && s.package_id === payment.package_id && s.status === "active"
    );

    let start = new Date();
    if (existingSubIndex !== -1) {
      const currentExpiry = new Date(db.subscriptions[existingSubIndex].expiry_date);
      if (currentExpiry.getTime() > Date.now()) {
        start = currentExpiry;
      }
    }

    const expiryTime = start.getTime() + 24 * 60 * 60 * 1000; // 24 Hours extension
    const end = new Date(expiryTime);

    if (existingSubIndex !== -1) {
      db.subscriptions[existingSubIndex].expiry_date = end.toISOString();
      db.subscriptions[existingSubIndex].status = "active";
    } else {
      const newSub: Subscription = {
        id: "sub-" + Math.random().toString(36).substring(2, 11),
        user_id: payment.user_id,
        package_id: payment.package_id,
        status: "active",
        start_date: start.toISOString(),
        expiry_date: end.toISOString()
      };
      db.subscriptions.push(newSub);
    }

    writeDB(db);
    return db.payments[paymentIndex];
  };

  const updatePaymentStatusInDB = (reference: string, status: "completed" | "pending" | "failed"): any => {
    const db = readDB();
    const paymentIndex = db.payments.findIndex(p => p.reference === reference);
    if (paymentIndex === -1) return null;

    db.payments[paymentIndex].status = status;
    writeDB(db);
    return db.payments[paymentIndex];
  };

  // --- AUTOMATED PESAPAL PAYMENTS EXPRESS HANDLER ---
  app.post("/api/payments/create", async (req, res) => {
    const { userId, packageId, method, phone } = req.body;
    if (!userId || !packageId) {
      return res.status(400).json({ error: "Missing required params: userId, packageId" });
    }

    const db = readDB();
    const user = db.users.find(u => u.id === userId);
    const pkg = db.packages.find(p => p.id === packageId);

    if (!user || !pkg) {
      return res.status(404).json({ error: "User or package not found" });
    }

    const reference = "SAPC-" + Math.floor(100000 + Math.random() * 900000);
    const payment: Payment = {
      id: "pay-" + Math.random().toString(36).substring(2, 11),
      user_id: userId,
      package_id: packageId,
      amount: pkg.price,
      currency: "TZS",
      status: "pending",
      reference,
      paid_at: null,
      method: method || "PesaPal (M-Pesa)"
    };

    db.payments.push(payment);
    writeDB(db);

    const apiConfig = db.settings;
    const consumerKey = apiConfig.pesapal_consumer_key || process.env.PESAPAL_CONSUMER_KEY;
    const consumerSecret = apiConfig.pesapal_consumer_secret || process.env.PESAPAL_CONSUMER_SECRET;
    const isSandbox = apiConfig.is_pesapal_sandbox !== false;

    if (consumerKey && consumerSecret) {
      try {
        const pps = new PesaPalService({
          consumerKey,
          consumerSecret,
          isSandbox
        });

        const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
        const host = req.headers["x-forwarded-host"] || req.get("host");
        const appUrl = `${protocol}://${host}`;

        // Step 1: Exchange keys for authorization JWT token
        const token = await pps.getAccessToken();

        // Step 2: Register dynamic server IPN on PesaPal on early startup cache
        const ipnId = await pps.getOrRegisterIPN(token, appUrl);

        // Step 3: Call PesaPal SubmitOrderRequest to obtain secure iframe portal checkout redirectUrl
        const orderRes = await pps.submitOrder(token, ipnId, {
          merchantReference: reference,
          amount: pkg.price,
          description: `SAPC Premium Football Tips - ${pkg.name}`,
          billingAddress: {
            email: user.email,
            phone: phone || "0754000000",
            firstName: user.username.split(" ")[0] || "VIP",
            lastName: user.username.split(" ")[1] || "Bettor"
          }
        }, appUrl);

        // Step 4: Map order_tracking_id to the payment record in the database
        const paymentIndex = db.payments.findIndex(p => p.id === payment.id);
        if (paymentIndex !== -1) {
          (db.payments[paymentIndex] as any).order_tracking_id = orderRes.orderTrackingId;
          writeDB(db);
        }

        return res.json({
          payment,
          hasRealKeys: true,
          isSandbox,
          orderTrackingId: orderRes.orderTrackingId,
          redirectUrl: orderRes.redirectUrl,
          message: "Secure PesaPal session initialized safely. Complete payment on official networks."
        });

      } catch (err: any) {
        console.error("[PesaPal Connection Warning] API handover failed. Falling back to sandbox checkout overlay:", err.message);
      }
    }

    // Secure fallback: redirects locally for live developer preview simulation when external networks offline
    res.json({
      payment,
      hasRealKeys: false,
      isSandbox: true,
      redirectUrl: `/payment/confirm?ref=${reference}`,
      message: "Order generated. Falling back to preview simulation (simulate payment successfully)."
    });
  });

  // --- AUTOMATED PESAPAL REDIRECT CALLBACK CONTROLLER ---
  app.get("/api/pesapal/callback", async (req, res) => {
    const orderTrackingId = req.query.OrderTrackingId as string;
    const orderMerchantReference = req.query.OrderMerchantReference as string;

    console.log(`[PesaPal Callback] Inbound customer redirect sequence tracking: ${orderTrackingId} for reference: ${orderMerchantReference}`);

    if (!orderTrackingId || !orderMerchantReference) {
      return res.redirect("/?payment_status=invalid");
    }

    const db = readDB();
    const apiConfig = db.settings;
    const consumerKey = apiConfig.pesapal_consumer_key || process.env.PESAPAL_CONSUMER_KEY;
    const consumerSecret = apiConfig.pesapal_consumer_secret || process.env.PESAPAL_CONSUMER_SECRET;
    const isSandbox = apiConfig.is_pesapal_sandbox !== false;

    try {
      const pps = new PesaPalService({
        consumerKey,
        consumerSecret,
        isSandbox
      });

      const token = await pps.getAccessToken();
      const checkStatus = await pps.getTransactionStatus(token, orderTrackingId);

      if (checkStatus.status === "completed") {
        resolvePaymentInDB(orderMerchantReference, checkStatus.paymentMethod, checkStatus.paidAt);
        return res.redirect(`/?payment_status=success&ref=${orderMerchantReference}`);
      } else if (checkStatus.status === "failed") {
        updatePaymentStatusInDB(orderMerchantReference, "failed");
        return res.redirect(`/?payment_status=failed&ref=${orderMerchantReference}`);
      } else {
        return res.redirect(`/?payment_status=pending&ref=${orderMerchantReference}`);
      }
    } catch (err: any) {
      console.error("[PesaPal Callback Verification Failed] Proceeding with sandbox fallback:", err.message);
      if (isSandbox) {
        resolvePaymentInDB(orderMerchantReference, "PesaPal Sandbox Auto-Approval", new Date().toISOString());
        return res.redirect(`/?payment_status=success&ref=${orderMerchantReference}`);
      }
      return res.redirect(`/?payment_status=error&ref=${orderMerchantReference}`);
    }
  });

  // --- AUTOMATED PESAPAL ASYNC WEBHOOK WEBPORT LISTENER (IPN) ---
  app.get("/api/pesapal/ipn", async (req, res) => {
    const orderTrackingId = req.query.OrderTrackingId as string;
    const orderMerchantReference = req.query.OrderMerchantReference as string;

    console.log(`[PesaPal Webhook IPN Notification] Received callback. OrderTrackingId: ${orderTrackingId}, Ref: ${orderMerchantReference}`);

    if (!orderTrackingId || !orderMerchantReference) {
      return res.status(400).json({ error: "Missing required query parameters" });
    }

    const db = readDB();
    const apiConfig = db.settings;
    const consumerKey = apiConfig.pesapal_consumer_key || process.env.PESAPAL_CONSUMER_KEY;
    const consumerSecret = apiConfig.pesapal_consumer_secret || process.env.PESAPAL_CONSUMER_SECRET;
    const isSandbox = apiConfig.is_pesapal_sandbox !== false;

    try {
      const pps = new PesaPalService({
        consumerKey,
        consumerSecret,
        isSandbox
      });

      const token = await pps.getAccessToken();
      const checkStatus = await pps.getTransactionStatus(token, orderTrackingId);

      if (checkStatus.status === "completed") {
        console.log(`[PesaPal IPN Webhook Activation] Approved completed payment for reference: ${orderMerchantReference}`);
        resolvePaymentInDB(orderMerchantReference, checkStatus.paymentMethod, checkStatus.paidAt);
      } else if (checkStatus.status === "failed") {
        updatePaymentStatusInDB(orderMerchantReference, "failed");
      }

      // Standard PesaPal v3 webhook receipt acknowledgement
      res.json({
        order_tracking_id: orderTrackingId,
        merchant_reference: orderMerchantReference,
        status: "200"
      });
    } catch (err: any) {
      console.warn("[PesaPal IPN Handler Warning] query failed safely: ", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // --- AUTOMATED POST-PAYMENT CLIENT VERIFICATION CHECK (POLLING / MANUAL VERIFY) ---
  app.post("/api/payments/verify-status", async (req, res) => {
    const { reference } = req.body;
    if (!reference) {
      return res.status(400).json({ error: "Reference parameter is required" });
    }

    const db = readDB();
    const payment = db.payments.find(p => p.reference === reference);
    if (!payment) {
      return res.status(404).json({ error: "Transaction payment log not found" });
    }

    if (payment.status === "completed") {
      return res.json({ status: "completed", message: "Subscription unlocked successfully!" });
    }

    const orderTrackingId = (payment as any).order_tracking_id;
    if (orderTrackingId) {
      const apiConfig = db.settings;
      const consumerKey = apiConfig.pesapal_consumer_key || process.env.PESAPAL_CONSUMER_KEY;
      const consumerSecret = apiConfig.pesapal_consumer_secret || process.env.PESAPAL_CONSUMER_SECRET;
      const isSandbox = apiConfig.is_pesapal_sandbox !== false;

      try {
        const pps = new PesaPalService({
          consumerKey,
          consumerSecret,
          isSandbox
        });

        const token = await pps.getAccessToken();
        const checkStatus = await pps.getTransactionStatus(token, orderTrackingId);

        if (checkStatus.status === "completed") {
          resolvePaymentInDB(reference, checkStatus.paymentMethod, checkStatus.paidAt);
          return res.json({ status: "completed", message: "Transaction completed! Package unlocked successfully!" });
        } else if (checkStatus.status === "failed") {
          updatePaymentStatusInDB(reference, "failed");
          return res.json({ status: "failed", message: "Transaction declined by carrier network." });
        } else {
          return res.json({ status: "pending", message: "Payment is still pending on PesaPal." });
        }
      } catch (err: any) {
        console.warn("[PesaPal Status Poll Error] API verify status failed: ", err.message);
      }
    }

    return res.json({ status: payment.status, message: `Status is: ${payment.status}` });
  });

  // Confirm payment via administrative overrides or virtual click
  app.post("/api/payments/confirm", (req, res) => {
    const { userId, reference, action } = req.body; // action = 'complete' or 'fail'
    if (!reference) {
      return res.status(400).json({ error: "Reference is required" });
    }

    const db = readDB();
    const paymentIndex = db.payments.findIndex(p => p.reference === reference);
    if (paymentIndex === -1) {
      return res.status(404).json({ error: "Payment transaction reference not found" });
    }

    if (action === "fail") {
      updatePaymentStatusInDB(reference, "failed");
      return res.json({ payment: db.payments[paymentIndex], success: false });
    }

    const payment = resolvePaymentInDB(reference, "Admin Override Approval", new Date().toISOString());
    res.json({ payment, success: true });
  });

  // Admin Manual Activate
  app.post("/api/payments/manual-activate", (req, res) => {
    const { adminId, targetUserId, packageId, days } = req.body;
    const db = readDB();

    const admin = db.users.find(u => u.id === adminId);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admin only" });
    }

    const user = db.users.find(u => u.id === targetUserId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const packageDurationMs = (days || 1) * 24 * 60 * 60 * 1000;
    const start = new Date();
    const end = new Date(Date.now() + packageDurationMs);

    // Create completed payment log
    const pkg = db.packages.find(p => p.id === packageId);
    const reference = "ADMIN-GRANTED-" + Math.floor(100000 + Math.random() * 900000);
    const payment: Payment = {
      id: "pay-manual-" + Math.random().toString(36).substring(2, 11),
      user_id: targetUserId,
      package_id: packageId,
      amount: pkg ? pkg.price * (days || 1) : 0,
      currency: "TZS",
      status: "completed",
      reference,
      paid_at: start.toISOString(),
      method: "Admin Override"
    };
    db.payments.push(payment);

    // Upsert subscription
    const reqPackageId = packageId;
    const subIndex = db.subscriptions.findIndex(
      s => s.user_id === targetUserId && s.package_id === reqPackageId
    );

    if (subIndex !== -1) {
      db.subscriptions[subIndex].expiry_date = end.toISOString();
      db.subscriptions[subIndex].status = "active";
    } else {
      const newSub: Subscription = {
        id: "sub-manual-" + Math.random().toString(36).substring(2, 11),
        user_id: targetUserId,
        package_id: reqPackageId,
        status: "active",
        start_date: start.toISOString(),
        expiry_date: end.toISOString()
      };
      db.subscriptions.push(newSub);
    }

    writeDB(db);
    res.json({ message: `Package ${packageId} successfully activated for user for ${days || 1} day(s).` });
  });

  // --- LIVE FOOTBALL ROUTER ---
  app.get("/api/football/matches", (req, res) => {
    // Return live matches. If API keys are set, in real deploy it would call sports football index,
    // otherwise fallback to beautiful fluctuating live board.
    res.json(MOCK_LIVE_MATCHES);
  });

  app.get("/api/football/standings", (req, res) => {
    res.json(MOCK_STANDINGS);
  });

  // --- ADS ROUTER ---
  app.get("/api/ads", (req, res) => {
    const db = readDB();
    res.json(db.ads);
  });

  app.put("/api/ads/:id", (req, res) => {
    const { adminId, active, title, image_url, destination_url, type } = req.body;
    const { id } = req.params;

    const db = readDB();
    const admin = db.users.find(u => u.id === adminId);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const index = db.ads.findIndex(a => a.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Ad not found" });
    }

    if (active !== undefined) db.ads[index].active = active;
    if (title !== undefined) db.ads[index].title = title;
    if (image_url !== undefined) db.ads[index].image_url = image_url;
    if (destination_url !== undefined) db.ads[index].destination_url = destination_url;
    if (type !== undefined) db.ads[index].type = type;

    writeDB(db);
    res.json(db.ads[index]);
  });

  // --- SETTINGS ROUTER ---
  app.get("/api/settings", (req, res) => {
    const { userId } = req.query;
    const db = readDB();

    const requester = db.users.find(u => u.id === userId);
    if (requester?.role === "admin") {
      // Full details to admin
      res.json(db.settings);
    } else {
      // Only public settings properties to regular customers
      res.json({
        banner_ads_enabled: db.settings.banner_ads_enabled,
        popup_ads_enabled: db.settings.popup_ads_enabled,
        video_ads_enabled: db.settings.video_ads_enabled,
        maintenance_mode: db.settings.maintenance_mode
      });
    }
  });

  app.post("/api/settings", (req, res) => {
    const { 
      adminId, 
      football_api_key, 
      pesapal_consumer_key, 
      pesapal_consumer_secret, 
      is_pesapal_sandbox,
      banner_ads_enabled,
      popup_ads_enabled,
      video_ads_enabled,
      maintenance_mode
    } = req.body;

    const db = readDB();
    const admin = db.users.find(u => u.id === adminId);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ error: "Admin authorized actions only" });
    }

    if (football_api_key !== undefined) db.settings.football_api_key = football_api_key;
    if (pesapal_consumer_key !== undefined) db.settings.pesapal_consumer_key = pesapal_consumer_key;
    if (pesapal_consumer_secret !== undefined) db.settings.pesapal_consumer_secret = pesapal_consumer_secret;
    if (is_pesapal_sandbox !== undefined) db.settings.is_pesapal_sandbox = is_pesapal_sandbox;
    if (banner_ads_enabled !== undefined) db.settings.banner_ads_enabled = banner_ads_enabled;
    if (popup_ads_enabled !== undefined) db.settings.popup_ads_enabled = popup_ads_enabled;
    if (video_ads_enabled !== undefined) db.settings.video_ads_enabled = video_ads_enabled;
    if (maintenance_mode !== undefined) db.settings.maintenance_mode = maintenance_mode;

    writeDB(db);
    res.json({ success: true, settings: db.settings });
  });

  // --- ADMIN STATISTICS ---
  app.get("/api/admin/users", (req, res) => {
    const { adminId } = req.query;
    const db = readDB();

    const admin = db.users.find(u => u.id === adminId);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    // Attach current active packages metadata to user records
    const usersWithSubs = db.users.map(user => {
      const userSubs = db.subscriptions
        .filter(s => s.user_id === user.id && s.status === "active" && new Date(s.expiry_date).getTime() > Date.now())
        .map(s => s.package_id);

      return {
        ...user,
        active_packages: userSubs
      };
    });

    res.json(usersWithSubs);
  });

  app.get("/api/admin/stats", (req, res) => {
    const { adminId } = req.query;
    const db = readDB();

    const admin = db.users.find(u => u.id === adminId);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const totalUsers = db.users.filter(u => u.role !== "admin").length;
    const totalRevenue = db.payments
      .filter(p => p.status === "completed")
      .reduce((acc, p) => acc + p.amount, 0);

    const activeSubscriptionsCount = db.subscriptions.filter(
      s => s.status === "active" && new Date(s.expiry_date).getTime() > Date.now()
    ).length;

    const completedPaymentsCount = db.payments.filter(p => p.status === "completed").length;
    const pendingPaymentsCount = db.payments.filter(p => p.status === "pending").length;

    // Predictions statistics
    const totals = db.predictions.length;
    const wonCount = db.predictions.filter(p => p.status === "won").length;
    const lostCount = db.predictions.filter(p => p.status === "lost").length;
    const pendingCount = db.predictions.filter(p => p.status === "pending").length;

    // Breakdown revenue by packages
    const packageRevenue: Record<string, number> = {
      odds5: 0,
      odds10: 0,
      odds20: 0,
      odds30: 0
    };

    db.payments.forEach(p => {
      if (p.status === "completed") {
        packageRevenue[p.package_id] = (packageRevenue[p.package_id] || 0) + p.amount;
      }
    });

    res.json({
      totalUsers,
      totalRevenue,
      activeSubscriptionsCount,
      completedPaymentsCount,
      pendingPaymentsCount,
      predictionsCount: {
        total: totals,
        won: wonCount,
        lost: lostCount,
        pending: pendingCount
      },
      packageRevenue
    });
  });

  // --- SUPABASE COMPATIBILITY SCHEMA DOCUMENTATION ENDPOINT ---
  app.get("/api/supabase-schema", (req, res) => {
    const schemaSql = `
-- SAPC TPS PostgreSQL / Supabase Schema Definition Let's setup RLS!

-- 1. Create Packages Table
CREATE TABLE IF NOT EXISTS packages (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  odds_target INTEGER NOT NULL,
  description TEXT
);

-- 2. Create Profiles / Users table (Extending Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Predictions Table
CREATE TABLE IF NOT EXISTS predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id VARCHAR(50) REFERENCES packages(id),
  home_team VARCHAR(150) NOT NULL,
  away_team VARCHAR(150) NOT NULL,
  league VARCHAR(100) NOT NULL,
  match_time TIMESTAMPTZ NOT NULL,
  prediction VARCHAR(255) NOT NULL,
  odds NUMERIC(5, 2) NOT NULL,
  confidence INTEGER NOT NULL CHECK (confidence BETWEEN 0 AND 100),
  analysis TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  package_id VARCHAR(50) REFERENCES packages(id),
  amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'TZS',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  reference VARCHAR(100) UNIQUE NOT NULL,
  paid_at TIMESTAMPTZ,
  method VARCHAR(50) DEFAULT 'PesaPal'
);

-- 5. Create Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  package_id VARCHAR(50) REFERENCES packages(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired')),
  start_date TIMESTAMPTZ DEFAULT NOW(),
  expiry_date TIMESTAMPTZ NOT NULL
);

-- 6. Create Ads Table
CREATE TABLE IF NOT EXISTS ads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('banner', 'popup', 'video')),
  title VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL,
  destination_url TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  frequency INTEGER DEFAULT 30
);

-- 7. App Settings Table
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL
);


-- ROW LEVEL SECURITY (RLS) INSTRUCTIONS FOR SUPABASE
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- EXAMPLE SQL RLS POLICIES FOR SECURE ACCESS
CREATE POLICY "Public profile view" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users edit own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Predictions RLS Rule: VIP Lock logic
CREATE POLICY "Subscribers can view predictions" ON predictions FOR SELECT 
USING (
  status != 'pending' OR 
  EXISTS (
    SELECT 1 FROM subscriptions s 
    WHERE s.user_id = auth.uid() 
    AND s.package_id = predictions.package_id 
    AND s.status = 'active' 
    AND s.expiry_date > NOW()
  ) OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
    `;
    res.setHeader("Content-Type", "text/plain");
    res.send(schemaSql);
  });

  // -------------------------------------------------------------
  // VITE / STATIC ASSET MIDDLEWARE FOR PRODUCTION
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SAPC TPS] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
