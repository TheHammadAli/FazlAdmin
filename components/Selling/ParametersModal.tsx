"use client";

import { useDictionary } from "@/dictionaries/DictionaryProvider";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import crossIcon from "@/assets/icons/cross-icon.svg";
import deleteIcon from "@/assets/icons/delete-icon.svg";
import plusIcon from "@/assets/icons/green-plus-icon.svg";
import ParameterValueChip from "./ParameterValueChip";
import DoodleButton from "@/components/Ui/DoodleButton";

export type parameterTypes = {
  name: string;
  variants: string[];
};

type ParametersModalProps = {
  open: boolean;
  parameters: parameterTypes[];
  setParameters: React.Dispatch<React.SetStateAction<parameterTypes[]>>;
  setOpen: (open: boolean) => void;
};

const emptyParameter = (): parameterTypes => ({
  name: "",
  variants: [],
});

function normalizeDraft(items: parameterTypes[]): parameterTypes[] {
  if (items.length === 0) return [emptyParameter()];
  return items.map((p) => ({
    name: p.name,
    variants: [...p.variants],
  }));
}

function sanitizeParameters(items: parameterTypes[]): parameterTypes[] {
  return items
    .map((p) => ({
      name: p.name.trim(),
      variants: p.variants.map((v) => v.trim()).filter(Boolean),
    }))
    .filter((p) => p.name !== "");
}

export function hasDuplicateParameterNames(items: parameterTypes[]): boolean {
  const names = items
    .map((p) => p.name.trim().toLowerCase())
    .filter(Boolean);
  return new Set(names).size !== names.length;
}

function getDuplicateParameterNameIndexes(items: parameterTypes[]): Set<number> {
  const seen = new Map<string, number>();
  const duplicates = new Set<number>();

  items.forEach((parameter, index) => {
    const name = parameter.name.trim().toLowerCase();
    if (!name) return;

    const existingIndex = seen.get(name);
    if (existingIndex !== undefined) {
      duplicates.add(existingIndex);
      duplicates.add(index);
    } else {
      seen.set(name, index);
    }
  });

  return duplicates;
}

