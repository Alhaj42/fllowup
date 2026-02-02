import * as React from "react"
import { cn } from "@/lib/utils"

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: "planned" | "in-progress" | "completed" | "cancelled"
  children?: React.ReactNode
}

const statusStyles: Record<StatusBadgeProps["status"], string> = {
  planned: "bg-yellow-100 text-yellow-800 border-yellow-200",
  "in-progress": "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-gray-100 text-gray-800 border-gray-200",
}

export function StatusBadge({
  status,
  children,
  className,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
        statusStyles[status],
        className
      )}
      {...props}
    >
      {children || (
        <span className="capitalize">
          {status.replace("-", " ")}
        </span>
      )}
    </span>
  )
}
