import { clearTokens } from "./auth";

export const logout = () => {
  clearTokens();
  window.location.href = "/login";
};