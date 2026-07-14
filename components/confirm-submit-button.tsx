"use client";

export function ConfirmSubmitButton({ children, confirmation, className }: { children: React.ReactNode; confirmation: string; className?: string }) {
  return (
    <button
      className={className}
      onClick={(event) => {
        if (!window.confirm(confirmation)) event.preventDefault();
      }}
      type="submit"
    >
      {children}
    </button>
  );
}
