"use client";

import { useEffect, useRef, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { BeatLoader } from "react-spinners";
import Image from "next/image";
import { toast } from "react-hot-toast";
import DoodleButton from "@/components/Ui/DoodleButton";
import Modal from "@/components/Ui/Modals/Modal";
import { ChevronDown, Plus, X } from "lucide-react";
import {
    useCreateNewCategoryMutation,
    useUpdateCategoryMutation,
} from "@/store/services/adminService";
import noImageIcon from "@/assets/images/new-no-image-placeholder.png";

export type CategoryType = "product" | "service";

export type CategoryParameters = {
    en: string[];
    ur: string[];
};

export type CategoryFormCategory = {
    id: string;
    name: { en: string; ur: string };
    type: CategoryType;
    icon?: string;
    parameters?: CategoryParameters;
};

export type CategoryFormMode = "add" | { type: "edit"; category: CategoryFormCategory };

const CATEGORY_TYPE_OPTIONS: { value: CategoryType; label: string }[] = [
    { value: "product", label: "Product" },
    { value: "service", label: "Service" },
];

type FormErrors = {
    nameEn?: string;
    nameUr?: string;
};

function ParameterInputList({
    id,
    label,
    values,
    inputValue,
    dir,
    placeholder,
    onInputChange,
    onAdd,
    onRemove,
}: {
    id: string;
    label: string;
    values: string[];
    inputValue: string;
    dir?: "rtl" | "ltr";
    placeholder: string;
    onInputChange: (value: string) => void;
    onAdd: () => void;
    onRemove: (index: number) => void;
}) {
    return (
        <div>
            <label htmlFor={id} className="text-[14px] font-normal text-gray-11">
                {label}
            </label>
            <div className="mt-2 flex items-center gap-2 border-0 border-b border-gray-9 pb-2">
                <input
                    id={id}
                    type="text"
                    value={inputValue}
                    dir={dir}
                    placeholder={placeholder}
                    onChange={(event) => onInputChange(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            onAdd();
                        }
                    }}
                    className="w-full border-0 bg-transparent py-1 text-[14px] text-[#001907] outline-none focus:border-green-1"
                />
                <button
                    type="button"
                    onClick={onAdd}
                    disabled={!inputValue.trim()}
                    className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-green-1 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`Add ${label.toLowerCase()}`}
                >
                    <Plus className="h-4 w-4" />
                </button>
            </div>
            {values.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {values.map((value, index) => (
                        <span
                            key={`${value}-${index}`}
                            className="inline-flex items-center gap-1 rounded-[6px] bg-[#E6FBFB] px-2.5 py-1 text-[12px] text-[#001907]"
                        >
                            <span dir={dir}>{value}</span>
                            <button
                                type="button"
                                onClick={() => onRemove(index)}
                                className="inline-flex cursor-pointer items-center justify-center text-gray-11 hover:text-red-1"
                                aria-label={`Remove ${value}`}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

function buildParametersPayload(parametersEn: string[], parametersUr: string[]): CategoryParameters | undefined {
    const en = parametersEn.map((item) => item.trim()).filter(Boolean);
    const ur = parametersUr.map((item) => item.trim()).filter(Boolean);
    if (en.length === 0 && ur.length === 0) {
        return undefined;
    }
    return { en, ur };
}

function addParameterValue(
    value: string,
    setValues: React.Dispatch<React.SetStateAction<string[]>>,
    setInput: React.Dispatch<React.SetStateAction<string>>,
) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setValues((prev) => [...prev, trimmed]);
    setInput("");
}

type CategoryFormModalProps = {
    open: boolean;
    mode: CategoryFormMode;
    onClose: () => void;
};

function CategoryFormModal({ open, mode, onClose }: CategoryFormModalProps) {
    const isEdit = mode !== "add";
    const editCategory = isEdit ? mode.category : null;
    const modalRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [nameEn, setNameEn] = useState("");
    const [nameUr, setNameUr] = useState("");
    const [type, setType] = useState<CategoryType>("product");
    const [iconPreview, setIconPreview] = useState<string | null>(null);
    const [iconFile, setIconFile] = useState<File | null>(null);
    const [parametersEn, setParametersEn] = useState<string[]>([]);
    const [parametersUr, setParametersUr] = useState<string[]>([]);
    const [parameterInputEn, setParameterInputEn] = useState("");
    const [parameterInputUr, setParameterInputUr] = useState("");
    const [errors, setErrors] = useState<FormErrors>({});

    const [createNewCategory, { isLoading: isCreatingCategory }] = useCreateNewCategoryMutation();
    const [updateCategory, { isLoading: isUpdatingCategory }] = useUpdateCategoryMutation();
    const isSubmitting = isCreatingCategory || isUpdatingCategory;

    useEffect(() => {
        if (!open) return;

        setNameEn(editCategory?.name.en ?? "");
        setNameUr(editCategory?.name.ur ?? "");
        setType(editCategory?.type ?? "product");
        setIconPreview(editCategory?.icon ?? null);
        setIconFile(null);
        setParametersEn(editCategory?.parameters?.en ?? []);
        setParametersUr(editCategory?.parameters?.ur ?? []);
        setParameterInputEn("");
        setParameterInputUr("");
        setErrors({});
    }, [open, editCategory]);

    function handleSetOpen(value: React.SetStateAction<boolean>) {
        const nextOpen = typeof value === "function" ? value(open) : value;
        if (!nextOpen && !isSubmitting) {
            onClose();
        }
    }

    function handleClose() {
        if (isSubmitting) return;
        onClose();
    }

    async function handleSubmit() {
        const nextErrors: FormErrors = {};

        if (!nameEn.trim()) {
            nextErrors.nameEn = "English category name is required";
        }

        if (!nameUr.trim()) {
            nextErrors.nameUr = "Urdu category name is required";
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        const trimmedNameEn = nameEn.trim();
        const trimmedNameUr = nameUr.trim();
        const name = { en: trimmedNameEn, ur: trimmedNameUr };
        const parameters = buildParametersPayload(parametersEn, parametersUr);
        const payload = { name, type, isDisabled: false, ...(parameters ? { parameters } : {}) };
        const body = iconFile
            ? (() => {
                const formData = new FormData();
                formData.append("name", JSON.stringify(name));
                formData.append("type", type);
                formData.append("icon", iconFile);
                formData.append("isDisabled", "false");
                if (parameters) {
                    formData.append("parameters", JSON.stringify(parameters));
                }
                return formData;
            })()
            : payload;

        try {
            if (isEdit && editCategory) {
                const response = await updateCategory({
                    id: editCategory.id,
                    body,
                }).unwrap();
                toast.success(
                    (response as { message?: string })?.message ?? "Category updated successfully",
                );
            } else {
                const response = await createNewCategory(body).unwrap();
                toast.success(
                    (response as { message?: string })?.message ?? "Category created successfully",
                );
            }
            onClose();
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    return (
        <Modal editModalRef={modalRef} open={open} setOpen={handleSetOpen} centered>
            <div className="hide-scrollbar w-[92vw] max-w-[520px] rounded-[12px] bg-white p-6 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                    <h2 className="text-[18px] font-semibold text-[#001907]">
                        {isEdit ? "Edit category" : "Add category"}
                    </h2>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        aria-label="Close"
                        className="inline-flex h-8 w-8 items-center justify-center disabled:opacity-60"
                    >
                        <XMarkIcon className="h-5 w-5 text-[#001907]" />
                    </button>
                </div>

                <p className="mt-3 text-[14px] leading-6 text-gray-11">
                    {isEdit
                        ? "You can update the name of this category. Changes will reflect immediately across all associated listings."
                        : "Add a new category. It will be available immediately across all associated listings."}
                </p>
                <div className="mt-6 flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E6FBFB]">
                        {iconPreview ? (
                            <Image
                                src={iconPreview}
                                alt=""
                                width={24}
                                height={24}
                                unoptimized
                                className="h-6 w-6 object-contain"
                            />
                        ) : (
                            <Image src={noImageIcon} alt="no image" className="w-10  object-cover" />
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[14px] cursor-pointer font-medium text-green-1"
                    >
                        {isEdit ? "Edit icon" : "Add icon"}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            setIconFile(file);
                            setIconPreview(URL.createObjectURL(file));
                        }}
                    />
                </div>
                <div className="mt-6">
                    <label
                        htmlFor="category-type"
                        className="text-[14px] font-normal text-gray-11"
                    >
                        Type
                    </label>
                    <div className="relative mt-2">
                        <select
                            id="category-type"
                            value={type}
                            onChange={(event) => setType(event.target.value as CategoryType)}
                            className="w-full appearance-none border-0 border-b border-gray-9 bg-transparent py-2 pr-8 text-[14px] text-[#001907] outline-none focus:border-green-1"
                        >
                            {CATEGORY_TYPE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none cursor-pointer absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-11" />
                    </div>
                </div>

                <div className="mt-8 space-y-6">
                    <div>
                        <label
                            htmlFor="category-name-en"
                            className={`text-[14px] font-normal ${errors.nameEn ? "text-red-1" : "text-gray-11"}`}
                        >
                            Category name (English)
                        </label>
                        <input
                            id="category-name-en"
                            type="text"
                            value={nameEn}
                            onChange={(event) => {
                                setNameEn(event.target.value);
                                if (errors.nameEn) {
                                    setErrors((prev) => ({ ...prev, nameEn: undefined }));
                                }
                            }}
                            placeholder="Enter category name"
                            className={`mt-2 w-full border-0 border-b bg-transparent py-2 text-[14px] text-[#001907] outline-none ${errors.nameEn ? "border-red-1 focus:border-red-1" : "border-gray-9 focus:border-green-1"}`}
                        />
                        {errors.nameEn && (
                            <p className="mt-1 text-[12px] font-normal text-red-1">{errors.nameEn}</p>
                        )}
                    </div>
                    <div>
                        <label
                            htmlFor="category-name-ur"
                            className={`text-[14px] font-normal ${errors.nameUr ? "text-red-1" : "text-gray-11"}`}
                        >
                            Category name (Urdu)
                        </label>
                        <input
                            id="category-name-ur"
                            type="text"
                            value={nameUr}
                            onChange={(event) => {
                                setNameUr(event.target.value);
                                if (errors.nameUr) {
                                    setErrors((prev) => ({ ...prev, nameUr: undefined }));
                                }
                            }}
                            placeholder="کیٹیگری کا نام لکھیں"
                            dir="rtl"
                            className={`mt-2 w-full border-0 border-b bg-transparent py-2 text-[14px] text-[#001907] outline-none ${errors.nameUr ? "border-red-1 focus:border-red-1" : "border-gray-9 focus:border-green-1"}`}
                        />
                        {errors.nameUr && (
                            <p className="mt-1 text-[12px] font-normal text-red-1">{errors.nameUr}</p>
                        )}
                    </div>

                    <div className="space-y-4">
                        <ParameterInputList
                            id="category-parameters-en"
                            label="Parameters (English)"
                            values={parametersEn}
                            inputValue={parameterInputEn}
                            placeholder="e.g. Size"
                            onInputChange={setParameterInputEn}
                            onAdd={() => addParameterValue(parameterInputEn, setParametersEn, setParameterInputEn)}
                            onRemove={(index) =>
                                setParametersEn((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
                            }
                        />
                        <ParameterInputList
                            id="category-parameters-ur"
                            label="Parameters (Urdu)"
                            values={parametersUr}
                            inputValue={parameterInputUr}
                            dir="rtl"
                            placeholder="مثال: سائز"
                            onInputChange={setParameterInputUr}
                            onAdd={() => addParameterValue(parameterInputUr, setParametersUr, setParameterInputUr)}
                            onRemove={(index) =>
                                setParametersUr((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
                            }
                        />
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="h-[40px] min-w-[100px] cursor-pointer rounded-[8px] border border-green-1 px-4 text-[14px] font-medium text-green-1 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Cancel
                    </button>
                    <DoodleButton
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleSubmit}
                        className="h-[40px] min-w-[150px] cursor-pointer rounded-[8px] border border-green-1 bg-green-1 px-4 text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? (
                            <BeatLoader color="white" size={8} />
                        ) : isEdit ? (
                            "Confirm Changes"
                        ) : (
                            "Add category"
                        )}
                    </DoodleButton>
                </div>
            </div>
        </Modal>
    );
}

export default CategoryFormModal;
