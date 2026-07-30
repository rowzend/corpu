'use client';

import { ReactNode } from 'react';
import { useThemeColors } from '@/lib/hooks/useThemeColors';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  footer?: ReactNode;
}

export default function Card({ children, className = '', title, footer }: CardProps) {
  const { card, text } = useThemeColors();

  return (
    <div className={`${card.bgClass} ${card.borderClass} border rounded-lg shadow-md overflow-hidden ${className}`}>
      {title && (
        <div className={`px-6 py-4 border-b ${card.borderClass}`}>
          <h3 className={`text-lg font-semibold ${text.primaryClass}`}>{title}</h3>
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
      {footer && (
        <div className={`px-6 py-4 ${card.hoverClass} border-t ${card.borderClass}`}>
          {footer}
        </div>
      )}
    </div>
  );
}
