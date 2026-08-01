import type { DateFilterValue } from "@/components/Ui/DateRangeFilter";

function toIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
}

export function getDateRangeForFilter(
    value: DateFilterValue,
    customStartDate: string,
    customEndDate: string,
): { startDate?: string; endDate?: string } {
    const now = new Date();

    switch (value) {
        case "this_week": {
            const start = new Date(now);
            start.setDate(start.getDate() - start.getDay());
            return { startDate: toIsoDate(start), endDate: toIsoDate(now) };
        }
        case "last_week": {
            const endOfLastWeek = new Date(now);
            endOfLastWeek.setDate(endOfLastWeek.getDate() - endOfLastWeek.getDay() - 1);
            const startOfLastWeek = new Date(endOfLastWeek);
            startOfLastWeek.setDate(startOfLastWeek.getDate() - 6);
            return { startDate: toIsoDate(startOfLastWeek), endDate: toIsoDate(endOfLastWeek) };
        }
        case "this_month": {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            return { startDate: toIsoDate(start), endDate: toIsoDate(now) };
        }
        case "last_month": {
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const end = new Date(now.getFullYear(), now.getMonth(), 0);
            return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
        }
        case "this_year": {
            const start = new Date(now.getFullYear(), 0, 1);
            return { startDate: toIsoDate(start), endDate: toIsoDate(now) };
        }
        case "last_year": {
            const start = new Date(now.getFullYear() - 1, 0, 1);
            const end = new Date(now.getFullYear() - 1, 11, 31);
            return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
        }
        case "custom":
            return {
                startDate: customStartDate || undefined,
                endDate: customEndDate || undefined,
            };
        case "all":
        default:
            return {};
    }
}
