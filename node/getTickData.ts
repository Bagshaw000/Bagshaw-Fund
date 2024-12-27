import { getHistoricalRates } from "dukascopy-node";
import { db, dbConnect } from "./db";
import {
  d1TickData,
  DayData,
  h1TickData,
  h4TickData,
  mnTickData,
  tickDataInterface,
} from "./types";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore/lite";

// Function to get tick data for a specified date range, timeframe, and symbol
async function getTickData(
  from: Date,
  to: Date,
  timeframe: "m1" | "m5" | "m15" | "m30" | "h1" | "h4" | "d1" | "mn1",
  symbol: "eurusd" | "gbpusd"
) {
  try {
    // Fetch historical rates from Dukascopy
    const data = await getHistoricalRates({
      instrument: symbol,
      dates: {
        from: from,
        to: to,
      },
      timeframe: timeframe,
      format: "json",
      // batchSize: 20,
      // pauseBetweenBatchesMs: 2000,
    });
    return data;
  } catch (error) {
    throw error;
  }
}

// Function to store fetched tick data into Firestore
async function storeData(
  from: Date,
  to: Date,
  timeframe: "m1" | "m5" | "m15" | "m30" | "h1" | "h4" | "d1" | "mn1",
  symbol: "eurusd" | "gbpusd"
) {
  try {
    // Log the parameters for debugging
    console.log(to, from, timeframe, symbol);

    // Get the raw tick data
    const rawData = await getTickData(from, to, timeframe, symbol);
    const tickYear = from.getFullYear().toString();

    const getMonthData: Record<string, mnTickData> = {};
    // Map raw data to a structured format for monthly data
    rawData.forEach((data) => {
      const dateKey = new Date(data.timestamp).toISOString().split("T")[0]; // Format as YYYY-MM-DD
      getMonthData[dateKey] = {
        timestamp: new Date(data.timestamp),
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        volume: data.volume || 0,
      };
    });

    // Map raw data to a structured format for daily data
    const getDayData: Record<string, d1TickData> = {};

    rawData.forEach((data) => {
      const dateKey = new Date(data.timestamp).toISOString(); // Format as YYYY-MM-DD
      getDayData[dateKey] = {
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        volume: data.volume || 0,
        parentTimestamp: new Date(data.timestamp).toISOString(),
      };
    });

    // Map raw data to a structured format for daily data
    const getH4Data: Record<string, h4TickData> = {};
    rawData.forEach((data) => {
      const dateKey = new Date(data.timestamp).toISOString(); // Format as YYYY-MM-DD
      getH4Data[dateKey] = {
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        volume: data.volume || 0,
        parentTimestamp: new Date(data.timestamp).toISOString(),
      };
    });

    const getH1Data: Record<string, h1TickData> = {};
    rawData.forEach((data) => {
      const dateKey = new Date(data.timestamp).toISOString(); // Format as YYYY-MM-DD
      getH4Data[dateKey] = {
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        volume: data.volume || 0,
        parentTimestamp: new Date(data.timestamp).toISOString(),
      };
    });

    // Log the number of day data returned for debugging
    console.log("The number of day returned:" + getDayData.length);

    // Store data based on the specified timeframe
    switch (timeframe) {
      case "mn1":
        if (getMonthData) {
          // await storeMonthData(getMonthData, symbol, tickYear);
          await monthData(tickYear, getMonthData, symbol);
          break;
        }
      case "d1":
        if (getDayData) {
          // await updateD1Array(tickYear, getDayData, symbol);
          await dayData(tickYear, getDayData, symbol);
          break;
        }
      case "h4":
        if (getH4Data) {
          await h4Data(tickYear, getDayData, symbol);
          break;
        }
      case "h1":
        if(getH1Data){
          await h1Data(tickYear, getDayData, symbol);
          break
        }
    }
  } catch (error) {
    throw error;
  }
}

// Function to store monthly tick data into Firestore




// Example usage of storeData function
storeData(new Date("2010-01-01"), new Date("2010-12-31"), "h1", "gbpusd");
//Calculate the weekly timeframe

async function monthData(
  tickYear: string,
  newData: Record<string, mnTickData>,
  symbol: "eurusd" | "gbpusd"
) {
  try {
    let currency = symbol.toUpperCase();
    const docRef = doc(db, `Forex/${currency}/${tickYear}/MN`);
    await setDoc(docRef, newData);

    console.log("MN array updated successfully!");
  } catch (error) {
    console.error("Error updating document: ", error);
  }
}

async function dayData(
  tickYear: string,
  newData: Record<string, d1TickData>,
  symbol: "eurusd" | "gbpusd"
) {
  try {
    console.log(newData);

    let currency = symbol.toUpperCase();
    const docRef = doc(db, `Forex/${currency}/${tickYear}/D1`);
    await setDoc(docRef, newData);

    console.log("Daily array updated successfully!");
  } catch (error) {
    console.error("Error updating document: ", error);
  }
}

async function h4Data(
  tickYear: string,
  newData: Record<string, d1TickData>,
  symbol: "eurusd" | "gbpusd"
) {
  try {
    let currency = symbol.toUpperCase();
    const docRef = doc(db, `Forex/${currency}/${tickYear}/H4`);
    await setDoc(docRef, newData);

    console.log("Daily array updated successfully!");
  } catch (error) {
    console.error("Error updating document: ", error);
  }
}


async function h1Data(
  tickYear: string,
  newData: Record<string, d1TickData>,
  symbol: "eurusd" | "gbpusd"
) {
  try {
    let currency = symbol.toUpperCase();
    const docRef = doc(db, `Forex/${currency}/${tickYear}/H1`);
    await setDoc(docRef, newData);

    console.log("Daily array updated successfully!");
  } catch (error) {
    console.error("Error updating document: ", error);
  }
}
