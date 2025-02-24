import { ListingDetailPage } from '@/components/map/listingDetailPage';

const fetchListingData = async (pid: string) => {
  const PID = await pid
  try {
    const res = await fetch(
      `${process.env.API_GATEWAY_URL_PROD}/retsStrata/getStrataListing?PID=${PID}`,
      { cache: 'no-store' } // Ensures fresh data (like getServerSideProps)
    );
    if (!res.ok) throw new Error('Failed to fetch data');
    
    let listingDataArray = await res.json();
    if (listingDataArray.length > 1) {
      listingDataArray = listingDataArray.sort(
        (a, b) =>
          new Date(b.ListingDate.Value).getTime() -
          new Date(a.ListingDate.Value).getTime()
      );
    }
    return listingDataArray[0] || null;
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

export default async function ListingDetailPageWrapper({ params }: { params: Promise<{ pid: string; civicaddress: string }> }) {
  
  const listingData = await fetchListingData((await params).pid);
  const cardImage = listingData ? await fetchCardImage(listingData) : null;
  const listings = await fetchListings();

  return (
    <>
      {listingData && listings && <ListingDetailPage getListing={listingData} listingType="strataListing" listings={listings}/>}
    </>
  );
}
