import { getHistoricalRates } from "dukascopy-node";
import { db, dbConnect } from "./db";
import { d1TickData, h4TickData, tickDataInterface } from "./types";
import { collection, doc, setDoc } from "firebase/firestore/lite";

async function getTickData(
  from: Date,
  to: Date,
  timeframe: "m1" | "m5" | "m15" | "m30" | "h1" | "h4" | "d1" | "mn1",
  symbol: "eurusd" | "gbpusd"
) {
  try {
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

async function storeData(
  from: Date,
  to: Date,
  timeframe: "m1" | "m5" | "m15" | "m30" | "h1" | "h4" | "d1" | "mn1",
  symbol: "eurusd" | "gbpusd"
) {
  try {
    // get the data
    console.log(to, from, timeframe, symbol);
    const rawData = await getTickData(from, to, timeframe, symbol);
    const tickYear = from.getFullYear().toString();
    const tickMonth = from.getMonth();

    const getMonthData: Array<d1TickData> = rawData.map((data) => ({
      timestamp: new Date(data.timestamp),
      open: data.open,
      high: data.high,
      low: data.low,
      close: data.close,
      volume: data.volume || 0,
      D1: [],
    }));

    const getDayData: Array<h4TickData> = rawData.map((data) => ({
      timestamp: new Date(data.timestamp),
      open: data.open,
      high: data.high,
      low: data.low,
      close: data.close,
      volume: data.volume || 0,
      H4: [],
    }));
    console.log(getMonthData.length);

    switch (timeframe) {
      case "mn1":
        // Get the data
        if (getMonthData) {
          await storeMonthData(getMonthData, symbol, tickYear);
          break;
        }
      case "d1":
        if (getDayData) {
          switch (symbol) {
            case "eurusd":
              switch (tickMonth) {
              }
          }
        }
    }
  } catch (error) {
    throw error;
  }
}

async function storeMonthData(
  data: d1TickData[],
  symbol: "eurusd" | "gbpusd",
  tickYear: string
) {
  try {
    switch (symbol) {
      case "eurusd":
        const euMonthTickData = {
          Month: data,
        };

        // Define the document reference
        const euDocRef = doc(db, `Currency/EURUSD/${tickYear}/TickData`);

        // Write the data to Firestore
        await setDoc(euDocRef, euMonthTickData).then(() => {
          return { msg: "Success", timeframe: "Month" };
        });
        break;

      case "gbpusd":
        const guMonthTickData = {
          Month: data,
        };

        // Define the document reference
        const guDocRef = doc(db, `Currency/GBPUSD/${tickYear}/TickData`);

        // Write the data to Firestore
        await setDoc(guDocRef, guMonthTickData).then(() => {
          return { msg: "Success", timeframe: "Month" };
        });
        break;
    }
  } catch (error) {
    throw error;
  }
}

async function storeDayData(
  data: h4TickData,
  symbol: "eurusd" | "gbpusd",
  monthIndex: number
) {
  try {
    switch (monthIndex) {
      case 0:
        
        break;

      case 1:
        break;

      case 2:
        break;

      case 3:
        break;

      case 4:
        break;

      case 5:
        break;

      case 6:
        break;

      case 7:
        break;

      case 8:
        break;

      case 9:
        break;

      case 10:
        break;

      case 11:
        break;
    }
  } catch (error) {}
}

// dbConnect()
storeData(new Date("2010-01-01"), new Date("2010-12-31"), "mn1", "gbpusd");
//Calculate the weekly timeframe
