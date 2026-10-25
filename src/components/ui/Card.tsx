import type { HTMLAttributes, ReactNode } from "react";

type CardProps = {
  title?: string;
  children: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

function Card({ title, children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`
        rounded-card border border-border
        bg-surface p-6 shadow-sm
        ${className}
      `}
      {...props}
    >
      {title && <h3 className="mb-4 text-lg font-semibold">{title}</h3>}

      {children}
    </div>
  );
}

export default Card;
