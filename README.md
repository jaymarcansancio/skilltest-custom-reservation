# Custom Reservation Form

A robust, pixel-perfect reservation form built with **Next.js**, **React Hook Form**, **Zod**, and **Tailwind CSS**. It features intelligent location autocomplete (Google Maps & Photon API), dynamic distance and travel time calculation, and smart phone-number recognition.

## Features

- **Pixel-Perfect UI**: Built with Tailwind CSS and custom design tokens (Gold/Blue themes) to match premium interfaces.
- **Smart Location Autocomplete**:
  - **Location Mode**: Directly integrated with the Google Maps Places API for accurate street/business addresses.
  - **Airport Mode**: Utilizes the open-source **Photon API (OpenStreetMap)** to search for global aerodromes.
- **Dynamic Trip Estimation**: Automatically measures the exact trip distance and travel time (via Transit/Flight mode representations) between Pickup and Drop-off locations using the Google Maps Distance Matrix service.
- **Intelligent Phone Number Lookup**:
  - Validates international formats using `libphonenumber-js`.
  - Automatically displays the correct country flag for the input number dynamically.
  - Looks up the phone number in a mock database (`src/app/data/users.json`). If recognized, it welcomes the user and hides unnecessary contact info. If unrecognized, it prompts for First Name, Last Name, and Email.
- **Bulletproof Validation**: Client-side validation powered by **Zod** and **React Hook Form** ensures form integrity before the submit button is even enabled.
- **Mock API Endpoint**: Simulates a backend reservation submission with loading states and structured payloads.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS & Lucide Icons
- **Form Handling**: React Hook Form
- **Validation**: Zod
- **External Apis**: Google Maps API (Places, Distance Matrix), Photon API (OSM)
- **Utilities**: `libphonenumber-js`

## Getting Started

### 1. Clone the Repository
Ensure you are in the project root:
```bash
git clone <your-repo-link>
cd "Custom Reservation - Skill Test"
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Setup Environment Variables
You will need a valid Google Maps API Key to use the Places autocomplete and distance calculations.
Create a local `.env.local` file in the root of your project:
```bash
touch .env.local
```
Add your variable:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your_api_key_here"
```
*(Make sure this Maps API Key has the **Places API** and **Distance Matrix API** services enabled in Google Cloud).*

### 4. Run the Development Server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) (or the port specified in your terminal, e.g., 3001) in your browser to see the result.

## Usage Guide
1. Select whether you want a **One-way** or **Hourly** service.
2. Fill your local time and date.
3. Use the Location inputs to set your Pickup and Drop-off. Try toggling between the **Location** and **Airport** modes!
4. Check out the generated Estimated Trip banner.
5. In the Phone Number box, test with `+1 774 415 3244` to see a recognized user, or enter your own custom number to see the dynamic contact form.
6. Submit the form to view the completed payload!
