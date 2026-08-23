"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  id: string;
  name: string;
  options: Record<string, string>;
  placeholder?: string;
  defaultValue?: string;
  /** For the cases where the surrounding page reacts to the choice. */
  onValueChange?: (value: string) => void;
};

// The native <select> hands its popup to the operating system, which paints and
// positions it however it likes. This one is ours, so it follows the app's
// palette on every platform. It still posts through a hidden input, so server
// actions read it exactly like the native element they replaced.
export function FormSelect({
  id,
  name,
  options,
  placeholder = "—",
  defaultValue,
  onValueChange,
}: Props) {
  return (
    <Select
      name={name}
      // Without this the trigger falls back to printing the raw value, so the
      // closed field would read "gain_muscle" instead of the human label.
      items={options}
      defaultValue={defaultValue}
      onValueChange={(value) => onValueChange?.(String(value ?? ""))}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(options).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
