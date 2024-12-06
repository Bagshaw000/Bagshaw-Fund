export interface tickDataInterface {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  D1: [];
  H4: [];
  H1: [];
  M30: [];
  M15: [];
  M5: [];
  M1: [];
}

//Use the omit utlity type to segment them
export type d1TickData = Omit<
  tickDataInterface,
  "H4" | "H1" | "M30" | "M15" | "M5" | "M1"
>;

export type h4TickData = Omit<
  tickDataInterface,
  "D1" | "H1" | "M30" | "M15" | "M5" | "M1"
>;

export type h1TickData = Omit<
  tickDataInterface,
  "D1" | "H4" | "M30" | "M15" | "M5" | "M1"
>;

export type m30TickData = Omit<
  tickDataInterface,
  "D1" | "H1" | "H4" | "M15" | "M5" | "M1"
>;

export type m15TickData = Omit<
  tickDataInterface,
  "D1" | "H1" | "M30" | "H4" | "M5" | "M1"
>;

export type m5TickData = Omit<
  tickDataInterface,
  "D1" | "H1" | "M30" | "M15" | "H4" | "M1"
>;

export type m1TickData = Omit<
  tickDataInterface,
  "D1" | "H1" | "M30" | "M15" | "M5" | "H4"
>;
