import * as React from "react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
  text?: string
}

const sizeClasses: Record<NonNullable<LoadingSpinnerProps["size"]>, string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
}

export function LoadingSpinner({ size = "md", text, className, ...props }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center",
        sizeClasses[size],
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="animate-spin rounded-full border-4 border-t-foreground h-8 w-8 border-4 border-t-primary/20" />
      {text && (
        <p className="mt-4 text-sm text-muted-foreground">
          {text}
        </p>
      )}
    </div>
  )
}
