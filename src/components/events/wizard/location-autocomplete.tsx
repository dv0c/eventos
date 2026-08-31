"use client";

import { Loader2, MapPin, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PlaceResult {
  placeId: string;
  displayName: string;
  name: string;
  address: string;
}

interface LocationAutocompleteProps {
  locationValue: string;
  addressValue: string;
  onLocationChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  locationPlaceholder?: string;
  addressPlaceholder?: string;
  addressLabel?: string;
  noResultsText?: string;
  searchingText?: string;
}

export function LocationAutocomplete({
  locationValue,
  addressValue,
  onLocationChange,
  onAddressChange,
  locationPlaceholder = "Search for a venue or address",
  addressPlaceholder = "Full address",
  addressLabel = "Address",
  noResultsText = "No places found. You can enter the address manually.",
  searchingText = "Searching...",
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(locationValue);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(locationValue);
  }, [locationValue]);

  const searchPlaces = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 3) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(
        `/api/places/search?q=${encodeURIComponent(searchQuery)}&limit=5`,
      );
      const json = (await response.json()) as {
        data?: PlaceResult[];
        error?: { message?: string };
      };

      if (!response.ok) {
        setResults([]);
        return;
      }

      setResults(json.data ?? []);
      setIsOpen(true);
      setActiveIndex(-1);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    onLocationChange(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      void searchPlaces(value);
    }, 300);
  }

  function selectPlace(place: PlaceResult) {
    setQuery(place.name);
    onLocationChange(place.name);
    onAddressChange(place.address);
    setResults([]);
    setIsOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || results.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectPlace(results[activeIndex]);
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div className="space-y-4">
      <div ref={containerRef} className="relative">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => {
              if (results.length > 0) {
                setIsOpen(true);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={locationPlaceholder}
            className="h-12 pl-10 text-base"
            autoComplete="off"
            role="combobox"
            aria-expanded={isOpen}
            aria-autocomplete="list"
          />
          {isSearching ? (
            <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : null}
        </div>

        {isOpen && (results.length > 0 || (query.length >= 3 && !isSearching)) ? (
          <ul
            className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-border/60 bg-background py-1 shadow-lg"
            role="listbox"
          >
            {results.length === 0 ? (
              <li className="px-4 py-3 text-sm text-muted-foreground">
                {noResultsText}
              </li>
            ) : (
              results.map((place, index) => (
                <li key={place.placeId} role="option" aria-selected={index === activeIndex}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-secondary/50",
                      index === activeIndex && "bg-secondary/50",
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectPlace(place);
                    }}
                  >
                    <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>
                      <span className="block font-medium">{place.name}</span>
                      <span className="block text-muted-foreground">
                        {place.displayName}
                      </span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="wizard-address" className="text-sm font-medium">
          {addressLabel}
        </label>
        <Input
          id="wizard-address"
          value={addressValue}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder={addressPlaceholder}
          className="h-12 text-base"
        />
      </div>
    </div>
  );
}
