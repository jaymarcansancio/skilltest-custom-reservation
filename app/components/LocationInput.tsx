"use client";

import { usePlacesWidget } from "react-google-autocomplete";
import { MapPin, ChevronDown, Plane, Loader2 } from "lucide-react";
import { forwardRef, useState, useEffect, useRef } from "react";

interface LocationInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'defaultValue'> {
    label: string;
    mode?: "location" | "airport";
    defaultValue?: string;
    onPlaceSelected: (place: any) => void;
}

const GoogleLocationInput = ({ label, onPlaceSelected, defaultValue, placeholder, className, inputRef, ...rest }: any) => {
    const { ref: placesRef } = usePlacesWidget<HTMLInputElement>({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        onPlaceSelected: onPlaceSelected,
        options: {
            types: ["geocode", "establishment"],
        },
    });

    return (
        <div className={`relative border border-gray-300 rounded-md p-3 mt-2 flex items-center gap-3 focus-within:border-gold-500 focus-within:ring-1 focus-within:ring-gold-500 transition-colors ${className}`}>
            <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs text-gray-400">
                {label}
            </label>
            <MapPin className="w-4 h-4 text-gold-500 flex-shrink-0" />
            <input
                ref={(e) => {
                    if (e) placesRef.current = e;
                    if (typeof inputRef === 'function') inputRef(e);
                    else if (inputRef) inputRef.current = e;
                }}
                type="text"
                defaultValue={defaultValue}
                placeholder={placeholder}
                className="w-full text-sm outline-none text-gray-700 bg-transparent overflow-ellipsis"
                {...rest}
            />
            <ChevronDown className="w-4 h-4 text-gray-400 ml-auto flex-shrink-0" />
        </div>
    );
};

const AirportApiInput = ({ label, onPlaceSelected, defaultValue, placeholder, className, inputRef, ...rest }: any) => {
    const [query, setQuery] = useState(defaultValue || "");
    const [results, setResults] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchAirports = async (search: string) => {
        if (!search || search.length < 2) {
            setResults([]);
            setIsOpen(false);
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(search)}&osm_tag=aeroway:aerodrome&limit=5`);
            const data = await res.json();
            setResults(data.features || []);
            setIsOpen(true);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query !== defaultValue) {
                fetchAirports(query);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [query, defaultValue]);

    const handleSelect = (feature: any) => {
        const props = feature.properties;
        const addressParts = [props.name, props.city, props.state, props.country].filter(Boolean);
        const fullAddress = addressParts.join(", ");

        setQuery(fullAddress);
        setIsOpen(false);

        // Mock the structure expected by Google Maps to reuse the same distance calculator
        onPlaceSelected({
            formatted_address: fullAddress,
            name: props.name,
            geometry: {
                location: {
                    lat: () => feature.geometry.coordinates[1],
                    lng: () => feature.geometry.coordinates[0],
                }
            }
        });
    };

    return (
        <div ref={wrapperRef} className={`relative border border-gray-300 rounded-md p-3 mt-2 flex items-center gap-3 focus-within:border-gold-500 focus-within:ring-1 focus-within:ring-gold-500 transition-colors ${className}`}>
            <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs text-gray-400">
                {label}
            </label>
            <Plane className="w-4 h-4 text-gold-500 flex-shrink-0" />
            <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => { if (results.length > 0) setIsOpen(true); }}
                placeholder={placeholder}
                className="w-full text-sm outline-none text-gray-700 bg-transparent overflow-ellipsis"
                {...rest}
            />
            {isLoading ? (
                <Loader2 className="w-4 h-4 text-gray-400 ml-auto flex-shrink-0 animate-spin" />
            ) : (
                <ChevronDown className="w-4 h-4 text-gray-400 ml-auto flex-shrink-0" />
            )}

            {/* Dropdown Menu */}
            {isOpen && results.length > 0 && (
                <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto w-full text-left">
                    {results.map((feature, i) => {
                        const props = feature.properties;
                        const mainText = props.name;
                        const subText = [props.city, props.state, props.country].filter(Boolean).join(", ");

                        return (
                            <li
                                key={i}
                                onClick={() => handleSelect(feature)}
                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 flex flex-col gap-0.5"
                            >
                                <span className="text-sm font-medium text-gray-900">{mainText}</span>
                                {subText && <span className="text-xs text-gray-500">{subText}</span>}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export const LocationInput = forwardRef<HTMLInputElement, LocationInputProps>(
    ({ label, onPlaceSelected, defaultValue, placeholder, className, mode = "location", ...rest }, ref) => {
        if (mode === "location") {
            return <GoogleLocationInput label={label} onPlaceSelected={onPlaceSelected} defaultValue={defaultValue} placeholder={placeholder} className={className} inputRef={ref} {...rest} />
        }
        return <AirportApiInput label={label} onPlaceSelected={onPlaceSelected} defaultValue={defaultValue} placeholder={placeholder} className={className} inputRef={ref} {...rest} />
    }
);

LocationInput.displayName = "LocationInput";
