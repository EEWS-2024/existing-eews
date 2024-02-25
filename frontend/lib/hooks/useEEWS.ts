import { useContext, useState } from "react";
import { EEWSContext } from "./eewsCtx";

export const useEEWS = () => {
  const context = useContext(EEWSContext);
  if (context === undefined || context === null) {
    throw new Error(`useUserContext must be called within UserProvider`);
  }
  return context;
};
