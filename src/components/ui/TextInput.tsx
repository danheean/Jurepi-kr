'use client';

import { InputHTMLAttributes, useState } from 'react';

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  maxChars?: number;
  showCounter?: boolean;
  accentColor?: string;
}

export function TextInput({
  label,
  maxChars,
  showCounter = false,
  accentColor = 'coral',
  value = '',
  onChange,
  className = '',
  ...props
}: TextInputProps) {
  const [focused, setFocused] = useState(false);
  const charCount = String(value).length;

  return (
    <div className="w-full">
      {label && <label className="text-sm font-button text-text">{label}</label>}
      <div className="relative mt-1">
        <input
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          maxLength={maxChars}
          className={`
            w-full h-11 px-3.5 py-2.5 rounded-md font-body text-text
            border border-hairline bg-surface
            transition-all duration-150
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring
            focus-visible:border-brand
            placeholder:text-text-muted
            ${className}
          `}
          {...props}
        />
        {showCounter && maxChars && (
          <div
            className={`
              absolute right-2 top-1/2 -translate-y-1/2 text-xs font-button
              ${charCount === maxChars ? 'text-semantic-danger' : 'text-text-muted'}
            `}
          >
            {charCount}/{maxChars}
          </div>
        )}
      </div>
    </div>
  );
}
