"use client";

type ParameterValueChipProps = {
  label: string;
  onRemove?: () => void;
  onClick?: () => void;
  isEditing?: boolean;
};

function ParameterValueChip({
  label,
  onRemove,
  onClick,
  isEditing = false,
}: ParameterValueChipProps) {
  return (
    <span
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`inline-flex items-center gap-2 rounded-[4px] px-2.5 py-1.5 text-[14px] font-normal text-black-1 leading-none ${
        isEditing
          ? "bg-white border border-green-1 cursor-pointer"
          : "bg-[#F2F2F2] cursor-pointer"
      }`}
    >
      <span>{label}</span>
      {onRemove ? (
        <button
          type="button"
          aria-label="Remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="cursor-pointer text-[16px] leading-none text-black-1/60 hover:text-black-1"
        >
          ×
        </button>
      ) : null}
    </span>
  );
}

export default ParameterValueChip;
