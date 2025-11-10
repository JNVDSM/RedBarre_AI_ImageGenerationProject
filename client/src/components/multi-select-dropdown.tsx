"use client"

import * as React from "react"
import { ChevronDown, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface MultiSelectDropdownProps {
  label: string
  options: string[]
  selected: Set<string>
  onSelectionChange: (selected: Set<string>) => void
  className?: string
}

export function MultiSelectDropdown({
  label,
  options,
  selected,
  onSelectionChange,
  className,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = React.useState(false)

  const placeholderText = React.useMemo(() => {
    if (label === "Product Collections") {
      return "Select product collection..."
    }

    if (label === "Material & Weight") {
      return "Select material & weight..."
    }

    return `Select ${label.toLowerCase()}...`
  }, [label])

  const handleToggle = (option: string) => {
    const newSelected = new Set(selected)
    if (newSelected.has(option)) {
      newSelected.delete(option)
    } else {
      newSelected.add(option)
    }
    onSelectionChange(newSelected)
  }

  const selectedCount = selected.size

  return (
    <div className={cn("flex-1", className)}>
      <h2 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">
        {label}
      </h2>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "multi-select-trigger w-full justify-between bg-[#1a1a1a] text-gray-300 border-[#2a2a2a] hover:border-[#99C542] hover:bg-[#1a1a1a] overflow-hidden",
              selectedCount > 0 && "border-[#99C542] text-white"
            )}
            style={{ 
              height: '2.25rem', 
              maxHeight: '2.25rem', 
              minHeight: '2.25rem',
              lineHeight: '2.25rem',
              padding: '0 0.5rem',
              display: 'flex',
              alignItems: 'center',
              boxSizing: 'border-box',
              flexShrink: 0
            } as React.CSSProperties}
          >
            <div 
              className="flex flex-nowrap gap-1.5 items-center flex-1 text-left overflow-x-auto overflow-y-hidden min-w-0 pr-2 scrollbar-hide"
              style={{ 
                maxHeight: '2.25rem',
                height: '2.25rem',
                minHeight: '2.25rem',
                alignItems: 'center',
                flexShrink: 1,
                overflowX: 'auto',
                overflowY: 'hidden'
              }}
              onMouseDown={(e) => {
                // Prevent dropdown from opening when clicking on tags area
                if (selectedCount > 0 && (e.target as HTMLElement).closest('span[class*="bg-[#2a2a2a]"]')) {
                  e.preventDefault()
                  e.stopPropagation()
                }
              }}
              onClick={(e) => {
                // Only allow opening dropdown when clicking on empty space, not on tags
                if (selectedCount > 0 && (e.target as HTMLElement).closest('span[class*="bg-[#2a2a2a]"]')) {
                  e.preventDefault()
                  e.stopPropagation()
                }
              }}
            >
              {selectedCount === 0 ? (
                <span className="text-gray-400 whitespace-nowrap text-xs tracking-wide">
                  {placeholderText}
                </span>
              ) : (
                Array.from(selected).map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1 bg-[#2a2a2a] text-white text-xs px-2 rounded-md border border-[#3a3a3a] shrink-0 whitespace-nowrap"
                    style={{ 
                      height: '1.5rem',
                      maxHeight: '1.5rem',
                      lineHeight: '1.5rem'
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                  >
                    <span>{item}</span>
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-red-400 shrink-0"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleToggle(item)
                        setOpen(false) // Explicitly close the dropdown
                      }}
                    />
                  </span>
                ))
              )}
            </div>
            <div
              className="ml-2 h-4 w-4 shrink-0 flex items-center justify-center cursor-pointer"
              onClick={() => {
                // Allow opening dropdown when clicking on chevron area
                if (!open) {
                  setOpen(true)
                }
              }}
            >
              <ChevronDown className="h-4 w-4 opacity-50" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="min-w-[var(--radix-dropdown-menu-trigger-width)] bg-[#1a1a1a] border-[#2a2a2a] text-white max-h-[300px] overflow-y-auto p-1"
          align="start"
        >
          {options.map((option) => (
            <div
              key={option}
              onClick={() => handleToggle(option)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-sm cursor-pointer text-sm transition-colors",
                "hover:bg-[#2a2a2a] text-gray-300 hover:text-white",
                selected.has(option) && "bg-[#2a2a2a] text-white"
              )}
            >
              <Checkbox
                checked={selected.has(option)}
                onCheckedChange={() => handleToggle(option)}
                onClick={(e) => e.stopPropagation()}
                className="border-gray-500 data-[state=checked]:bg-[#99C542] data-[state=checked]:border-lime-400"
              />
              <span className="flex-1">{option}</span>
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

