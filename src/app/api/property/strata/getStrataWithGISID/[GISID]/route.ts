import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest, props: { params: Promise<{ GISID: string }> }) {
  const params = await props.params;
  console.log(`GET /api/property/strata/getStrataWithGISID/${params.GISID}`);
  const gisid = params.GISID;
  if (!gisid) {
    return new NextResponse("GISID is required", { status: 400 });
  }

  try {
    const apiUrl = `${process.env.API_GATEWAY_URL_PROD}/strata/getStrataWithGISID?GISID=${gisid}`;
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
