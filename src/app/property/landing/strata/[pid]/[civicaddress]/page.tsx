import { PropertyDetailPage } from '@/components/map/propertyDetailPage';

const fetchPropertyData = async (pid: string) => {
  const PID = await pid
  try {
    const res = await fetch(
      `${process.env.API_GATEWAY_URL_PROD}/strata/getStrata?PID=${PID}`,
      { cache: 'no-store' } // Ensures fresh data (like getServerSideProps)
    );
    if (!res.ok) throw new Error('Failed to fetch data');
    
    let propertyData = await res.json();
    return propertyData || null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const fetchCardImage = async (listingData: any) => {
  try {
    const StrataBucket = 'https://sr-webimages-002.s3.us-west-2.amazonaws.com/strata/';
    const cardImageURL = StrataBucket + listingData?.GISID.Value + '/card.jpg';

    const imageResponse = await fetch(cardImageURL);
    return imageResponse.ok
      ? cardImageURL
      : 'https://sr-webimages-002.s3.us-west-2.amazonaws.com/images/Default-Card.jpg';
  } catch {
    return 'https://sr-webimages-002.s3.us-west-2.amazonaws.com/images/Default-Card.jpg';
  }
};

const fetchListings = async () => {
  let allStrataListings = null;
  try {
    const response = await fetch(`${process.env.API_GATEWAY_URL_PROD}/retsStrata/getAllStrataListings`, 
      { cache: 'no-store' }
    );
    const data = await response.json();
    console.log(data);
    const filteredData = data.filter(item => item.Latitude && item.Longitude && item.Latitude.Value && item.Longitude.Value);
    allStrataListings = filteredData;
    return allStrataListings;
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
      {propertyData && listings && <PropertyDetailPage getProperty={propertyData} propertyType="strata" listings={listings}/>}
    </>
  );
}
