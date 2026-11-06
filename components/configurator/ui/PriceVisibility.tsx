"use client";

import { createContext, useContext } from "react";

// While the buyer designs, prices stay off the screen so the home has the
// room; every figure appears together on the final page. Choice rows read
// this to decide whether to show their price and monthly payment change.
const PricesShown = createContext(true);

export const PriceVisibility = PricesShown.Provider;

export function usePricesShown(): boolean {
  return useContext(PricesShown);
}
