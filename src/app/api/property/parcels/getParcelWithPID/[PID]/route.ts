import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest, props: { params: Promise<{ PID: string }> }) {
  const params = await props.params;

  const pid = params.PID;
  console.log(`GET /api/property/parcels/getParcelWithPID/${pid}`);
  if (!pid) {
    return new NextResponse("PID is required", { status: 400 });
  }

  try {
    const apiUrl = `${process.env.API_GATEWAY_URL_PROD}/parcels/getParcel?PID=${pid}`;
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
