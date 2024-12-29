import React from 'react'
import {PropertyDetailPage} from '@/components/map/propertyDetailPage'
import axios from 'axios';
import Head from 'next/head';
import { formatString } from '@/utils';

interface IndexProps {
  propertyData: any;
  allDetachedListings: any;
  cardImage: string;
}

const getPageDescription = (listingData) => {
  if (listingData){
    const address = listingData.CivicAddress.Value;
    const numBathrooms = listingData.Bathrooms.Value;
    const numBedrooms = listingData.Bedrooms.Value;
    const floorArea = listingData.FloorArea.Value;
    const lotSize = listingData.LotSize.Value;
    const yearConstructed = listingData.YearConstructed.Value;
    const zoneDesc = listingData.ZoneDesc.Value;
    const description = `A ${numBedrooms} bedroom, ${numBathrooms} bathroom ${zoneDesc} property at ${address}. Built in ${yearConstructed}, this property has a floor area of ${floorArea} sqft, and a lot size of ${lotSize} sqft.`
    return description;
  }
}

const getOGPageDescription = (listingData) => {
  if (listingData){
    const address = listingData.CivicAddress.Value;
    const numBathrooms = listingData.Bathrooms.Value;
    const numBedrooms = listingData.Bedrooms.Value;
    const floorArea = listingData.FloorArea.Value;
    const lotSize = listingData.LotSize.Value;
    const yearConstructed = listingData.YearConstructed.Value;
    const zoneDesc = listingData.ZoneDesc.Value;
    const description = `A ${numBedrooms} bedroom, ${numBathrooms} bathroom ${zoneDesc} property at ${address}. Built in ${yearConstructed}, this property has a floor area of ${floorArea} sqft, and a lot size of ${lotSize} sqft.`
    const concatString = description.length > 200 ? description.substring(0, 197) + '...' : description;
    return concatString;
  }
}


const Index =  ({ propertyData, allDetachedListings, cardImage}: IndexProps) => {
  return (
    <>
      <Head>
        {propertyData && (
          <>
            <title>{propertyData.CivicAddress.Value ?? 'Detached Property'}</title>
            <meta name="description" content={getPageDescription(propertyData) ?? ''} />
            <meta property="og:url" content={`https://squamish.realestate//property/landing/detached/${propertyData.PID.Value}/${formatString(propertyData.CivicAddress.Value)}`} />
            <meta property="og:type" content="website" />
            <meta property="og:title" content={propertyData.CivicAddress.Value ?? 'Detached Property'} />
            <meta property="og:description" content={getOGPageDescription(propertyData) ?? ''} />
            <meta property="og:image" content={cardImage ?? ''} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta property="twitter:domain" content="squamish.realestate" />
            <meta property="twitter:url"  content={`https://squamish.realestate//property/landing/detached/${propertyData.PID.Value}/${formatString(propertyData.CivicAddress.Value)}`} />
            <meta name="twitter:title" content={propertyData.CivicAddress.Value ?? 'Detached Property'} />
            <meta name="twitter:description"  content={getOGPageDescription(propertyData) ?? ''} />
            <meta name="twitter:image"  content={cardImage ?? ''} />
          </>
        )}
      </Head>
      {
        propertyData && <PropertyDetailPage getProperty={propertyData} propertyType='detached' listings={allDetachedListings}/>
      }
    </>
  )
}


export const getServerSideProps = async (context: any) => {
  const { pid } = context.query;
  let propertyData = null;
  let allDetachedListings = null;
  let cardImage = '';

  try {
    const response = await axios.get(`${process.env.API_GATEWAY_URL_PROD}/parcels/getParcel?PID=${pid}`);
    
    if(response.status === 200){
      const data = await response.data;
      propertyData = data;
      const civicAddress = data.CivicAddress.Value.split(' ');
      civicAddress[1] = civicAddress[1][0].toUpperCase() + civicAddress[1].slice(1).toLowerCase();
      const bucket = 'https://sr-webimages-002.s3.us-west-2.amazonaws.com/Streetview/';
      const cardImageURL = `${bucket}${civicAddress[1]}/card/${civicAddress[0]}-${civicAddress[1]}.jpg`;

      try {
        const imageResponse = await axios.get(cardImageURL);
        if (imageResponse.status === 200) {
          cardImage = cardImageURL;
        } else {
          cardImage = 'https://sr-webimages-002.s3.us-west-2.amazonaws.com/images/Default-Card.jpg';
        }
      } catch {
        cardImage = 'https://sr-webimages-002.s3.us-west-2.amazonaws.com/images/Default-Card.jpg';
      }
    }
  } catch (error) {
    throw error;
  }

  try {
    const response = await axios.get(`${process.env.API_GATEWAY_URL_PROD}/retsDetached/getAllDetachedListings`);
    const data = response.data;
    const filteredData = data.filter(item => item.Latitude && item.Longitude && item.Latitude.Value && item.Longitude.Value);
    allDetachedListings = filteredData;
  } catch (error) {
    throw error;
  }

  return {
    props: {
      propertyData,
      allDetachedListings,
      cardImage
    },
  };
}

export default Index