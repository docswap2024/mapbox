import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest, props: { params: Promise<{ url: string }> }) {
    const params = await props.params;
    console.log(`GET /api/imageUrl/${params.url}`);
    const url = params.url;
    if (!url) {
        return new NextResponse("URL is required", { status: 400 });
    }

    try {
        const apiUrl = `${process.env.API_GATEWAY_URL_PROD}/imageUrl/getImageUrl?URL=${url}`;
        const { data } = await axios.get(apiUrl);
        return new NextResponse(data, {
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
