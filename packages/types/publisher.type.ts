export type EngineRequest =
  | OnRampType
  | WithdrawType
  | GetBalanceType
  | CreateOrderType
  | InitializeOrderbookType
  | CancelOrderType
  | GetPositionType
  | GetAllPositionsType
  | GetFills
  | MarkPriceType
  | GetDepth;

export type OnRampData = {
  userId: string;
  amount: string;
};

export type OnRampType = {
  msg: "OnRamp";
  correlationID: string;
  data: OnRampData;
};

export type WithdrawData = {
  userId: string;
  amount: string;
};

export type WithdrawType = {
  msg: "Withdraw";
  correlationID: string;
  data: WithdrawData;
};

export type GetBalanceData = {
  userId: string;
};

export type GetBalanceType = {
  msg: "GetBalance";
  correlationID: string;
  data: GetBalanceData;
};

export type CreateOrderType = {
  msg: "CreateOrder";
  correlationID: string;
  data: CreateOrderData;
};

export type CancelOrderType = {
  msg: "CancelOrder";
  correlationID: string;
  data: CancelOrderData;
};

export type CancelOrderData = {
  userId: string;
  orderId: string;
};

export type GetPositionType = {
  msg: "GetPosition";
  correlationID: string;
  data: GetPositionData;
};

export type GetPositionData = {
  userId: string;
  marketId: string;
};

export type GetAllPositionsType = {
  msg: "GetAllPositions";
  correlationID: string;
  data: GetAllPositionsData;
};

export type GetAllPositionsData = {
  userId: string;
};

export type GetFills = {
  msg: "GetFills";
  correlationID: string;
  data: GetFillsData;
};

export type GetFillsData = {
  userId: string;
};

export type CreateOrderData = {
  userId: string;
  qty: string;
  price?: string;
  margin: string;
  side: "LONG" | "SHORT";
  type: "limit" | "market";
  market: string;
  slippage?: string;
};

export type InitializeOrderbookType = {
  msg: "InitializeOrderBook";
  correlationID: string;
  data: {
    userId: string;
  };
};

export type MarkPriceType = {
  msg: "MarkPrice";
  correlationID: string;
  data: MarkPriceData;
};

export type MarkPriceData = {
  prices: StreamData[];
  userId: string;
};

export interface StreamData {
  e: string;
  E: number;
  s: string;
  p: string;
  ap: string;
  i: string;
  P: string;
  r: string;
  T: number;
}

export type GetDepth = {
  msg: "GetDepth";
  correlationID: string;
  data: GetDepthData;
};

export type GetDepthData = {
  userId: string;
  market: string;
};
