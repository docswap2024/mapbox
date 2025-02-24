import { PropertyDetailPage } from '@/components/map/propertyDetailPage';

const fetchPropertyData = async (pid: string) => {
  const PID = await pid
  try {
    const res = await fetch(
      `${process.env.API_GATEWAY_URL_PROD}/parcels/getParcel?PID=${PID}`,
      { cache: 'no-store' } // Ensures fresh data (like getServerSideProps)
    );
    if (!res.ok) throw new Error('Failed to fetch data');
    
    let propertyData = await res.json();
    console.log(propertyData)
    return propertyData || null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const fetchCardImage = async (propertyData: any) => {
  try {
    const civicAddress = propertyData?.CivicAddress?.Value?.split(' ');
    if (!civicAddress) return null;
    
    civicAddress[1] =
      civicAddress[1][0].toUpperCase() + civicAddress[1].slice(1).toLowerCase();
    const bucket =
      'https://sr-webimages-002.s3.us-west-2.amazonaws.com/Streetview/';
    const cardImageURL = `${bucket}${civicAddress[1]}/card/${civicAddress[0]}-${civicAddress[1]}.jpg`;

    const imageResponse = await fetch(cardImageURL);
    return imageResponse.ok
      ? cardImageURL
      : 'https://sr-webimages-002.s3.us-west-2.amazonaws.com/images/Default-Card.jpg';
  } catch {
    return 'https://sr-webimages-002.s3.us-west-2.amazonaws.com/images/Default-Card.jpg';
  }
};

const fetchListings = async () => {
  let allDetachedListings = null;
  try {
    const response = await fetch(`${process.env.API_GATEWAY_URL_PROD}/retsDetached/getAllDetachedListings`, 
      { cache: 'no-store' }
    );
    const data = await response.json();
    console.log(data);
    const filteredData = data.filter(item => item.Latitude && item.Longitude && item.Latitude.Value && item.Longitude.Value);
    allDetachedListings = filteredData;
    return allDetachedListings;
  } catch (error) {
    throw error;
  }
}

export default async function PropertyDetailPageWrapper({ params }: { params: Promise<{ pid: string; civicaddress: string }> }) {
  
  const propertyData = await fetchPropertyData((await params).pid);
  const cardImage = propertyData ? await fetchCardImage(propertyData) : null;
  const listings = await fetchListings();

  return (
    <>
      {propertyData && listings && <PropertyDetailPage getProperty={propertyData} propertyType="detached" listings={listings}/>}
    </>
  );
}
