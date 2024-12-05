# Task get tick data for EUR/USD and GBP/USD for the past 24 years and store in database
from typing import Literal
import MetaTrader5 as mt5
from datetime import datetime
import pytz
import pandas as pd
# pd.set_option('display.max_columns', 500) # number of columns to be displayed
# pd.set_option('display.width', 1500)

if not mt5.initialize(login=52062671, server="ICMarketsSC-Demo",password="7SNUIh@p22hIWi"):
    print("initialize() failed, error code =",mt5.last_error())
    quit()


def getTickData():
   
    timezone = pytz.timezone("Etc/UTC")
    utc_from = datetime(2000, 1, 1, tzinfo=timezone)  # Start date
    utc_to = datetime(2024, 11, 1, tzinfo=timezone)   # End date

    symbols = ["EURUSD", "GBPUSD"]  # List of symbols to retrieve data for
    # rates = mt5.copy_rates_range("USDJPY", mt5.TIMEFRAME_M5, utc_from, utc_to)

    for symbol in symbols:
        tick_data = mt5.copy_ticks_range(symbol, utc_from, utc_to, mt5.COPY_TICKS_ALL)
        # rates = mt5.copy_rates_range(symbol, mt5.TIMEFRAME_M5, utc_from, utc_to)
 
        print(tick_data[-1])
        print(tick_data[0])
        print(len(tick_data))
        # print(len(rates))
        
        
        if tick_data is None:
            print(f"No tick data available for {symbol} in the specified range.")
        else:
            print(f"{symbol} tick data:", tick_data)
            # print(f"{symbol} tick data:", tick_data)

    # Shutdown connection to MetaTrader 5
    mt5.shutdown()
    
    # # display each element of obtained data in a new line
    # print("Display obtained data 'as is'")
    # counter=0
    # for rate in rates:
    #     counter+=1
    #     if counter<=100:
    #         print(rate)
    
    # # create DataFrame out of the obtained data
    # rates_frame = pd.DataFrame(rates)
    # # convert time in seconds into the 'datetime' format
    # rates_frame['time']=pd.to_datetime(rates_frame['time'], unit='s')
    
    # # display data
    # print("\nDisplay dataframe with data")
    # print(rates_frame.head(10))
    
