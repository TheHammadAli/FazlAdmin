"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronsUpDown, Download, Plus, SquarePen } from "lucide-react";
import { BeatLoader } from "react-spinners";
import { toast } from "react-hot-toast";
import Pagination from "@/components/Ui/Pagination";
import Modal from "@/components/Ui/Modals/Modal";
import CategoryFormModal, { type CategoryParameter, type CategoryParameters, type CategoryType } from "@/components/Admin/CategoryFormModal";
import DoodleButton from "@/components/Ui/DoodleButton";
import { useUpdateCategoryMutation } from "@/store/services/adminService";
import Image from "next/image";
import { getFeedCategoryLabel } from "@/utils/getFeedCategoryLabel";
import { downloadCsv, csvText } from "@/utils/downloadCsv";
import { useCurrentAdminPermissions } from "@/custom-hooks/useCurrentAdminPermissions";
import noImageIcon from "@/assets/images/new-no-image-placeholder.png";
import { useGetAllCategoriesForAdminQuery } from "@/store/services/adminService";
type Status = "active" | "inactive";

type CategoryName = {
    en: string;
    ur: string;
};

type Category = {
    id: string;
    name: CategoryName;
    displayName: string;
    createdAt: string;
    status: Status;
    type: CategoryType;
    icon?: string;
    parameters?: CategoryParameters;
    sortNumber?: number;

};

type ApiCategory = {
    _id?: string;
    id?: string;
    name?: string | CategoryName;
    createdAt?: string;
    isDisabled?: boolean;
    type?: CategoryType;
    icon?: string;
    parameters?: CategoryParameters;
    sortNumber?: number;
};

type CategoriesResponse = {
    data?: ApiCategory[];
};

const PAGE_LIMIT = 50;

const STATUS_STYLES: Record<Status, { label: string; className: string }> = {
    active: {
        label: "Active",
        className: "bg-[#CEF4CF] text-[#0F172A]",
    },
    inactive: {
        label: "In active",
        className: "bg-[#FDEAB8] text-[#0F172A]",
    },
};

function mapCategoryStatus(category: ApiCategory): Status {
    if (category.isDisabled) {
        return "inactive";
    }

    return "active";
}

/** Some legacy category documents store a non-string value under name.en/name.ur
 *  (e.g. a leftover `{ name, values }` object) — guard against that so it never
 *  ends up in component state or gets rendered directly. */
function toSafeString(value: unknown): string {
    return typeof value === "string" ? value : "";
}

/** Same legacy-data risk applies to parameters.en/parameters.ur array elements —
 *  drop anything that isn't a well-formed parameter entry, but otherwise carry
 *  every field through. This used to whitelist only { name, values,
 *  isOptional, allowCustomValue, allowMultiple } — the moment a category with
 *  a Make -> Model cascade was opened for editing, this mapper alone would
 *  have stripped dependsOn/valueKeys/valuesByParent before CategoryFormModal
 *  ever saw them. */
function toSafeParameterArray(value: unknown): CategoryParameter[] {
    if (!Array.isArray(value)) return [];
    return value
        .map((item: unknown) => {
            const record = item as
                | {
                    name?: unknown;
                    values?: unknown;
                    isOptional?: unknown;
                    allowCustomValue?: unknown;
                    allowMultiple?: unknown;
                    valueKeys?: unknown;
                    dependsOn?: unknown;
                    valuesByParent?: unknown;
                    valueKeysByParent?: unknown;
                }
                | null
                | undefined;

            const parameter: CategoryParameter = {
                name: typeof record?.name === "string" ? record.name : "",
                values: Array.isArray(record?.values)
                    ? record.values.filter((v: unknown): v is string => typeof v === "string")
                    : [],
                isOptional: typeof record?.isOptional === "boolean" ? record.isOptional : false,
                allowCustomValue: typeof record?.allowCustomValue === "boolean" ? record.allowCustomValue : false,
                allowMultiple: typeof record?.allowMultiple === "boolean" ? record.allowMultiple : false,
            };

            if (
                Array.isArray(record?.valueKeys) &&
                record.valueKeys.every((k: unknown): k is string => typeof k === "string")
            ) {
                parameter.valueKeys = record.valueKeys;
            }
            if (typeof record?.dependsOn === "string" && record.dependsOn.trim()) {
                parameter.dependsOn = record.dependsOn;
            }
            if (
                record?.valuesByParent &&
                typeof record.valuesByParent === "object" &&
                !Array.isArray(record.valuesByParent)
            ) {
                const valuesByParent: Record<string, string[]> = {};
                for (const [key, list] of Object.entries(record.valuesByParent as Record<string, unknown>)) {
                    if (Array.isArray(list)) {
                        valuesByParent[key] = list.filter((v: unknown): v is string => typeof v === "string");
                    }
                }
                parameter.valuesByParent = valuesByParent;
            }
            if (
                record?.valueKeysByParent &&
                typeof record.valueKeysByParent === "object" &&
                !Array.isArray(record.valueKeysByParent)
            ) {
                const valueKeysByParent: Record<string, string[]> = {};
                for (const [key, list] of Object.entries(record.valueKeysByParent as Record<string, unknown>)) {
                    if (Array.isArray(list)) {
                        valueKeysByParent[key] = list.filter((v: unknown): v is string => typeof v === "string");
                    }
                }
                parameter.valueKeysByParent = valueKeysByParent;
            }

            return parameter;
        })
        .filter((parameter) => parameter.name.trim() !== "");
}

