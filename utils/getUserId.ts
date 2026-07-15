import { getCookie } from "cookies-next";

export const getUserId = (): string | undefined => {
  const id = getCookie("userId");
  if (typeof id !== "string" || id === "") return undefined;
  return id;
};
