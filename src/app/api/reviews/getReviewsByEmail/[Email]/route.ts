import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(
    req: NextRequest, props: { params: Promise<{ Email: string }> }
) {
    const params = await props.params;
    console.log(`GET /api/forms/reviews/getReviewsByEmail/${params.Email}`);
    const email = params.Email;
    if (!email) {
        return new NextResponse("Email is required", { status: 400 });
    }

    try {
        const apiUrl = `${process.env.API_GATEWAY_URL_PROD}/reviews/getReviewsByEmail?Email=${email}`;
        const { data } = await axios.get(apiUrl);
        return new NextResponse(JSON.stringify(data), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        const status = error.response?.status || 500;
        const message = status === 500 ? "Internal Server Error" : error.response?.data?.message || "An error occurred";
        return new NextResponse(message, { status });
    }
}
