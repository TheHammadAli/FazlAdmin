import { getCookie } from "cookies-next";
export const getToken = () => {
  return getCookie("token");
};

export const getRefreshToken = () => {
  return getCookie("refreshToken");
};
