"use client";

import { useState, useMemo, useEffect } from "react";
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useJsApiLoader } from "@react-google-maps/api";
import {
  Gauge,
  ArrowRight,
  Hourglass,
  Calendar,
  Clock,
  User,
  AtSign,
  Hash,
  AlertCircle,
  Car,
  Loader2
} from "lucide-react";
import worldFlags from "./data/world-flag.json";
import usersData from "./data/users.mock.json";
import { LocationInput } from "./components/LocationInput";

const libraries: ("places")[] = ["places"];

// Create validation schema
const reservationSchema = z.object({
  serviceType: z.enum(["one_way", "hourly"]),
  pickupDate: z.string().min(1, "Pickup date is required"),
  pickupTime: z.string().min(1, "Pickup time is required"),
  pickupLocation: z.string().min(1, "Pickup location is required"),
  dropoffLocation: z.string().min(1, "Dropoff location is required"),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
  passengers: z.number().min(1, "At least 1 passenger is required"),
});

type ReservationFormValues = z.infer<typeof reservationSchema>;

export default function Home() {
  const [distanceInfo, setDistanceInfo] = useState<{ distance: string, duration: string } | null>(null);
  const [pickupCoords, setPickupCoords] = useState<google.maps.LatLngLiteral | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<google.maps.LatLngLiteral | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pickupMode, setPickupMode] = useState<"location" | "airport">("location");
  const [dropoffMode, setDropoffMode] = useState<"location" | "airport">("location");

  // Initialize React Hook Form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isValid }
  } = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationSchema),
    mode: "onChange",
    defaultValues: {
      serviceType: "one_way",
      pickupDate: "05/13/2023",
      pickupTime: "3:00 PM",
      pickupLocation: "Clintons Bar & Grille, High Street, Clinton, MA, USA",
      dropoffLocation: "Logan Airport Terminal B, Boston, MA, USA",
      phoneNumber: "+1 774 415 3244",
      passengers: 1
    }
  });

  const watchPhone = watch("phoneNumber");
  const watchServiceType = watch("serviceType");
  const watchFirstName = watch("firstName");
  const watchLastName = watch("lastName");
  const watchEmail = watch("email");

  // Load Google Maps script
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

  // Calculate Distance & Time Effect
  useEffect(() => {
    if (!isLoaded || !pickupCoords || !dropoffCoords) return;

    const service = new window.google.maps.DistanceMatrixService();
    service.getDistanceMatrix({
      origins: [pickupCoords],
      destinations: [dropoffCoords],
      travelMode: window.google.maps.TravelMode.DRIVING,
    }, (response, status) => {
      if (status === 'OK' && response && response.rows[0].elements[0].status === 'OK') {
        const result = response.rows[0].elements[0];
        setDistanceInfo({
          distance: result.distance.text,
          duration: result.duration.text
        });
      }
    });
  }, [pickupCoords, dropoffCoords, isLoaded]);

  // Phone processing logic
  const parsedNumber = useMemo(() => parsePhoneNumberFromString(watchPhone || ''), [watchPhone]);
  const countryCode = parsedNumber ? (parsedNumber.country?.toLowerCase() || "us") : "us";
  const currentFlag = (worldFlags as { flag: string, country: string, code: string }[]).find(f => f.code === countryCode)?.flag;

  // Check against mock database
  const recognizedUser = useMemo(() => {
    if (!parsedNumber) return null;
    const formattedPhone = parsedNumber.formatInternational();
    return usersData.find(u => u.phone === formattedPhone) || null;
  }, [parsedNumber]);

  const onSubmit = async (data: ReservationFormValues) => {
    // Inject Mock User details into data if found so we don't submit empty fields
    if (recognizedUser) {
      data.firstName = recognizedUser.firstName;
      data.lastName = recognizedUser.lastName;
      data.email = recognizedUser.email;
    } else {
      // Validate the conditionally required fields here since Zod SuperRefine is complex with external state
      if (!data.firstName || !data.lastName || !data.email) {
        alert("Please provide the required contact information details.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, distanceInfo })
      });
      const resData = await response.json();
      if (resData.success) {
        alert("Reservation submitted successfully!");
      } else {
        alert("Failed to create reservation");
      }
    } catch (e) {
      console.error(e);
      alert("Network error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 flex justify-center">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-sm p-8">

        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Gauge className="w-8 h-8 text-logo-blue" />
          <h1 className="text-2xl font-bold text-logo-blue tracking-tight">ExampleIQ</h1>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-light text-gray-800 mb-8">
          Let's get you on your way!
        </h2>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Service Type Toggle */}
          <div className="flex w-full mb-8">
            <button
              type="button"
              onClick={() => setValue("serviceType", "one_way")}
              className={`flex-1 flex items-center justify-center gap-2 border py-3 rounded-l-md font-medium transition-colors ${watchServiceType === 'one_way' ? 'border-gold-500 text-gold-500 bg-white' : 'border-gray-200 text-gray-500 bg-gray-50 hover:bg-gray-100'}`}
            >
              {watchServiceType === 'one_way' && (
                <div className="bg-gold-500 rounded-full w-4 h-4 flex items-center justify-center">
                  <ArrowRight className="w-3 h-3 text-white" />
                </div>
              )}
              One-way
            </button>
            <button
              type="button"
              onClick={() => setValue("serviceType", "hourly")}
              className={`flex-1 flex items-center justify-center gap-2 border border-l-0 py-3 rounded-r-md font-medium transition-colors ${watchServiceType === 'hourly' ? 'border-gold-500 text-gold-500 bg-white' : 'border-gray-200 text-gray-500 bg-gray-50 hover:bg-gray-100'}`}
            >
              <Hourglass className={`w-5 h-5 ${watchServiceType === 'hourly' ? 'text-gold-500' : 'text-gray-400'}`} />
              Hourly
            </button>
          </div>

          {/* Pickup Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Pickup</h3>

            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <div className={`relative border rounded-md p-3 flex items-center gap-3 ${errors.pickupDate ? 'border-red-500' : 'border-gray-300'}`}>
                  <Calendar className="w-4 h-4 text-gold-500" />
                  <input
                    type="text"
                    {...register("pickupDate")}
                    className="w-full text-sm outline-none text-gray-700 bg-transparent"
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className={`relative border rounded-md p-3 flex items-center gap-3 ${errors.pickupTime ? 'border-red-500' : 'border-gray-300'}`}>
                  <Clock className="w-4 h-4 text-gold-500" />
                  <input
                    type="text"
                    {...register("pickupTime")}
                    className="w-full text-sm outline-none text-gray-700 bg-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Location/Airport Toggle */}
            <div className="inline-flex mb-3">
              <button
                type="button"
                onClick={() => setPickupMode("location")}
                className={`border px-4 py-1.5 text-sm rounded-l-md font-medium transition-colors ${pickupMode === 'location' ? 'border-gold-500 text-gold-500' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
              >
                Location
              </button>
              <button
                type="button"
                onClick={() => setPickupMode("airport")}
                className={`border px-4 py-1.5 text-sm rounded-r-md transition-colors ${pickupMode === 'airport' ? 'border-gold-500 text-gold-500 font-medium' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
              >
                Airport
              </button>
            </div>

            {/* Location Dropdown */}
            {isLoaded ? (
              <Controller
                name="pickupLocation"
                control={control}
                render={({ field }) => (
                  <LocationInput
                    label={pickupMode === 'location' ? 'Location' : 'Airport'}
                    mode={pickupMode}
                    defaultValue={field.value}
                    className={errors.pickupLocation ? 'border-red-500' : ''}
                    onPlaceSelected={(place) => {
                      field.onChange(place.formatted_address || place.name);
                      if (place.geometry?.location) {
                        setPickupCoords({
                          lat: place.geometry.location.lat(),
                          lng: place.geometry.location.lng()
                        });
                      }
                    }}
                  />
                )}
              />
            ) : <div className="h-12 bg-gray-100 animate-pulse rounded-md mt-2"></div>}
            {errors.pickupLocation && <span className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.pickupLocation.message}</span>}

            <button type="button" className="mt-3 text-sm text-gold-500 font-medium hover:text-gold-600 transition-colors">
              + Add a stop
            </button>
          </div>

          {/* Drop off Section */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Drop off</h3>

            {/* Location/Airport Toggle */}
            <div className="inline-flex mb-3">
              <button
                type="button"
                onClick={() => setDropoffMode("location")}
                className={`border px-4 py-1.5 text-sm rounded-l-md font-medium transition-colors ${dropoffMode === 'location' ? 'border-gold-500 text-gold-500' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
              >
                Location
              </button>
              <button
                type="button"
                onClick={() => setDropoffMode("airport")}
                className={`border px-4 py-1.5 text-sm rounded-r-md transition-colors ${dropoffMode === 'airport' ? 'border-gold-500 text-gold-500 font-medium' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
              >
                Airport
              </button>
            </div>

            {/* Location Dropdown */}
            {isLoaded ? (
              <Controller
                name="dropoffLocation"
                control={control}
                render={({ field }) => (
                  <LocationInput
                    label={dropoffMode === 'location' ? 'Location' : 'Airport'}
                    mode={dropoffMode}
                    defaultValue={field.value}
                    className={errors.dropoffLocation ? 'border-red-500' : ''}
                    onPlaceSelected={(place) => {
                      field.onChange(place.formatted_address || place.name);
                      if (place.geometry?.location) {
                        setDropoffCoords({
                          lat: place.geometry.location.lat(),
                          lng: place.geometry.location.lng()
                        });
                      }
                    }}
                  />
                )}
              />
            ) : <div className="h-12 bg-gray-100 animate-pulse rounded-md mt-2"></div>}
            {errors.dropoffLocation && <span className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.dropoffLocation.message}</span>}
          </div>

          {/* Distance Estimate */}
          {distanceInfo && (
            <div className="mb-8 p-4 bg-blue-50/50 rounded-lg flex items-center gap-3 border border-blue-100/50">
              <div className="bg-blue-100 p-2 rounded-full text-logo-blue">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Estimated Trip</p>
                <p className="text-xs text-gray-500">{distanceInfo.distance} • ~{distanceInfo.duration}</p>
              </div>
            </div>
          )}
          {!distanceInfo && <div className="mb-8" />}


          {/* Contact Information Section */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h3>

            {/* Phone Input */}
            <div className={`relative border rounded-md p-3 flex items-center gap-3 mb-4 ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`}>
              {currentFlag ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentFlag} alt={`${countryCode} flag`} className="w-6 h-4 object-cover rounded-sm shadow-sm" />
              ) : (
                <span className="text-xl leading-none">🇺🇸</span>
              )}
              <input
                type="text"
                {...register("phoneNumber")}
                className="w-full text-sm outline-none text-gray-700 bg-transparent tracking-wide"
              />
            </div>
            {errors.phoneNumber && <p className="text-xs text-red-500 -mt-2 mb-3 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.phoneNumber.message}</p>}

            {/* Conditional Contact Info Rendering */}
            {recognizedUser ? (
              <div className="text-sm p-4 bg-green-50 text-green-800 rounded-md border border-green-100">
                <span className="font-semibold">Welcome back, {recognizedUser.firstName}!</span> We have your contact information on file.
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  We don't have that phone number on file. Please provide additional contact information.
                </p>

                <div className="flex gap-4 mb-4">
                  {/* First Name */}
                  <div className="flex-1 relative border border-gray-300 rounded-md p-3 mt-2 flex items-center gap-3">
                    <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs text-gray-400">
                      First name <span className="text-red-500">*</span>
                    </label>
                    <User className="w-4 h-4 text-gold-500" />
                    <input
                      type="text"
                      {...register("firstName")}
                      placeholder="First name"
                      className="w-full text-sm outline-none text-gray-700 bg-transparent placeholder-gray-300"
                    />
                  </div>
                  {/* Last Name */}
                  <div className="flex-1 relative border border-gray-300 rounded-md p-3 mt-2 flex items-center gap-3">
                    <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs text-gray-400">
                      Last name <span className="text-red-500">*</span>
                    </label>
                    <User className="w-4 h-4 text-gold-500" />
                    <input
                      type="text"
                      {...register("lastName")}
                      placeholder="Last name"
                      className="w-full text-sm outline-none text-gray-700 bg-transparent placeholder-gray-300"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="relative border border-gray-300 rounded-md p-3 mt-2 flex items-center gap-3">
                  <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs text-gray-400">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <AtSign className="w-4 h-4 text-gold-500" />
                  <input
                    type="email"
                    {...register("email")}
                    placeholder="name@example.com"
                    className="w-full text-sm outline-none text-gray-700 bg-transparent placeholder-gray-300"
                  />
                </div>
              </>
            )}

          </div>

          {/* Passengers Section */}
          <div className="mb-10">
            <p className="text-sm text-gray-600 mb-4">
              How many passengers are expected for the trip?
            </p>
            <div className={`relative border rounded-md p-3 mt-2 w-1/3 flex items-center gap-3 ${errors.passengers ? 'border-red-500' : 'border-gray-300'}`}>
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs text-gray-400">
                # Passengers
              </label>
              <Hash className="w-4 h-4 text-gold-500" />
              <input
                type="number"
                {...register("passengers", { valueAsNumber: true })}
                className="w-full text-sm outline-none text-gray-700 bg-transparent"
              />
            </div>
            {errors.passengers && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.passengers.message}</p>}
          </div>

          {/* Continue Button */}
          <button
            type="submit"
            disabled={isSubmitting || !isValid || (!recognizedUser && (!watchFirstName || !watchLastName || !watchEmail))}
            className="w-full bg-gold-500 text-white font-medium py-4 rounded-md hover:bg-gold-600 transition-colors flex justify-center items-center gap-2 disabled:bg-gold-400"
          >
            {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
            Continue
          </button>
        </form>

      </div>
    </div>
  );
}