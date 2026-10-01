export interface SmartBin {
  id: string;
  name: string;
  location: string;
  status: 'Online' | 'Offline' | 'Maintenance';
  capacity_kg: number;
  current_weight_kg: number;
  fill_level_pct: number;
  temp_c: number;
  battery_pct: number;
  device_id: string;
  lid_status: 'Safe' | 'Open' | 'Leak Alert';
  last_comm_at: string;
}

export interface Deposit {
  id: string;
  bin_id: string;
  source_name: string;
  deposit_code: string;
  weight_kg: number;
  status: 'Verified' | 'Flagged' | 'Pending';
  deposited_at: string;
  formatted_time?: string;
}

export interface FeedstockAssessment {
  id: string;
  bin_id: string;
  status: string;
  details: string;
  predicted_ffa: number;
  lab_ffa: number;
  review_requested: boolean;
}

export interface PickupRequest {
  id: string;
  bin_id: string;
  requested_by: string;
  status: 'Pending' | 'Assigned' | 'In Transit' | 'Completed';
  current_fill_kg: number;
  priority: 'Low' | 'Standard' | 'Urgent';
  scheduled_for?: string;
  notes?: string;
  created_at: string;
}

export interface TrendPoint {
  label: string;
  time: string;
  weight: number;
}
