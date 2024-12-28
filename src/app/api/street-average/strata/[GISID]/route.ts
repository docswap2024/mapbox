import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { formatCurrency } from "@/utils";

export async function GET(req: NextRequest, props: { params: Promise<{ GISID: string }> }) {
  const params = await props.params;
  console.log(`GET /api/street-average/strata-with-gisid/${params.GISID}`);
  const gisid = params.GISID;
  if (!gisid) {
    return new NextResponse("GISID is required", { status: 400 });
  }

  try {
    const stratasWithGisidResponse = await axios.get(`${process.env.API_GATEWAY_URL_PROD}/strata/getStrataWithGISID?GISID=${gisid}`);
    const strataProperties = stratasWithGisidResponse.data;

    const pricesPromises = strataProperties.map(property => {
      const apiUrl = `${process.env.API_GATEWAY_URL_PROD}/honestDoor/getHonestDoorPriceStrata?PID=${property.PID.Value}`;

      return axios.get(apiUrl)
        .then(response => {
          if (response.data && response.data.CurrentPrice && response.data.CurrentPrice.Value) {
            const price = parseFloat(response.data.CurrentPrice.Value);
            return price;
          } else {
            throw new Error(`Invalid price data for PID: ${property.PID.Value}`);
          }
        })
        .catch(error => {
          return null; // Return null for any failed requests to filter out later
        });
    });

    const prices = (await Promise.all(pricesPromises)).filter(price => price !== null);
    
    if (prices.length === 0) {
      throw new Error("No valid prices were fetched.");
    }

    const averagePrice = prices.reduce((acc, price) => acc + price, 0) / prices.length;

    return new NextResponse(JSON.stringify(formatCurrency(averagePrice)), {
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
