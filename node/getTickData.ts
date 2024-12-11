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
        D1: {}, // Initialize as an empty object for key-value pairs
      };
    });

    // Map raw data to a structured format for daily data
    const getDayData: Record<string, d1TickData> = {};

    rawData.forEach((data) => {
      const dateKey = new Date(data.timestamp).toISOString().split("T")[0]; // Format as YYYY-MM-DD
      getDayData[dateKey] = {
        timestamp: new Date(data.timestamp),
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        volume: data.volume || 0,
        H4: {}, // Initialize as an empty object for key-value pairs
      };
    });

    // Map raw data to a structured format for daily data
    const getH4Data: Record<string, h1TickData> = {};
    rawData.forEach((data) => {
      const dateKey = new Date(data.timestamp).toISOString().split("T")[0]; // Format as YYYY-MM-DD
      getH4Data[dateKey] = {
        timestamp: new Date(data.timestamp),
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        volume: data.volume || 0,
        M30: {}, // Initialize as an empty object for key-value pairs
      };
    });
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
          await updateD1Array(tickYear, getDayData, symbol);
          break;
        }
      case "h4":
        if (getH4Data) {
          // await updateH4Array(tickYear, symbol, getH4Data); // Update H4 data for matching days in 2023 for GBP/USD
        }
    }
  } catch (error) {
    throw error;
  }
}

// Function to store monthly tick data into Firestore
async function storeMonthData(
  data: Record<string, mnTickData>,
  symbol: "eurusd" | "gbpusd",
  tickYear: string
) {
  try {
    // Create a mapping of month indices to month names
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    // Convert the data into a key-value pair structure
    const monthDataMap: Record<string, Record<string, mnTickData>> = {}; // Month -> Day -> Data

    // Iterate over the keys of the data object
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const monthData = data[key]; // Get the d1TickData object

        const monthIndex = new Date(monthData.timestamp!).getMonth(); // Get the month index
        const monthName = monthNames[monthIndex]; // Get the month name

        // Initialize the month entry if not present
        if (!monthDataMap[monthName]) {
          monthDataMap[monthName] = {};
        }
        const dayKey = monthData.timestamp!.toISOString().split("T")[0]; // Format as YYYY-MM-DD
        monthDataMap[monthName][dayKey] = monthData; // Store the month data
      }
    }

    // Define the document reference based on the symbol
    const docRef = doc(db, `Currency/${symbol.toUpperCase()}/${tickYear}/Tick`);

    // Write the data to Firestore
    await setDoc(docRef, { Month: monthDataMap }).then(() => {
      return { msg: "Success", timeframe: "Month" };
    });
  } catch (error) {
    console.error("Error storing month data:", error); // Log the error
    throw new Error("Failed to store month data."); // Throw a more informative error
  }
}

async function storeH4Data(
  data: h1TickData[],
  symbol: "eurusd" | "gbpusd",
  tickYear: string
) {
  try {
    data.map(async (tick) => {
      const tickMonth = tick.timestamp!.getMonth();
      const tickDay = tick.timestamp!.getDay();
    });
  } catch (error) {
    console.error("Error storing H4 data: ", error);
  }
}

// Function to update the D1 array for a specific month in Firestore
async function updateD1Array(
  tickYear: string,
  newData: Record<string, d1TickData>,
  symbol: "eurusd" | "gbpusd"
) {
  try {
    let currency = symbol.toUpperCase();

    // Define the document reference for the tick data
    const docRef = doc(db, `Currency/${currency}/${tickYear}/Tick`);

    //Get the current document
    const docSnapshot = await getDoc(docRef);
    if (!docSnapshot.exists()) {
      console.error("Document does not exist!");
      return;
    }

    // Get the current Month record
    const monthData: Record<
      string,
      Record<string, mnTickData>
    > = docSnapshot.data().Month;

    // Loop through the month data
    Object.entries(monthData).forEach(([month, dates]) => {
      //Loop through the entry in the Month data to get the key timestamp
      Object.entries(dates).forEach(([dateKey, dateValue]) => {
        //Get the month index for each month in the database
        const monthIndex = new Date(dateKey).getMonth();
        Object.entries(newData).forEach(([date, data]) => {
          const dayMonthIndex = new Date(date).getMonth();

          //Check if the months are the same from the database data and the api data
          if (monthIndex === dayMonthIndex) {
            const dayKey = new Date(date).toISOString();

            //Check if the D1 object is set if not set then set it to an object
            if (!monthData[month][dateKey].D1) {
              monthData[month][dateKey].D1 = {};
            }

            //Check if the D1 has that particular day in the record. If not present then add the day data
            if (!monthData[month][dateKey].D1.hasOwnProperty(dayKey)) {
              monthData[month][dateKey].D1[dayKey] = {
                timestamp: data?.timestamp,
                open: data?.open,
                high: data?.high,
                low: data?.low,
                close: data?.close,
                volume: data!.volume,
                H4: {},
              };
            }
          }
        });
      });
    });

    //Write back the updated Month array
    await updateDoc(docRef, { Month: monthData });
    console.log("D1 array updated successfully!");
  } catch (error) {
    console.error("Error updating document: ", error);
  }
}
// Example usage


// Example usage of storeData function
storeData(new Date("2010-01-01"), new Date("2010-12-31"), "d1", "gbpusd");
//Calculate the weekly timeframe
