import { ICON_MAP } from '@/constants/icons';

interface IconProps {
  name: keyof typeof ICON_MAP;
  className?: string;
}

export function Icon({ name, className = '' }: IconProps) {
  return (
    <span className={`icon ${className}`}>
      {ICON_MAP[name]}
    </span>
  );
} 