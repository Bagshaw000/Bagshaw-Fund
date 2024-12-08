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
    const getDayData: Record<string, h4TickData> = {};

    rawData.forEach((data) => {
      const dateKey = new Date(data.timestamp).toISOString().split("T")[0]; // Format as YYYY-MM-DD
      getDayData[dateKey] = {
        timestamp: new Date(data.timestamp),
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        volume: data.volume || 0,
        H1: {}, // Initialize as an empty object for key-value pairs
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
          // await storeDayData(getDayData, symbol, tickYear);
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

        const monthIndex = new Date(monthData.timestamp).getMonth(); // Get the month index
        const monthName = monthNames[monthIndex]; // Get the month name

        // Initialize the month entry if not present
        if (!monthDataMap[monthName]) {
          monthDataMap[monthName] = {};
        }
        const dayKey = monthData.timestamp.toISOString().split("T")[0]; // Format as YYYY-MM-DD
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

// Define the structure for day data

// // Function to store day data as key-value pairs
// function storeDayDataAsObject(
//   monthData: d1TickData[]
// ): Record<string, DayData> {
//   const dayDataMap: Record<string, DayData> = {};

//   monthData.forEach((month) => {
//     month.D1.forEach((h4Data) => {
//       const dateKey = new Date(h4Data.timestamp).toISOString().split("T")[0]; // Format as YYYY-MM-DD
//       if (!dayDataMap[dateKey]) {
//         dayDataMap[dateKey] = { D1: [] }; // Initialize if not already present
//       }
//       dayDataMap[dateKey].D1.push(h4Data); // Add H4 data to the corresponding day
//     });
//   });

//   return dayDataMap; // Return the key-value pair object
// }

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
// async function updateH4Array(
//   tickYear: string,
//   symbol: "eurusd" | "gbpusd",
//   newH4Data: h1TickData[]
// ) {
//   try {
//     let currency = symbol.toUpperCase(); // Convert symbol to uppercase
//     const docRef = doc(db, `Currency/${currency}/${tickYear}/TickData`); // Document reference

//     // Step 1: Get the current document
//     const docSnapshot = await getDoc(docRef);
//     if (!docSnapshot.exists()) {
//       console.error("Document does not exist!"); // Log error if document does not exist
//       return;
//     }

//     // Step 2: Get the current Month array
//     const monthData = docSnapshot.data().Month;

//     // Create a map to store new H4 data by day and month for quick access
//     const newH4Map: Record<string, h1TickData[]> = {};
//     newH4Data.forEach((newH4TickData) => {
//       const dateKey = `${new Date(newH4TickData.timestamp).getFullYear()}-${
//         new Date(newH4TickData.timestamp).getMonth() + 1
//       }-${new Date(newH4TickData.timestamp).getDate()}`;
//       if (!newH4Map[dateKey]) {
//         newH4Map[dateKey] = [];
//       }
//       newH4Map[dateKey].push(newH4TickData); // Group new H4 data by date
//     });
//     console.log(newH4Map);

//     // Loop through the Month data
//     monthData.forEach((d1TickData: d1TickData) => {
//       // Loop through the Day data
//       d1TickData.D1.forEach((h4TickData: h4TickData) => {
//         const h4DateKey = `${new Date(h4TickData.timestamp).getFullYear()}-${
//           new Date(h4TickData.timestamp).getMonth() + 1
//         }-${new Date(h4TickData.timestamp).getDate()}`;

//         // Check if there are new H4 data for the corresponding day
//         if (newH4Map[h4DateKey]) {
//           newH4Map[h4DateKey].forEach((newH4TickData) => {
//             // Check for duplicates before pushing
//             const exists = h4TickData.H4.some(
//               (existingH4) =>
//                 existingH4.timestamp.getTime() ===
//                 newH4TickData.timestamp.getTime()
//             );

//             if (!exists) {
//               h4TickData.H4.push(newH4TickData); // Add new H4 data to the existing H4 array
//               console.log(`Added new H4 data for ${h4DateKey}:`, newH4TickData);
//             } else {
//               console.log(
//                 `Duplicate H4 data for ${h4DateKey} not added:`,
//                 newH4TickData
//               );
//             }
//           });
//           // console.log(`Updated H4 array for ${h4DateKey}:`, h4TickData.H4);
//         }
//       });
//     });
//   } catch (error) {
//     console.error("Error updating H4 arrays: ", error); // Log error if updating fails
//   }
// }

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
storeData(new Date("2010-01-01"), new Date("2010-12-31"), "mn1", "gbpusd");
//Calculate the weekly timeframe