function mapApiCategory(category: ApiCategory): Category {
    const createdAt = category.createdAt
        ? new Date(category.createdAt).toISOString().slice(0, 10)
        : "-";

    const name =
        typeof category.name === "string"
            ? { en: category.name, ur: category.name }
            : {
                en: toSafeString(category.name?.en),
                ur: toSafeString(category.name?.ur),
            };

    return {
        id: category._id ?? category.id ?? "",
        name,
        displayName: getFeedCategoryLabel(category.name ?? "", "en") || "-",
        createdAt,
        status: mapCategoryStatus(category),
        // Narrowed to the two known values before, which quietly relabelled a
        // shop category as a product one.
        type:
            category.type === "service" || category.type === "shop"
                ? category.type
                : "product",
        icon: category.icon,
        parameters: category.parameters
            ? {
                en: toSafeParameterArray(category.parameters.en),
                ur: toSafeParameterArray(category.parameters.ur),
            }
            : undefined,
        sortNumber: category.sortNumber,
    };
}

type PendingStatusChange = {
    category: Category;
    action: "activate" | "deactivate";
};

const CATEGORY_TABS: { value: CategoryType; label: string }[] = [
    { value: "product", label: "Product" },
    { value: "service", label: "Service" },
    { value: "shop", label: "Shop" },
];

