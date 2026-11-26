// client/src/components/VisibilityPicker.tsx
// Chọn chế độ hiển thị: Công khai / Chỉ người theo dõi.

import type { Visibility } from '../types';
import { Globe, Users, type LucideIcon } from 'lucide-react';

export interface VisibilityPickerProps {
  value: Visibility;
  onChange: (v: Visibility) => void;
  error?: string;
}

const OPTIONS: { value: Visibility; label: string; icon: LucideIcon; hint: string }[] = [
  { value: 'public', label: 'Công khai', icon: Globe, hint: 'Mọi người đều xem được' },
  { value: 'followers', label: 'Chỉ người theo dõi', icon: Users, hint: 'Chỉ người theo dõi bạn xem được' },
];

export function VisibilityPicker({ value, onChange, error }: VisibilityPickerProps) {
  return (
    <div className="visibility-picker">
      <div className="visibility-picker-options">
        {OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={`visibility-option ${value === opt.value ? 'active' : ''}`}
          >
            <input
              type="radio"
              name="visibility"
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
            />
            <opt.icon className="visibility-icon" size={18} aria-hidden />
            <span className="visibility-label">{opt.label}</span>
            <span className="visibility-hint">{opt.hint}</span>
          </label>
        ))}
      </div>
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}
