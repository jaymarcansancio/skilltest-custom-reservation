import { NextResponse } from "next/server";
import { success } from "zod";

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // Simulate API processing delay for 2 seconds
        await new Promise( resolve => setTimeout(resolve, 2000) );

        // Mock distance and travel time estimation based on the provided locations
        data.traveltimeEstimation = data.distanceInfo?.duration || "Not calculated";

        // Logging the mock API response for debugging purposes
        console.log("Reservation Received:", data);

        return NextResponse.json({
            success: true,
            message: "Reservation successfully submitted",
            receivedData: data
        });
    } catch (error) {
        console.error("Error in POST request:", error);
        return NextResponse.json({
            success: false,
            message: "Failed to submit reservation",
            error: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