function AdminCategories() {
    const { canEdit } = useCurrentAdminPermissions();
    const [activeTab, setActiveTab] = useState<CategoryType>("product");
    const [page, setPage] = useState(1);
    const [updatingCategoryId, setUpdatingCategoryId] = useState<string | null>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [pendingStatusChange, setPendingStatusChange] = useState<PendingStatusChange | null>(null);
    const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const statusModalRef = useRef<HTMLDivElement>(null);

    const {
        data: categoriesResponse,
        isLoading: isCategoriesLoading,
        isFetching: isCategoriesFetching,
    } = useGetAllCategoriesForAdminQuery(undefined)
    const [updateCategory] = useUpdateCategoryMutation();
    const allCategories = useMemo(() => {
        const response = categoriesResponse as CategoriesResponse | undefined;
        return (response?.data ?? []).map(mapApiCategory);
    }, [categoriesResponse]);

    const tabCategories = useMemo(
        () => allCategories.filter((category) => category.type === activeTab),
        [allCategories, activeTab],
    );

    const totalCategories = tabCategories.length;
    const pageCount = Math.max(1, Math.ceil(totalCategories / PAGE_LIMIT));

    const paginatedCategories = useMemo(() => {
        const start = (page - 1) * PAGE_LIMIT;
        return tabCategories.slice(start, start + PAGE_LIMIT);
    }, [tabCategories, page]);

    const loading = isCategoriesLoading || isCategoriesFetching;

    useEffect(() => {
        if (page > pageCount) {
            setPage(pageCount);
        }
    }, [page, pageCount]);

    function selectTab(tab: CategoryType) {
        setActiveTab(tab);
        setPage(1);
    }

    function handleExportCsv() {
        if (tabCategories.length === 0) {
            toast.error("No categories to export");
            return;
        }
        downloadCsv(
            `${activeTab}-categories-${new Date().toISOString().slice(0, 10)}.csv`,
            ["Sort Number", "Category Name (EN)", "Category Name (UR)", "Status", "Created Date", "Parameters (JSON)"],
            tabCategories.map((category) => [
                category.sortNumber ?? "",
                category.name.en,
                category.name.ur,
                STATUS_STYLES[category.status].label,
                csvText(category.createdAt),
                JSON.stringify(category.parameters ?? { en: [], ur: [] }),
            ]),
        );
    }

    function openAddCategoryModal() {
        setEditingCategory(null);
        setIsCategoryFormOpen(true);
    }

    function openEditCategoryModal(category: Category) {
        setEditingCategory(category);
        setIsCategoryFormOpen(true);
    }

    function closeCategoryFormModal() {
        setIsCategoryFormOpen(false);
        setEditingCategory(null);
    }

    async function handleStatusChange(category: Category, action: "activate" | "deactivate") {
        setUpdatingCategoryId(category.id);

        try {
            const response = await updateCategory({
                id: category.id,
                body: {
                    isDisabled: action === "deactivate",
                },
            }).unwrap();

            toast.success(
                (response as { message?: string })?.message ??
                `Category ${action === "activate" ? "activated" : "deactivated"} successfully`,
            );

            setIsStatusModalOpen(false);
            setPendingStatusChange(null);
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        } finally {
            setUpdatingCategoryId(null);
        }
    }

    function openStatusModal(category: Category) {
        setPendingStatusChange({
            category,
            action: category.status === "active" ? "deactivate" : "activate",
        });
        setIsStatusModalOpen(true);
    }

    function handleStatusModalOpen(value: React.SetStateAction<boolean>) {
        const nextOpen = typeof value === "function" ? value(isStatusModalOpen) : value;
        if (!nextOpen) {
            closeStatusModal();
        } else {
            setIsStatusModalOpen(true);
        }
    }

    function closeStatusModal() {
        if (updatingCategoryId) return;
        setIsStatusModalOpen(false);
        setPendingStatusChange(null);
    }

    useEffect(() => {
        if (!isStatusModalOpen && !updatingCategoryId) {
            setPendingStatusChange(null);
        }
    }, [isStatusModalOpen, updatingCategoryId]);

    return (
        <section className="  ">
            <CategoryFormModal
                open={isCategoryFormOpen}
                mode={editingCategory ? { type: "edit", category: editingCategory } : "add"}
                defaultType={activeTab}
                onClose={closeCategoryFormModal}
            />

            <Modal
                editModalRef={statusModalRef}
                open={isStatusModalOpen}
                setOpen={handleStatusModalOpen}
                centered
            >
                <div className="hide-scrollbar w-[92vw] max-w-[390px] rounded-[12px] bg-white p-5 shadow-xl ">
                    <h2 className="text-[16px] font-semibold text-black-1">
                        {pendingStatusChange?.action === "activate" ? "Activate category" : "Deactivate category"}
                    </h2>
                    <p className="mt-2 text-[14px] text-gray-8">
                        Are you sure you want to {pendingStatusChange?.action === "activate" ? "activate" : "deactivate"}{" "}
                        <span className="font-medium text-[#001907]">
                            {pendingStatusChange?.category.displayName}
                        </span>
                        ?
                    </p>
                    <div className="mt-5 flex gap-3">
                        <button
                            type="button"
                            onClick={closeStatusModal}
                            disabled={Boolean(updatingCategoryId)}
                            className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-green-1 text-[14px] font-medium text-green-1 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        {pendingStatusChange?.action === "activate" ? (
                            <DoodleButton
                                type="button"
                                disabled={Boolean(updatingCategoryId)}
                                onClick={() => {
                                    if (!pendingStatusChange) return;
                                    handleStatusChange(
                                        pendingStatusChange.category,
                                        pendingStatusChange.action,
                                    );
                                }}
                                className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-green-1 bg-green-1 text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {updatingCategoryId ? (
                                    <BeatLoader color="white" size={8} />
                                ) : (
                                    "Confirm"
                                )}
                            </DoodleButton>
                        ) : (
                            <button
                                type="button"
                                disabled={Boolean(updatingCategoryId)}
                                onClick={() => {
                                    if (!pendingStatusChange) return;
                                    handleStatusChange(
                                        pendingStatusChange.category,
                                        pendingStatusChange.action,
                                    );
                                }}
                                className="h-[40px] flex-1 cursor-pointer rounded-[8px] border border-[#E92440] bg-[#E92440] text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {updatingCategoryId ? (
                                    <BeatLoader color="white" size={8} />
                                ) : (
                                    "Confirm"
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </Modal>

            <div className="bg-[#F6F8FA] pt-10 pb-5">
                <div className="container mx-auto flex flex-wrap items-start justify-between gap-4 px-5 lg:px-10">
                    <div>
                        <h1 className="text-[20px] font-semibold text-[#001907] sm:text-[22px]">
                            Category Management
                        </h1>
                        <p className="mt-1 text-[12px] font-normal text-gray-11">
                            Manage product and service categories shown across the marketplace
                        </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                        <button
                            type="button"
                            onClick={handleExportCsv}
                            className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-[8px] border border-gray-9 bg-white px-4 text-[14px] font-medium text-gray-8 transition-colors hover:border-green-1 hover:text-green-1"
                        >
                            <Download className="h-4 w-4" strokeWidth={2} />
                            Export CSV
                        </button>
                        <DoodleButton
                            type="button"
                            onClick={openAddCategoryModal}
                            disabled={!canEdit("categories")}
                            className="inline-flex shrink-0 items-center gap-2 rounded-[10px] bg-green-1 px-4 py-2 text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Plus className="h-4 w-4" strokeWidth={2} />
                            Category
                        </DoodleButton>
                    </div>
                </div>

                <div className="container mx-auto mt-5 flex gap-2 px-5 lg:px-10">
                    {CATEGORY_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            type="button"
                            onClick={() => selectTab(tab.value)}
                            className={`cursor-pointer rounded-[8px] px-4 py-2 text-[14px] font-medium transition-colors ${activeTab === tab.value
                                ? "bg-green-1 text-white"
                                : "bg-white text-gray-8 hover:bg-gray-10"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white">
                <div className="container px-5  mx-auto mt-4 lg:px-10">
                    <div className="overflow-x-auto">
                        <table className="min-w-[400px] w-full">
                            <thead className="   ">
                                <tr className="text-left">
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Sort Number
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        <button type="button" className="inline-flex items-center gap-1">
                                            Category Name
                                            <ChevronsUpDown className="h-4 w-4 text-gray-11" />
                                        </button>
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Type
                                    </th>
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Created Date
                                    </th>
                                    {/* <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        Status
                                    </th> */}
                                    <th className="py-3 text-center text-[14px] font-medium text-[#001907]">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading &&
                                    Array.from({ length: PAGE_LIMIT }).map((_, index) => (
                                        <tr key={`skeleton-${index}`} className="bg-white">
                                            {Array.from({ length: 5 }).map((__, cellIndex) => (
                                                <td key={cellIndex} className="py-3.5 pr-4">
                                                    <div className="h-4 w-full max-w-[180px] animate-pulse rounded bg-gray-200" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}

                                {!loading && paginatedCategories.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="py-8 text-center text-[14px] text-gray-11"
                                        >
                                            No categories found
                                        </td>
                                    </tr>
                                )}

                                {!loading &&
                                    paginatedCategories.map((category) => {
                                        const statusStyle = STATUS_STYLES[category.status];

                                        return (
                                            <tr key={category.id} className="bg-white">
                                                <td className="py-3.5 pr-4">
                                                    <span
                                                        className={` px-2.5 py-1 text-[12px] font-medium `}
                                                    >
                                                        {category.sortNumber}
                                                    </span>
                                                </td>

                                                <td className="py-3.5 pr-4">
                                                    <div className="flex items-center gap-2">

                                                        {category?.icon ? <Image src={category?.icon} unoptimized alt="category" height={20} width={20} /> :
                                                            < Image src={noImageIcon} alt="category" className=" object-cover w-8 -ml-[6px] " />
                                                        }
                                                        <span className="whitespace-nowrap  first-letter:capitalize  text-[14px] font-normal text-[#001907]">
                                                            {category.displayName}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 pr-4 first-letter:capitalize">
                                                    <span className="text-[12px] font-medium">
                                                        {category.type}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                    {category.createdAt}
                                                </td>

                                                <td className="py-3.5 text-center">
                                                    <button
                                                        type="button"
                                                        aria-label="Edit category"
                                                        onClick={() => openEditCategoryModal(category)}
                                                        disabled={!canEdit("categories")}
                                                        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[6px] text-gray-11 transition-colors hover:bg-green-4 hover:text-green-1 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-11"
                                                    >
                                                        <SquarePen className="h-4 w-4" strokeWidth={2} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {!loading && (
                    <Pagination
                        className="container mx-auto px-5 lg:px-10  "
                        pageCount={pageCount}
                        currentPage={page}
                        onPageChange={setPage}
                    />
                )}
            </div>
        </section>
    );
}

export default AdminCategories;
