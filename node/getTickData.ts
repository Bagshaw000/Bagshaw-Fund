import { getHistoricalRates } from "dukascopy-node";
import { dbConnect } from "./db";

async function getTickData(
  from: Date,
  to: Date,
  timeframe: "m1" | "m5" | "m15" | "m30" | "h1" | "h4" | "d1" | "mn1"
) {
  try {
    const data = await getHistoricalRates({
      instrument: "eurusd",
      dates: {
        from: from,
        to: to,
      },
      timeframe: timeframe,
      format: "json",
      batchSize: 20,
      pauseBetweenBatchesMs: 2000
    });
    return data;
  } catch (error) {
    throw error;
  }
}

async function tickData() {
  try {
    const yearList = [
      2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019,
    ];
    const timeFrame = ["m1", "m5", "m15", "m30", "h1", "h4", "d1", "mn1"];

    yearList.map((year) => {
      console.log(`Starting the ${year} `);
      const nextYear = year + 1;
      const from = new Date(year, 0, 1);
      const to = new Date(nextYear, 0, 1);
      timeFrame.map(async (tf) => {
        console.log(`Starting the ${tf} timeframe`);
       const data = await getTickData(
          from,
          to,
          tf as "m1" | "m5" | "m15" | "m30" | "h1" | "h4" | "d1" | "mn1"
        );
        console.log(data)
        console.log(`Finished the ${tf} timeframe`);
      });
    });
  } catch (error) {
    throw error;
  }
}

async function batchTickData(to:Date, from:Date, timeframe:"m1" | "m5" | "m15" | "m30" | "h1" | "h4" | "d1" | "mn1"){
    try {
        const tick = await getTickData(new Date("2010-01-01"),new Date("2011-01-01"),"m1")
        console.log(tick)
    } catch (error) {
        throw error;
    }
}

async function storeata(){
  
}

// tickData()
dbConnect()
batchTickData(new Date("2010-01-01"),new Date("2011-01-01"),"m15")
//Calculate the weekly timeframe