# Research charge model based on Groww's published F&O pricing.
# Rates are configurable because statutory charges can change.
def charges(order_value, side, is_option=True, brokerage=20.0,
            stt_rate=0.0015, stamp_buy_rate=0.00003,
            exchange_rate=0.0003503, sebi_rate=0.000001,
            ipft_rate=0.000005, gst_rate=0.18):
    brokerage=float(brokerage)
    stt=order_value*stt_rate if (side=="SELL" and is_option) else 0.0
    stamp=order_value*stamp_buy_rate if side=="BUY" else 0.0
    exchange=order_value*exchange_rate
    sebi=order_value*sebi_rate
    ipft=order_value*ipft_rate
    gst_base=brokerage+exchange+sebi+ipft
    gst=gst_base*gst_rate
    return {"brokerage":brokerage,"stt":stt,"stamp_duty":stamp,
            "exchange_transaction":exchange,"sebi":sebi,"ipft":ipft,
            "gst":gst,"total":sum([brokerage,stt,stamp,exchange,sebi,ipft,gst])}

def round_trip(option_sell_value, option_buy_value, orders=8, brokerage_per_order=20.0, gst_rate=0.18):
    # Brokerage is charged per executed order (Groww: flat per order), not per
    # aggregated side. A fully closed four-leg iron condor is 8 orders by default.
    # Statutory charges are computed on turnover with brokerage excluded, then
    # brokerage and its GST are added once for the number of orders.
    entry=charges(option_sell_value,"SELL",brokerage=0.0)
    entry_buy=charges(option_buy_value,"BUY",brokerage=0.0)
    exit_sell=charges(option_buy_value,"SELL",brokerage=0.0)
    exit_buy=charges(option_sell_value,"BUY",brokerage=0.0)
    brokerage_total=float(orders)*float(brokerage_per_order)
    brokerage_gst=brokerage_total*gst_rate
    statutory_total=entry["total"]+entry_buy["total"]+exit_sell["total"]+exit_buy["total"]
    return {"entry":entry,"exit_sell":exit_sell,"exit_buy":exit_buy,
            "entry_buy":entry_buy,
            "orders":int(orders),
            "brokerage_total":brokerage_total,
            "brokerage_gst":brokerage_gst,
            "estimated_total":statutory_total+brokerage_total+brokerage_gst}
