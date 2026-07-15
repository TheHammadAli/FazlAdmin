import React from "react";

function Input(params: {
  placeholder?: string | undefined;
  className?: string | undefined;
  type?: string | undefined;
  value?: string | undefined;
  onChange?: ((e: React.ChangeEvent<HTMLInputElement>) => void) | undefined;
}) {
  return <input {...params} />;
}

export default Input;
