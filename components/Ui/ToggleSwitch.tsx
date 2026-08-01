"use client";

type ToggleSwitchProps = {
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
    ariaLabel?: string;
};

function ToggleSwitch({ checked, onChange, disabled, ariaLabel }: ToggleSwitchProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={ariaLabel}
            disabled={disabled}
            onClick={onChange}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${checked ? "bg-green-1" : "bg-gray-7"
                }`}
        >
            <span
                className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[22px]" : "translate-x-[3px]"
                    }`}
            />
        </button>
    );
}

export default ToggleSwitch;
