"use client";

import { useEffect, useRef, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { BeatLoader } from "react-spinners";
import Image from "next/image";
import { toast } from "react-hot-toast";
import DoodleButton from "@/components/Ui/DoodleButton";
import Modal from "@/components/Ui/Modals/Modal";
import { Check, ChevronDown, ChevronUp, Languages, Plus, Tag, X } from "lucide-react";
import {
    useCreateNewCategoryMutation,
    useUpdateCategoryMutation,
    useTranslateTextMutation,
} from "@/store/services/adminService";
import noImageIcon from "@/assets/images/new-no-image-placeholder.png";

export type CategoryType = "product" | "service";

export type CategoryParameter = {
    name: string;
    values: string[];
};

export type CategoryParameters = {
    en: CategoryParameter[];
    ur: CategoryParameter[];
};

export type CategoryFormCategory = {
    id: string;
    name: { en: string; ur: string };
    type: CategoryType;
    icon?: string;
    parameters?: CategoryParameters;
    sortNumber?: number;
};

export type CategoryFormMode = "add" | { type: "edit"; category: CategoryFormCategory };

const CATEGORY_TYPE_OPTIONS: { value: CategoryType; label: string }[] = [
    { value: "product", label: "Product" },
    { value: "service", label: "Service" },
];

type FormErrors = {
    nameEn?: string;
    nameUr?: string;
    sortNumber?: string;
    parameters?: string;
};

function ParameterListEditor({
    idPrefix,
    label,
    parameters,
    dir,
    namePlaceholder,
    valuePlaceholder,
    onChange,
}: {
    idPrefix: string;
    label: string;
    parameters: CategoryParameter[];
    dir?: "rtl" | "ltr";
    namePlaceholder: string;
    valuePlaceholder: string;
    onChange: (parameters: CategoryParameter[]) => void;
}) {
    const [valueInputs, setValueInputs] = useState<string[]>([]);

    function updateParameter(index: number, parameter: CategoryParameter) {
        onChange(parameters.map((item, itemIndex) => (itemIndex === index ? parameter : item)));
    }

    function removeParameter(index: number) {
        onChange(parameters.filter((_, itemIndex) => itemIndex !== index));
        setValueInputs((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
    }

    function moveParameter(index: number, direction: -1 | 1) {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= parameters.length) return;

        const nextParameters = [...parameters];
        [nextParameters[index], nextParameters[targetIndex]] = [
            nextParameters[targetIndex],
            nextParameters[index],
        ];
        onChange(nextParameters);

        setValueInputs((prev) => {
            const next = [...prev];
            [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
            return next;
        });
    }

    function setValueInput(index: number, value: string) {
        setValueInputs((prev) => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    }

    function addValue(index: number) {
        const value = valueInputs[index]?.trim();
        if (!value) return;
        const parameter = parameters[index];
        updateParameter(index, { ...parameter, values: [...parameter.values, value] });
        setValueInput(index, "");
    }

    return (
        <div>
            <p className="text-[14px] font-normal text-gray-11">{label}</p>
            <div className="mt-3 space-y-4">
                {parameters.map((parameter, index) => (
                    <div key={index} className="rounded-[8px] border border-gray-9 p-3">
                        <div className="flex items-center gap-2">
                            <input
                                id={`${idPrefix}-name-${index}`}
                                type="text"
                                value={parameter.name}
                                dir={dir}
                                placeholder={namePlaceholder}
                                onChange={(event) =>
                                    updateParameter(index, { ...parameter, name: event.target.value })
                                }
                                className="w-full border-0 border-b border-gray-9 bg-transparent py-1 text-[14px] font-medium text-[#001907] outline-none focus:border-green-1"
                            />
                            <div className="flex shrink-0 items-center gap-0.5">
                                <button
                                    type="button"
                                    onClick={() => moveParameter(index, -1)}
                                    disabled={index === 0}
                                    className="inline-flex h-7 w-7 cursor-pointer items-center justify-center text-gray-11 hover:text-green-1 disabled:cursor-not-allowed disabled:opacity-30"
                                    aria-label={`Move parameter ${index + 1} up`}
                                >
                                    <ChevronUp className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => moveParameter(index, 1)}
                                    disabled={index === parameters.length - 1}
                                    className="inline-flex h-7 w-7 cursor-pointer items-center justify-center text-gray-11 hover:text-green-1 disabled:cursor-not-allowed disabled:opacity-30"
                                    aria-label={`Move parameter ${index + 1} down`}
                                >
                                    <ChevronDown className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => removeParameter(index)}
                                    className="inline-flex h-7 w-7 cursor-pointer items-center justify-center text-gray-11 hover:text-red-1"
                                    aria-label={`Remove parameter ${index + 1}`}
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2 border-0 border-b border-gray-9 pb-2">
                            <input
                                id={`${idPrefix}-value-${index}`}
                                type="text"
                                value={valueInputs[index] ?? ""}
                                dir={dir}
                                placeholder={valuePlaceholder}
                                onChange={(event) => setValueInput(index, event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        event.preventDefault();
                                        addValue(index);
                                    }
                                }}
                                className="w-full border-0 bg-transparent py-1 text-[14px] text-[#001907] outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => addValue(index)}
                                disabled={!valueInputs[index]?.trim()}
                                className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-green-1 disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label={`Add value to parameter ${index + 1}`}
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                        {parameter.values.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {parameter.values.map((value, valueIndex) => {
                                    const safeValue = typeof value === "string" ? value : "";

                                    return (
                                        <span
                                            key={`${safeValue}-${valueIndex}`}
                                            className="inline-flex items-center gap-1 rounded-[6px] bg-[#E6FBFB] px-2.5 py-1 text-[12px] text-[#001907]"
                                        >
                                            <span dir={dir}>{safeValue}</span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    updateParameter(index, {
                                                        ...parameter,
                                                        values: parameter.values.filter(
                                                            (_, itemIndex) => itemIndex !== valueIndex,
                                                        ),
                                                    })
                                                }
                                                className="inline-flex cursor-pointer items-center justify-center text-gray-11 hover:text-red-1"
                                                aria-label={`Remove ${safeValue}`}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <button
                type="button"
                onClick={() => onChange([...parameters, { name: "", values: [] }])}
                className="mt-3 inline-flex cursor-pointer items-center gap-1 text-[14px] font-medium text-green-1"
            >
                <Plus className="h-4 w-4" />
                Add parameter
            </button>
        </div>
    );
}

function clonedParameters(parameters?: unknown): CategoryParameter[] {
    if (!Array.isArray(parameters)) return [];
    return parameters.map((parameter: unknown) => {
        const record = parameter as { name?: unknown; values?: unknown } | null | undefined;
        return {
            name: typeof record?.name === "string" ? record.name : "",
            values: Array.isArray(record?.values)
                ? record.values.filter((value: unknown): value is string => typeof value === "string")
                : [],
        };
    });
}

function normalizeParameters(parameters: CategoryParameter[]): CategoryParameter[] {
    return parameters
        .map((parameter) => ({
            name: parameter.name.trim(),
            values: parameter.values.map((value) => value.trim()).filter(Boolean),
        }))
        .filter((parameter) => parameter.name && parameter.values.length > 0);
}

function buildParametersPayload(
    parametersEn: CategoryParameter[],
    parametersUr: CategoryParameter[],
): CategoryParameters | undefined {
    const en = normalizeParameters(parametersEn);
    const ur = normalizeParameters(parametersUr);
    if (en.length === 0 && ur.length === 0) {
        return undefined;
    }
    return { en, ur };
}

function validateParameters(
    parametersEn: CategoryParameter[],
    parametersUr: CategoryParameter[],
): string | undefined {
    for (const [language, parameters] of [
        ["English", parametersEn],
        ["Urdu", parametersUr],
    ] as const) {
        for (const parameter of parameters) {
            const values = parameter.values.map((value) => value.trim()).filter(Boolean);
            if (!parameter.name.trim()) {
                return `Enter a name for every ${language} parameter`;
            }
            if (values.length === 0) {
                return `Add at least one value for the ${language} parameter "${parameter.name.trim()}"`;
            }
        }
    }

    const en = normalizeParameters(parametersEn);
    const ur = normalizeParameters(parametersUr);

    if (en.length !== ur.length) {
        return "Add the same number of parameters in both English and Urdu";
    }

    for (let index = 0; index < en.length; index += 1) {
        if (en[index].values.length !== ur[index].values.length) {
            return `Parameter "${en[index].name}" must have the same number of values in English and Urdu`;
        }
    }

    return undefined;
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
    const [sortNumber, setSortNumber] = useState("1");
    const [iconPreview, setIconPreview] = useState<string | null>(null);
    const [iconFile, setIconFile] = useState<File | null>(null);
    const [parametersEn, setParametersEn] = useState<CategoryParameter[]>([]);
    const [parametersUr, setParametersUr] = useState<CategoryParameter[]>([]);
    const [errors, setErrors] = useState<FormErrors>({});

    const [createNewCategory, { isLoading: isCreatingCategory }] = useCreateNewCategoryMutation();
    const [updateCategory, { isLoading: isUpdatingCategory }] = useUpdateCategoryMutation();
    const [translateText] = useTranslateTextMutation();
    const [isTranslating, setIsTranslating] = useState(false);
    const isSubmitting = isCreatingCategory || isUpdatingCategory;

    useEffect(() => {
        if (!open) return;

        setNameEn(editCategory?.name.en ?? "");
        setNameUr(editCategory?.name.ur ?? "");
        setType(editCategory?.type ?? "product");
        setSortNumber(
            editCategory?.sortNumber !== undefined && editCategory?.sortNumber !== null
                ? String(editCategory.sortNumber)
                : "1",
        );
        setIconPreview(editCategory?.icon ?? null);
        setIconFile(null);
        setParametersEn(clonedParameters(editCategory?.parameters?.en));
        setParametersUr(clonedParameters(editCategory?.parameters?.ur));
        setErrors({});
    }, [open, editCategory]);

    function clearParametersError() {
        setErrors((prev) => (prev.parameters ? { ...prev, parameters: undefined } : prev));
    }

    function handleParametersEnChange(parameters: CategoryParameter[]) {
        setParametersEn(parameters);
        clearParametersError();
    }

    function handleParametersUrChange(parameters: CategoryParameter[]) {
        setParametersUr(parameters);
        clearParametersError();
    }

    async function handleTranslateFromEnglish() {
        if (parametersEn.length === 0) return;
        setIsTranslating(true);
        try {
            const translated = await Promise.all(
                parametersEn.map(async (parameter) => {
                    const [name, ...values] = await Promise.all([
                        translateText(parameter.name).unwrap().then((res) => res.translatedText),
                        ...parameter.values.map((value) =>
                            translateText(value).unwrap().then((res) => res.translatedText),
                        ),
                    ]);
                    return { name, values };
                }),
            );
            setParametersUr(translated);
            clearParametersError();
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Translation failed. Please try again.");
        } finally {
            setIsTranslating(false);
        }
    }

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

        const trimmedSortNumber = sortNumber.trim();
        const parsedSortNumber = trimmedSortNumber === "" ? NaN : Number(trimmedSortNumber);
        if (trimmedSortNumber === "") {
            nextErrors.sortNumber = "Sort number is required";
        } else if (!Number.isInteger(parsedSortNumber) || parsedSortNumber < 1) {
            nextErrors.sortNumber = "Sort number must be an integer starting from 1";
        }

        const parametersError = validateParameters(parametersEn, parametersUr);
        if (parametersError) {
            nextErrors.parameters = parametersError;
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        const trimmedNameEn = nameEn.trim();
        const trimmedNameUr = nameUr.trim();
        const name = { en: trimmedNameEn, ur: trimmedNameUr };
        const parameters = buildParametersPayload(parametersEn, parametersUr);
        const payload = {
            name,
            type,
            isDisabled: false,
            sortNumber: parsedSortNumber,
            ...(parameters ? { parameters } : {}),
        };
        const body = iconFile
            ? (() => {
                const formData = new FormData();
                formData.append("name", JSON.stringify(name));
                formData.append("type", type);
                formData.append("icon", iconFile);
                formData.append("isDisabled", "false");
                formData.append("sortNumber", String(parsedSortNumber));
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
            <div className="hide-scrollbar w-[92vw] max-w-[600px] bg-white rounded-[12px] p-6 shadow-xl ">
                <div className="flex items-start justify-between gap-4">
                    <h2 className="flex items-center gap-2 text-[18px] font-semibold text-[#001907]">
                        <Tag className="h-5 w-5 text-green-1" strokeWidth={2} />
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
                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
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

                    <div>
                        <label
                            htmlFor="category-sort-number"
                            className={`text-[14px] font-normal ${errors.sortNumber ? "text-red-1" : "text-gray-11"}`}
                        >
                            Sort number
                        </label>
                        <input
                            id="category-sort-number"
                            type="number"
                            min={1}
                            step={1}
                            required
                            value={sortNumber}
                            onChange={(event) => {
                                setSortNumber(event.target.value);
                                if (errors.sortNumber) {
                                    setErrors((prev) => ({ ...prev, sortNumber: undefined }));
                                }
                            }}
                            placeholder="1"
                            className={`mt-2 w-full border-0 border-b bg-transparent py-2 text-[14px] text-[#001907] outline-none ${errors.sortNumber ? "border-red-1 focus:border-red-1" : "border-gray-9 focus:border-green-1"}`}
                        />
                        {errors.sortNumber && (
                            <p className="mt-1 text-[12px] font-normal text-red-1">{errors.sortNumber}</p>
                        )}
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                </div>

                <div className="mt-8 border-t border-gray-9 pt-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                            Parameters (optional)
                        </p>
                        <button
                            type="button"
                            onClick={handleTranslateFromEnglish}
                            disabled={parametersEn.length === 0 || isTranslating}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-[6px] border border-gray-9 px-2.5 py-1.5 text-[12px] font-medium text-gray-8 transition-colors hover:border-green-1 hover:text-green-1 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {isTranslating ? (
                                <BeatLoader size={5} color="#007781" />
                            ) : (
                                <>
                                    <Languages className="h-3.5 w-3.5" strokeWidth={2} />
                                    Translate from English
                                </>
                            )}
                        </button>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <ParameterListEditor
                            key={`en-${editCategory?.id ?? "add"}`}
                            idPrefix="category-parameters-en"
                            label="Parameters (English)"
                            parameters={parametersEn}
                            namePlaceholder="e.g. Size"
                            valuePlaceholder="e.g. S"
                            onChange={handleParametersEnChange}
                        />
                        <ParameterListEditor
                            key={`ur-${editCategory?.id ?? "add"}`}
                            idPrefix="category-parameters-ur"
                            label="Parameters (Urdu)"
                            parameters={parametersUr}
                            dir="rtl"
                            namePlaceholder="مثال: سائز"
                            valuePlaceholder="مثال: ایس"
                            onChange={handleParametersUrChange}
                        />
                    </div>
                    {errors.parameters && (
                        <p className="mt-3 text-[12px] font-normal text-red-1">{errors.parameters}</p>
                    )}
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
                            <>
                                <Check className="h-4 w-4" strokeWidth={2} />
                                Confirm Changes
                            </>
                        ) : (
                            <>
                                <Plus className="h-4 w-4" strokeWidth={2} />
                                Add category
                            </>
                        )}
                    </DoodleButton>
                </div>
            </div>
        </Modal>
    );
}

export default CategoryFormModal;