function ParametersModal({
  open,
  parameters,
  setParameters,
  setOpen,
}: ParametersModalProps) {
  const { placeholders, error_messages } = useDictionary();
  const [draft, setDraft] = useState<parameterTypes[]>(() =>
    normalizeDraft(parameters),
  );
  const [newVariantByParam, setNewVariantByParam] = useState<
    Record<number, string>
  >({});
  const [editingVariantByParam, setEditingVariantByParam] = useState<
    Record<number, number | null>
  >({});

  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setDraft(normalizeDraft(parameters));
      setNewVariantByParam({});
      setEditingVariantByParam({});
    }
    wasOpenRef.current = open;
  }, [open, parameters]);

  const handleAddParameter = () => {
    setDraft((prev) => [...prev, emptyParameter()]);
  };

  const handleRemoveParameter = (paramIndex: number) => {
    setDraft((prev) => {
      if (prev.length <= 1) return [emptyParameter()];
      return prev.filter((_, i) => i !== paramIndex);
    });
    setNewVariantByParam((prev) => {
      const next: Record<number, string> = {};
      Object.entries(prev).forEach(([key, value]) => {
        const index = Number(key);
        if (index < paramIndex) next[index] = value;
        else if (index > paramIndex) next[index - 1] = value;
      });
      return next;
    });
    setEditingVariantByParam((prev) => {
      const next: Record<number, number | null> = {};
      Object.entries(prev).forEach(([key, value]) => {
        const index = Number(key);
        if (index < paramIndex) next[index] = value;
        else if (index > paramIndex) next[index - 1] = value;
      });
      return next;
    });
  };

  const handleParameterNameChange = (paramIndex: number, name: string) => {
    setDraft((prev) => {
      const next = [...prev];
      next[paramIndex] = { ...next[paramIndex], name };
      return next;
    });
  };

  const handleRemoveVariant = (paramIndex: number, variantIndex: number) => {
    setDraft((prev) => {
      const next = [...prev];
      next[paramIndex] = {
        ...next[paramIndex],
        variants: next[paramIndex].variants.filter(
          (_, i) => i !== variantIndex,
        ),
      };
      return next;
    });
    if (editingVariantByParam[paramIndex] === variantIndex) {
      setNewVariantByParam((prev) => ({ ...prev, [paramIndex]: "" }));
      setEditingVariantByParam((prev) => ({ ...prev, [paramIndex]: null }));
    } else if (
      editingVariantByParam[paramIndex] !== undefined &&
      editingVariantByParam[paramIndex] !== null &&
      editingVariantByParam[paramIndex]! > variantIndex
    ) {
      setEditingVariantByParam((prev) => ({
        ...prev,
        [paramIndex]: (prev[paramIndex] ?? 0) - 1,
      }));
    }
  };

  const handleEditVariant = (
    paramIndex: number,
    variantIndex: number,
    value: string,
  ) => {
    setNewVariantByParam((prev) => ({ ...prev, [paramIndex]: value }));
    setEditingVariantByParam((prev) => ({
      ...prev,
      [paramIndex]: variantIndex,
    }));
  };

  const handleAddVariant = (paramIndex: number) => {
    const value = newVariantByParam[paramIndex]?.trim();
    if (!value) return;

    const editingIndex = editingVariantByParam[paramIndex];

    setDraft((prev) => {
      const next = [...prev];
      const existing = next[paramIndex].variants;

      if (editingIndex !== undefined && editingIndex !== null) {
        if (existing.some((v, i) => i !== editingIndex && v === value)) {
          return next;
        }
        const updatedVariants = [...existing];
        updatedVariants[editingIndex] = value;
        next[paramIndex] = {
          ...next[paramIndex],
          variants: updatedVariants,
        };
      } else {
        if (existing.includes(value)) return next;
        next[paramIndex] = {
          ...next[paramIndex],
          variants: [...existing, value],
        };
      }

      return next;
    });
    setNewVariantByParam((prev) => ({ ...prev, [paramIndex]: "" }));
    setEditingVariantByParam((prev) => ({ ...prev, [paramIndex]: null }));
  };

  const handleConfirm = () => {
    setParameters(sanitizeParameters(draft));
    setOpen(false);
  };

  const duplicateNameIndexes = useMemo(
    () => getDuplicateParameterNameIndexes(draft),
    [draft],
  );
  const hasDuplicateNames = duplicateNameIndexes.size > 0;

  const canConfirm =
    draft.some((p) => p.name.trim() !== "" && p.variants.length > 0) &&
    !hasDuplicateNames;

  return (
    <div className="w-[min(400px,92vw)] max-h-[80vh] flex flex-col bg-white rounded-[10px] overflow-hidden shadow-lg">
      <div className="shrink-0 px-4 py-3 flex justify-between items-center border-b border-gray-9">
        <h2 className="text-[15px] font-medium text-black-1">
          {placeholders.add_detail}
        </h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="cursor-pointer p-1"
          aria-label={placeholders.cancel}
        >
          <Image src={crossIcon} className="w-3 h-3" alt="" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-4 py-3 space-y-3">
        {draft.map((parameter, paramIndex) => (
          <div
            key={paramIndex}
            className="rounded-[8px] border border-gray-9 bg-gray-12/40 p-3 space-y-2.5"
          >
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={parameter.name}
                  placeholder={placeholders.detail_name}
                  onChange={(e) =>
                    handleParameterNameChange(paramIndex, e.target.value)
                  }
                  className={`w-full min-w-0 h-[32px] px-2 text-[14px] text-black-1 bg-white rounded-[6px] border focus:outline-none ${
                    duplicateNameIndexes.has(paramIndex)
                      ? "border-red-1 focus:border-red-1"
                      : "border-gray-9 focus:border-green-1"
                  }`}
                />
                {duplicateNameIndexes.has(paramIndex) && (
                  <p className="mt-1 text-[12px] font-normal text-red-1">
                    {error_messages.detail_name_duplicate}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemoveParameter(paramIndex)}
                className="shrink-0 p-1.5 cursor-pointer rounded-[6px] hover:bg-red-50"
                aria-label={placeholders.delete}
              >
                <Image src={deleteIcon} className="w-3.5 h-3.5" alt="" />
              </button>
            </div>

            <div>
              <p className="mb-2 text-[12px] font-normal text-gray-8">
                {placeholders.detail_value}
              </p>
              <div className="flex flex-wrap gap-2 items-center">
                {parameter.variants.map((variant, variantIndex) => (
                  <ParameterValueChip
                    key={`${paramIndex}-${variantIndex}-${variant}`}
                    label={variant}
                    isEditing={
                      editingVariantByParam[paramIndex] === variantIndex
                    }
                    onClick={() =>
                      handleEditVariant(paramIndex, variantIndex, variant)
                    }
                    onRemove={() =>
                      handleRemoveVariant(paramIndex, variantIndex)
                    }
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  value={newVariantByParam[paramIndex] ?? ""}
                  placeholder={placeholders.add_information}
                  onChange={(e) => {
                    setNewVariantByParam((prev) => ({
                      ...prev,
                      [paramIndex]: e.target.value,
                    }));
                    if (!e.target.value.trim()) {
                      setEditingVariantByParam((prev) => ({
                        ...prev,
                        [paramIndex]: null,
                      }));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddVariant(paramIndex);
                    }
                  }}
                  className="min-w-0 flex-1 h-[30px] px-1 text-[14px] text-black-1 bg-transparent border-b border-gray-9 focus:outline-none focus:border-green-1 placeholder:text-gray-8"
                />
                <button
                  type="button"
                  disabled={!newVariantByParam[paramIndex]?.trim()}
                  onClick={() => handleAddVariant(paramIndex)}
                  className="shrink-0 h-[30px] px-3 rounded-[6px] border border-green-1 text-green-1 text-[13px] font-normal cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingVariantByParam[paramIndex] !== undefined &&
                  editingVariantByParam[paramIndex] !== null
                    ? placeholders.update
                    : placeholders.add_information}
                </button>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddParameter}
          className="w-full flex items-center justify-center gap-1.5 h-[36px] rounded-[6px] border border-dashed border-green-1/60 text-green-1 text-[13px] font-normal cursor-pointer hover:bg-green-4/50"
        >
          <Image src={plusIcon} className="w-3.5 h-3.5" alt="" />
          {placeholders.add_detail}
        </button>
      </div>

      <div className="shrink-0 px-4 py-3 flex justify-end gap-2 border-t border-gray-9">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-[32px] px-4 rounded-[6px] border border-green-1 text-green-1 text-[13px] font-normal cursor-pointer"
        >
          {placeholders.cancel}
        </button>
        <DoodleButton
          type="button"
          disabled={!canConfirm}
          onClick={handleConfirm}
          className="h-[32px] px-5 rounded-[6px] bg-green-1 disabled:opacity-50 text-white text-[13px] font-normal cursor-pointer"
        >
          {placeholders.confirm}
        </DoodleButton>
      </div>
    </div>
  );
}

export default ParametersModal;
