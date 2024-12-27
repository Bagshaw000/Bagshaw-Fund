export interface tickDataInterface {
  timestamp?: Date;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  parentTimestamp?: string;
  MN: Record<string, mnTickData>;
  D1: Record<string, d1TickData>;
  H4: Record<string, h4TickData>;
  H1: Record<string, h1TickData>;
  M30: Record<string, m30TickData>;
  M15: Record<string, m15TickData>;
  M5: Record<string, m5TickData>;
  M1: Record<string, m1TickData>;
}

export interface DayData {
  D1: h4TickData[]; // Array of H4 tick data for the day
}

export type mnTickData = Omit<
  tickDataInterface,
  "MN" | "H4" | "H1" | "M30" | "M15" | "M5" | "M1" | "D1"
>;
//Use the omit utlity type to segment them
export type d1TickData = Omit<
  tickDataInterface,
  "MN" | "D1" | "H1" | "M30" | "M15" | "M5" | "M1" | "H4" | "timestamp"
>;

export type h4TickData = Omit<
  tickDataInterface,
  "MN" | "D1" | "H1" | "H4" | "M30" | "M15" | "M5" | "M1" | "timestamp"
>;

export type h1TickData = Omit<
  tickDataInterface,
  "MN" | "D1" | "H4" | "H1" | "M30" | "M15" | "M5" | "M1" | "timestamp"
>;

export type m30TickData = Omit<
  tickDataInterface,
  "MN" | "D1" | "H1" | "H4" | "M30" | "M15" | "M5" | "M1" | "timestamp"
>;

export type m15TickData = Omit<
  tickDataInterface,
  "MN" | "D1" | "H1" | "M30" | "H4" | "M15" | "M5" | "M1" | "timestamp"
>;

export type m5TickData = Omit<
  tickDataInterface,
  "MN" | "D1" | "H1" | "M30" | "M15" | "H4" | "M5" | "M1" | "timestamp"
>;

export type m1TickData = Omit<
  tickDataInterface,
  "MN" | "D1" | "H1" | "M30" | "M15" | "M5" | "H4" | "M1" | "timestamp"
>;
