import { getHistoricalRates } from "dukascopy-node";
import { db } from "./db";
import {
  mnTickData,
  d1TickData,
  h4TickData,
  h1TickData,
  m30TickData,
  m15TickData,
  m5TickData,
  m1TickData,
} from "./types";
import { doc, setDoc, writeBatch } from "firebase/firestore/lite";

// Function to fetch historical tick data from Dukascopy
async function getTickData(
  from: Date,
  to: Date,
  timeframe: "m1" | "m5" | "m15" | "m30" | "h1" | "h4" | "d1" | "mn1",
  symbol: "eurusd" | "gbpusd"
) {
  try {
    const data = await getHistoricalRates({
      instrument: symbol,
      dates: { from, to },
      timeframe,
      format: "csv",
    });
    console.log(data);
    return data;
  } catch (error) {
    console.error("Error fetching tick data:", error);
    throw error;
  }
}

// Function to partition and store tick data into Firestore

// Example usage of the storeData function
getTickData(new Date("2010-01-01"), new Date("2010-12-31"), "mn1", "gbpusd");
// getTickData(new Date("2010-01-01"), new Date("2010-12-31"), "d1", "gbpusd");
// getTickData(new Date("2010-01-01"), new Date("2010-12-31"), "h4", "gbpusd");
// getTickData(new Date("2010-01-01"), new Date("2010-12-31"), "h1", "gbpusd");
// getTickData(new Date("2010-01-01"), new Date("2010-12-31"), "m30", "gbpusd");
// getTickData(new Date("2010-01-01"), new Date("2010-12-31"), "m15", "gbpusd");
// getTickData(new Date("2010-01-01"), new Date("2010-12-31"), "m5", "gbpusd");
// getTickData(new Date("2010-01-01"), new Date("2010-12-31"), "m1", "gbpusd");
