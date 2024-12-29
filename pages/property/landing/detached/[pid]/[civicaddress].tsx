import React from 'react'
import {PropertyDetailPage} from '@/components/map/propertyDetailPage'
import axios from 'axios';

interface IndexProps {
  propertyData: any;
  allDetachedListings: any;
  cardImage: string;
}

const Index =  ({ propertyData, allDetachedListings, cardImage}: IndexProps) => {
  return (
    <>
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