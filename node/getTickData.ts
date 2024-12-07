import { getHistoricalRates } from "dukascopy-node";
import { db, dbConnect } from "./db";
import { d1TickData, h1TickData, h4TickData, tickDataInterface } from "./types";
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

    // Map raw data to a structured format for monthly data
    const getMonthData: Array<d1TickData> = rawData.map((data) => ({
      timestamp: new Date(data.timestamp),
      open: data.open,
      high: data.high,
      low: data.low,
      close: data.close,
      volume: data.volume || 0,
      D1: [],
    }));

    // Map raw data to a structured format for daily data
    const getDayData: Array<h4TickData> = rawData.map((data) => ({
      timestamp: new Date(data.timestamp),
      open: data.open,
      high: data.high,
      low: data.low,
      close: data.close,
      volume: data.volume || 0,
      H4: [],
    }));

    const getH4Data: Array<h1TickData> = rawData.map((data) => ({
      timestamp: new Date(data.timestamp),
      open: data.open,
      high: data.high,
      low: data.low,
      close: data.close,
      volume: data.volume || 0,
      H1: [],
    }));

    // Log the number of day data returned for debugging
    console.log("The number of day returned:" + getDayData.length);

    // Store data based on the specified timeframe
    switch (timeframe) {
      case "mn1":
        if (getMonthData) {
          await storeMonthData(getMonthData, symbol, tickYear);
          break;
        }
      case "d1":
        if (getDayData) {
          await storeDayData(getDayData, symbol, tickYear);
          break;
        }
      case "h4":
        if (getH4Data) {
          await updateH4ForMatchingDays(tickYear, symbol, getDayData); // Update H4 data for matching days in 2023 for GBP/USD
        }
    }
  } catch (error) {
    throw error;
  }
}

// Function to store monthly tick data into Firestore
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

        // Define the document reference for EUR/USD
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

        // Define the document reference for GBP/USD
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

// Function to store daily tick data into Firestore
async function storeDayData(
  data: h4TickData[],
  symbol: "eurusd" | "gbpusd",
  tickYear: string
) {
  try {
    // Initialize an array to hold monthly data
    let monthData: Array<Array<h4TickData>> = Array.from(
      { length: 12 },
      () => []
    );

    // Log the length of the daily data for debugging
    console.log(data.length);

    // Iterate over each tick in the daily data
    data.forEach(async (tick) => {
      const tickMonth = tick.timestamp.getMonth();

      // Push the tick data into the corresponding month array
      monthData.at(tickMonth)!.push(tick);
    });

    // Update the D1 array for each month with the corresponding tick data
    monthData.map((tick) => {
      updateD1Array(tickYear, monthData.indexOf(tick), tick, symbol);
    });
  } catch (error) {
    console.error("Error storing daily data: ", error);
  }
}

async function storeH4Data(
  data: h1TickData[],
  symbol: "eurusd" | "gbpusd",
  tickYear: string
) {
  try {
    data.map(async (tick) => {
      const tickMonth = tick.timestamp.getMonth();
      const tickDay = tick.timestamp.getDay();
    });
  } catch (error) {
    console.error("Error storing H4 data: ", error);
  }
}

// Function to update the D1 array for a specific month in Firestore
async function updateD1Array(
  tickYear: string,
  monthIndex: number,
  newData: h4TickData[],
  symbol: "eurusd" | "gbpusd"
) {
  try {
    let currency = symbol.toUpperCase().toString();
    console.log(currency);

    // Define the document reference for the tick data
    const docRef = doc(db, `Currency/${currency}/${tickYear}/TickData`);

    // Step 1: Get the current document
    const docSnapshot = await getDoc(docRef);
    if (!docSnapshot.exists()) {
      console.error("Document does not exist!");
      return;
    }

    // Step 2: Get the current Month array
    const monthData = docSnapshot.data().Month;

    // Step 3: Update the D1 array at the specified month index
    if (monthData && monthData[monthIndex]) {
      monthData[monthIndex].D1 = newData;
    } else {
      console.error(
        "Invalid month index or Month data is not structured correctly."
      );
      return;
    }

    // Step 4: Write back the updated Month array
    await updateDoc(docRef, { Month: monthData });
    console.log("D1 array updated successfully!");
  } catch (error) {
    console.error("Error updating document: ", error);
  }
}

async function updateH4ForMatchingDays(
  tickYear: string,
  symbol: "eurusd" | "gbpusd",
  newH4Data: h4TickData[]
) {
  try {
    let currency = symbol.toUpperCase().toString(); // Convert symbol to uppercase
    const docRef = doc(db, `Currency/${currency}/${tickYear}/TickData`); // Document reference

    // Step 1: Get the current document
    const docSnapshot = await getDoc(docRef);
    if (!docSnapshot.exists()) {
      console.error("Document does not exist!"); // Log error if document does not exist
      return;
    }

    // Step 2: Get the current Month array
    const monthData = docSnapshot.data().Month;

    // Step 3: Iterate through each month
    monthData.forEach((month: { D1: d1TickData[]; H4: h4TickData[] }) => {
      // Step 4: Iterate through each day in the D1 array
      month.D1.forEach((dayData: d1TickData) => {
        // Step 5: Check if there is matching H4 data for the day
        const matchingH4Data: h4TickData | undefined = newH4Data.find(
          (h4) => h4.timestamp.getTime() === dayData.timestamp.getTime() // Compare timestamps
        );

        // Step 6: If matching H4 data is found, update the H4 array for that day
        if (matchingH4Data) {
          // Find the index of the existing H4 data for that day
          const dayIndex: number = month.H4.findIndex(
            (h4) => h4.timestamp.getTime() === dayData.timestamp.getTime( )
          );

          if (dayIndex !== -1) {
            // Update existing H4 data
            month.H4[dayIndex] = matchingH4Data; // Replace with new H4 data
          } else {
            // If no existing H4 data, you can push it to the H4 array
            month.H4.push(matchingH4Data); // Add new H4 data
          }
        }
      });
    });

    console.log(monthData[0].D1[0]);
    // Step 7: Write back the updated Month array
    // await updateDoc(docRef, { Month: monthData }); // Update the document in Firestore
    console.log("H4 arrays updated successfully for matching days!"); // Log success message
  } catch (error) {
    console.error("Error updating H4 arrays: ", error); // Log error if updating fails
  }
}

// Example usage
const newH4Data = [
  {
    timestamp: new Date("2023-01-01T00:00:00Z"),
    open: 1.1,
    high: 1.2,
    low: 1.0,
    close: 1.15,
  },
  // ... more H4 data
];

// Example usage of storeData function
storeData(new Date("2010-01-01"), new Date("2010-12-31"), "h4", "gbpusd");
//Calculate the weekly timeframe
