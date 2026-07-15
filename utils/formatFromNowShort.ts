import moment from "moment";
function formatFromNowShort(date: string, language: "en" | "ur" = "en") {
  const units =
    language === "ur"
      ? { w: "ہف", d: "دن", h: "گ", m: "م", s: "س" }
      : { w: "w", d: "d", h: "h", m: "m", s: "s" };

  const diffMs = Date.now() - moment(date).valueOf();
  const duration = moment.duration(Math.max(0, diffMs));

  const weeks = Math.floor(duration.asWeeks());
  if (weeks >= 1) return `${weeks}${units.w}`;

  const days = Math.floor(duration.asDays());
  if (days >= 1) return `${days}${units.d}`;

  const hours = Math.floor(duration.asHours());
  if (hours >= 1) return `${hours}${units.h}`;

  const minutes = Math.floor(duration.asMinutes());
  if (minutes >= 1) return `${minutes}${units.m}`;

  const seconds = Math.floor(duration.asSeconds());
  return `${seconds}${units.s}`;
}
export default formatFromNowShort;
