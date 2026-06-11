export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type League = {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
};

export type LeagueMember = {
  league_id: string;
  user_id: string;
  points: number;
  joined_at: string;
};

export type LeaderboardEntry = {
  user_id: string;
  points: number;
  display_name: string | null;
  avatar_url: string | null;
  rank: number;
};

export type Match = {
  id: string;
  league_id: string;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  result_home: number | null;
  result_away: number | null;
  created_at: string;
};

export type Prediction = {
  id: string;
  match_id: string;
  user_id: string;
  predicted_home: number;
  predicted_away: number;
  points_earned: number;
  created_at: string;
  updated_at: string;
};

export type MatchWithPrediction = Match & {
  userPrediction: Prediction | null;
  isLocked: boolean;
  isFinished: boolean;
};
