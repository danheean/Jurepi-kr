'use client';

import { ReactNode } from 'react';

type BadgeVariant = 'new' | 'popular' | 'soon';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  new: 'bg-accent-mint-soft text-accent-mint',
  popular: 'bg-accent-sun-soft text-semantic-warning',
  soon: 'bg-surface-muted text-text-muted',
};

export function Badge({ children, variant = 'new' }: BadgeProps) {
  return (
    <span
      className={`
        inline-block px-2 py-1 rounded-full font-eyebrow
        ${variantClasses[variant]}
      `}
    >
      {children}
    </span>
  );
}
