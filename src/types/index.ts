import { Timestamp } from 'firebase/firestore';

// ─── Firebase Models ───────────────────────────────────────────────

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  address: string;
  college: string;
  dressSize: string;
  shoeSize: string;
  instagram: string;
  retailWholesaleExperience: string;
  resumeURL: string;
  headshotURL: string;
  payRate: number;
  applicationFormCompleted: boolean;
  applicationFormApproved: boolean;
  skills: string[];
  role: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Client {
  id: string;
  name: string;
  companyName: string;
  email: string;
  website: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Show {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  location: string;
  venue: string;
  description: string;
  season: string;
  type: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DateNeed {
  date: string; // YYYY-MM-DD
  staffCount: number;
  staffIds: string[];
}

export interface Booking {
  id: string;
  clientId: string;
  showId: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  paymentStatus: string;
  notes: string;
  datesNeeded: DateNeed[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Availability {
  id: string;
  staffId: string;
  staffName: string;
  showId: string;
  showName: string;
  availableDates: string[];
  createdAt: Timestamp;
}

export interface Contact {
  id: string;
  clientId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

export interface Showroom {
  id: string;
  clientId: string;
  city: string;
  buildingNumber: string;
  floorNumber: string;
  boothNumber: string;
}

export interface BoardPost {
  id: string;
  text: string;
  mentions: Mention[];
  createdBy: string;
  completed: boolean;
  createdAt: Timestamp;
}

export interface BoardReply {
  id: string;
  postId: string;
  parentId: string | null;
  text: string;
  mentions: Mention[];
  createdBy: string;
  createdAt: Timestamp;
}

export interface Mention {
  id: string;
  type: string;
  label: string;
}

export interface Admin {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'manager';
  createdAt: Timestamp;
}

// ─── UI Types ──────────────────────────────────────────────────────

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type ShowStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface FilterState {
  search: string;
  [key: string]: string | string[] | boolean | undefined;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}
