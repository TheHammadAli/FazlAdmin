"use client";

import { ChevronDown } from "lucide-react";

export type DateFilterValue =
    | "all"
    | "this_week"
    | "last_week"
    | "this_month"
    | "last_month"
    | "this_year"
    | "last_year"
    | "custom";

const DATE_FILTER_OPTIONS: { value: DateFilterValue; label: string }[] = [
    { value: "all", label: "All Data" },
    { value: "this_week", label: "This Week" },
    { value: "last_week", label: "Last Week" },
    { value: "this_month", label: "This Month" },
    { value: "last_month", label: "Last Month" },
    { value: "this_year", label: "This Year" },
    { value: "last_year", label: "Last Year" },
    { value: "custom", label: "Custom" },
];

type DateRangeFilterProps = {
    value: DateFilterValue;
    onChange: (value: DateFilterValue) => void;
    startDate: string;
    endDate: string;
    onStartDateChange: (value: string) => void;
    onEndDateChange: (value: string) => void;
};

function DateRangeFilter({
    value,
    onChange,
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
}: DateRangeFilterProps) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            {value === "custom" && (
                <>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(event) => onStartDateChange(event.target.value)}
                        className="h-10 rounded-[8px] border border-gray-9 bg-white px-3 text-[14px] text-[#001907] outline-none focus:border-green-1"
                    />
                    <input
                        type="date"
                        value={endDate}
                        onChange={(event) => onEndDateChange(event.target.value)}
                        className="h-10 rounded-[8px] border border-gray-9 bg-white px-3 text-[14px] text-[#001907] outline-none focus:border-green-1"
                    />
                </>
            )}

            <div className="relative">
                <select
                    value={value}
                    onChange={(event) => onChange(event.target.value as DateFilterValue)}
                    className="h-10 min-w-[150px] appearance-none rounded-[8px] border border-gray-9 bg-white pl-3 pr-8 text-[14px] text-[#001907] outline-none focus:border-green-1"
                >
                    {DATE_FILTER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-11" />
            </div>
        </div>
    );
}

export default DateRangeFilter;
