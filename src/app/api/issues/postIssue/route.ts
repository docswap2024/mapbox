import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(
  req: NextRequest
) {
  console.log(`POST /api/forms/issues/postIssue`);
  const body = await req.json();

  try {
    const apiUrl = `${process.env.API_GATEWAY_URL_PROD}/issues/postIssue`;
    const { data } = await axios.post(apiUrl,
        body,
        {
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );
    return new NextResponse(data, {
      status: 200,
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = status === 500 ? "Internal Server Error" : error.response?.data?.message || "An error occurred";
    return new NextResponse(message, { status });
  }
}
