import moment from "moment";

/** Gregorian month names in Urdu script; day/year/time digits stay Latin (English). */
const URDU_MONTH_NAMES = [
  "جنوری",
  "فروری",
  "مارچ",
  "اپریل",
  "مئی",
  "جون",
  "جولائی",
  "اگست",
  "ستمبر",
  "اکتوبر",
  "نومبر",
  "دسمبر",
] as const;

export function formatRequestedDateTime(
  dateInput: string | undefined,
  lang: string
): string {
  const m = moment(dateInput);
  if (!m.isValid()) return "";
  const en = m.clone().locale("en");
  if (lang !== "ur") {
    return en.format("MMM DD, YYYY - h:mm A");
  }
  const monthUr = URDU_MONTH_NAMES[m.month()];
  const day = en.format("DD");
  const year = en.format("YYYY");
  const time = en.format("h:mm");
  const meridiemUr = en.format("A") === "AM" ? "قبل دوپہر" : "بعد دوپہر";
  return `${monthUr} ${day}, ${year} - ${time} ${meridiemUr}`;
}
