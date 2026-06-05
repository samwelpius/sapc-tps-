/**
 * SAPC TPS Type Definitions
 */

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'user';
  registered_at: string;
}

export interface Package {
  id: string;
  name: string;
  price: number; // in TZS
  odds_target: number; // e.g. 5, 10, 20, 30
  description: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  package_id: string;
  status: 'active' | 'expired';
  start_date: string;
  expiry_date: string;
}

export interface Payment {
  id: string;
  user_id: string;
  package_id: string;
  amount: number;
  currency: string; // TZS
  status: 'pending' | 'completed' | 'failed';
  reference: string;
  paid_at: string | null;
  method: string;
}

export interface Prediction {
  id: string;
  package_id: string; // 'odds5' | 'odds10' | 'odds20' | 'odds30'
  home_team: string;
  away_team: string;
  league: string;
  match_time: string;
  prediction: string; // e.g. Home Win, Over 2.5
  odds: number;
  confidence: number; // 0-100 percentage
  analysis: string;
  status: 'pending' | 'won' | 'lost';
  created_at: string;
  locked?: boolean;
}

export interface Ad {
  id: string;
  type: 'banner' | 'popup' | 'video';
  title: string;
  image_url: string;
  video_url?: string;
  destination_url: string;
  active: boolean;
  frequency: number; // in seconds or actions
}

export interface AppSettings {
  football_api_key: string;
  pesapal_consumer_key: string;
  pesapal_consumer_secret: string;
  is_pesapal_sandbox: boolean;
  banner_ads_enabled: boolean;
  popup_ads_enabled: boolean;
  video_ads_enabled: boolean;
  maintenance_mode: boolean;
}

export interface LiveMatch {
  id: string;
  home_team: string;
  away_team: string;
  home_logo?: string;
  away_logo?: string;
  league: string;
  home_score: number;
  away_score: number;
  status: string; // '1H', '2H', 'HT', 'FT', 'NS'
  minute?: number;
  match_time: string;
  predictions?: string;
}

export interface LeagueStanding {
  position: number;
  team: string;
  logo?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  goals_diff: number;
}
