import { createContext } from "react";

function noop() {}

export const AuthContext = createContext({
  token: null,
  isJoined: false,
  login: noop,
  logout: noop,
  isAuthenticated: false,
});
