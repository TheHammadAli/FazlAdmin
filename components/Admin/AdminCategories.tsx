"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronsUpDown, Plus } from "lucide-react";
import { BeatLoader } from "react-spinners";
import { toast } from "react-hot-toast";
import Pagination from "@/components/Ui/Pagination";
import Modal from "@/components/Ui/Modals/Modal";
import CategoryFormModal, { type CategoryParameters, type CategoryType } from "@/components/Admin/CategoryFormModal";
import DoodleButton from "@/components/Ui/DoodleButton";
import { useUpdateCategoryMutation } from "@/store/services/adminService";
import threeDotsIcon from "@/assets/icons/three-dots.svg";
import Image from "next/image";
import { useClickOutside } from "@/custom-hooks/useClickOutside";
import { useCategoriesQuery } from "@/custom-hooks/useCategoriesQuery";
import { getFeedCategoryLabel } from "@/utils/getFeedCategoryLabel";
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
};

type CategoriesResponse = {
    data?: ApiCategory[];
};

const PAGE_LIMIT = 10;

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

function mapApiCategory(category: ApiCategory): Category {
    const createdAt = category.createdAt
        ? new Date(category.createdAt).toISOString().slice(0, 10)
        : "-";

    const name =
        typeof category.name === "string"
            ? { en: category.name, ur: category.name }
            : {
                en: category.name?.en ?? "",
                ur: category.name?.ur ?? "",
            };

    return {
        id: category._id ?? category.id ?? "",
        name,
        displayName: getFeedCategoryLabel(category.name ?? "", "en") || "-",
        createdAt,
        status: mapCategoryStatus(category),
        type: category.type === "service" ? "service" : "product",
        icon: category.icon,
        parameters: category.parameters
            ? {
                en: category.parameters.en ?? [],
                ur: category.parameters.ur ?? [],
            }
            : undefined,
    };
}

type PendingStatusChange = {
    category: Category;
    action: "activate" | "deactivate";
};

function CategoryActionsMenu({
    category,
    isOpen,
    onToggle,
    onClose,
    onEdit,
    onStatusAction,
}: {
    category: Category;
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    onEdit: () => void;
    onStatusAction: () => void;
}) {
    const menuRef = useRef<HTMLDivElement>(null);
    useClickOutside(menuRef, onClose);

    function handleMenuAction(action: () => void) {
        return (event: React.MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();
            action();
            onClose();
        };
    }

    return (
        <div className="relative inline-flex" ref={menuRef}>
            <button
                type="button"
                aria-label="Category actions"
                onClick={onToggle}
                className="inline-flex cursor-pointer h-8 w-8 items-center justify-center"
            >
                <Image src={threeDotsIcon} alt="" />
            </button>

            {isOpen && (
                <div
                    onMouseDown={(event) => event.stopPropagation()}
                    className="absolute right-0 top-8 z-20 w-[136px] rounded-[6px] border-[0.5px] border-[#00000033] bg-white p-1 shadow-xl"
                >
                    <button
                        type="button"
                        onMouseDown={handleMenuAction(onEdit)}
                        className="w-full cursor-pointer p-[10px] text-left text-[12px] leading-none hover:bg-green-3"
                    >
                        Edit Category
                    </button>
                    {/* <button
                        type="button"
                        onMouseDown={handleMenuAction(onStatusAction)}
                        className="w-full cursor-pointer p-[10px] text-left text-[12px] leading-none hover:bg-green-3"
                    >
                        {category.status === "active" ? "Deactivate" : "Activate"}
                    </button> */}
                </div>
            )}
        </div>
    );
}

