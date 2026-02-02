import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  icon?: React.ReactNode
  children?: React.ReactNode
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <div className="mb-4 text-6xl font-semibold text-muted-foreground">
        {title}
      </div>
      <p className="mb-6 text-muted-foreground max-w-md">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick} variant="default" size="lg">
          {action.label}
        </Button>
      )}
      {children}
    </div>
  )
}
