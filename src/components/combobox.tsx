"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Skeleton } from "@/components/ui/skeleton"
import { Icons } from "@/components/icons"
import { filterProductsAction } from "@/app/_actions/product"

import { DebounceCommandInput } from "./debounce-command-input"

export function Combobox() {
  const router = useRouter()
  const [isOpen, setIsOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  const { data, isFetching, isSuccess } = useQuery(
    ["filterProducts", query],
    async () => {
      const data = await filterProductsAction(query)
      return data
    },
    {
      enabled: query.length > 0,
      refetchOnWindowFocus: false,
    }
  )

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen((isOpen) => !isOpen)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleSelect = React.useCallback((callback: () => unknown) => {
    setIsOpen(false)
    callback()
  }, [])

  React.useEffect(() => {
    if (!isOpen) {
      setQuery("")
    }
  }, [isOpen])

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-9 p-0 lg:h-10 lg:w-60 lg:justify-start lg:px-3 lg:py-2"
        onClick={() => setIsOpen(true)}
      >
        <Icons.search className="h-4 w-4 lg:mr-2" aria-hidden="true" />
        <span className="hidden lg:inline-flex">Search products...</span>
        <span className="sr-only">Search products</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 lg:flex">
          <span className="text-xs">Ctrl</span>K
        </kbd>
      </Button>
      <CommandDialog align="top" open={isOpen} onOpenChange={setIsOpen}>
        <DebounceCommandInput
          placeholder="Search products..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty
            className={cn(isFetching ? "hidden" : "py-6 text-center text-sm")}
          >
            No products found.
          </CommandEmpty>
          {isFetching ? (
            <div className="space-y-1 overflow-hidden px-1 py-2">
              <Skeleton className="h-4 w-10 rounded" />
              <Skeleton className="h-8 rounded-sm" />
              <Skeleton className="h-8 rounded-sm" />
            </div>
          ) : (
            isSuccess &&
            data.map((group) => (
              <CommandGroup
                key={group.category}
                className="capitalize"
                heading={group.category}
              >
                {group.products.map((item) => (
                  <CommandItem
                    key={item.id}
                    onSelect={() =>
                      handleSelect(() => router.push(`/products/${item.id}`))
                    }
                  >
                    {item.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