function AdminCategories() {
    const [page, setPage] = useState(1);
    const [updatingCategoryId, setUpdatingCategoryId] = useState<string | null>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [pendingStatusChange, setPendingStatusChange] = useState<PendingStatusChange | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const statusModalRef = useRef<HTMLDivElement>(null);

    const {
        data: categoriesResponse,
        isLoading: isCategoriesLoading,
        isFetching: isCategoriesFetching,
    } = useGetAllCategoriesForAdminQuery("")

    const [updateCategory] = useUpdateCategoryMutation();

    const allCategories = useMemo(() => {
        const response = categoriesResponse as CategoriesResponse | undefined;
        return (response?.data ?? []).map(mapApiCategory);
    }, [categoriesResponse]);

    const totalCategories = allCategories.length;
    const pageCount = Math.max(1, Math.ceil(totalCategories / PAGE_LIMIT));

    const paginatedCategories = useMemo(() => {
        const start = (page - 1) * PAGE_LIMIT;
        return allCategories.slice(start, start + PAGE_LIMIT);
    }, [allCategories, page]);

    const loading = isCategoriesLoading || isCategoriesFetching;

    useEffect(() => {
        if (page > pageCount) {
            setPage(pageCount);
        }
    }, [page, pageCount]);

    function openAddCategoryModal() {
        setEditingCategory(null);
        setIsCategoryFormOpen(true);
    }

    function openEditCategoryModal(category: Category) {
        setOpenMenuId(null);
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
        setOpenMenuId(null);
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
                onClose={closeCategoryFormModal}
            />

            <Modal
                editModalRef={statusModalRef}
                open={isStatusModalOpen}
                setOpen={handleStatusModalOpen}
                centered
            >
                <div className="hide-scrollbar w-[92vw] max-w-[390px] rounded-[12px] bg-white p-5 shadow-xl">
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
                <div className="container mx-auto flex items-center justify-between gap-4 px-5 lg:px-10">
                    <h1 className="text-[24px] font-semibold text-[#001907] sm:text-[28px]">
                        {loading ? "..." : `${totalCategories} Categories`}
                    </h1>
                    <DoodleButton
                        type="button"
                        onClick={openAddCategoryModal}
                        className="inline-flex shrink-0 items-center gap-2 rounded-[10px] bg-green-1 px-4 py-2 text-[14px] font-medium text-white"
                    >
                        <Plus className="h-4 w-4" strokeWidth={2} />
                        Category
                    </DoodleButton>
                </div>
            </div>

            <div className="bg-white">
                <div className="container px-5  mx-auto mt-4 lg:px-10">
                    <div className="overflow-x-auto">
                        <table className="min-w-[400px] w-full">
                            <thead className="   ">
                                <tr className="text-left">
                                    <th className="py-3 pr-4 text-[14px] font-medium text-[#001907]">
                                        <button type="button" className="inline-flex items-center gap-1">
                                            Category Name
                                            <ChevronsUpDown className="h-4 w-4 text-gray-11" />
                                        </button>
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
                                            {Array.from({ length: 4 }).map((__, cellIndex) => (
                                                <td key={cellIndex} className="py-3.5 pr-4">
                                                    <div className="h-4 w-full max-w-[180px] animate-pulse rounded bg-gray-200" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}

                                {!loading && paginatedCategories.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
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
                                                    <div className="flex items-center gap-2">

                                                        {category?.icon ? <Image src={category?.icon} unoptimized alt="category" height={20} width={20} /> :
                                                            < Image src={noImageIcon} alt="category" className=" object-cover w-8 -ml-[6px] " />
                                                        }
                                                        <span className="whitespace-nowrap  first-letter:capitalize  text-[14px] font-normal text-[#001907]">
                                                            {category.displayName}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap py-3.5 pr-4 text-[14px] font-normal text-gray-11">
                                                    {category.createdAt}
                                                </td>
                                                {/* <td className="py-3.5 pr-4">
                                                    <span
                                                        className={`inline-flex rounded-[6px] px-2.5 py-1 text-[12px] font-medium ${statusStyle.className}`}
                                                    >
                                                        {statusStyle.label}
                                                    </span>
                                                </td> */}
                                                <td className="py-3.5 text-center">
                                                    <CategoryActionsMenu
                                                        category={category}
                                                        isOpen={openMenuId === category.id}
                                                        onToggle={() =>
                                                            setOpenMenuId((prev) =>
                                                                prev === category.id ? null : category.id,
                                                            )
                                                        }
                                                        onClose={() => setOpenMenuId(null)}
                                                        onEdit={() => openEditCategoryModal(category)}
                                                        onStatusAction={() => openStatusModal(category)}
                                                    />
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
