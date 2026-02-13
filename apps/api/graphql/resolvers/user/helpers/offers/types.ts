export const ORDERED_CUSTOMER_TYPES = {
  NonCustomer: 0,
  New: 1,
  Infrequent: 2,
  Occasional: 3,
  Regular: 4,
  Vip: 5,
} as const;

export type CustomerType = keyof typeof ORDERED_CUSTOMER_TYPES;

export type CashbackPercentageFilters =
  | "UNDER_5"
  | "FROM_5_TO_10"
  | "ABOVE_10";

export type OffersQueryInput = {
  search?: string | null;
  category?: string | null;
  percentage?: CashbackPercentageFilters | null;
};

export type AuthSession = {
  userId: string;
};
