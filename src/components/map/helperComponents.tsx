import React, { useState, useRef, useEffect} from 'react';
import * as AWS from 'aws-sdk';
import Image from 'next/image';
import Link from 'next/link';
import { FaRegHeart, FaImage, FaRegThumbsUp, FaRegEye } from 'react-icons/fa';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import { ChartOption } from '@/utils';
import { getBathrooms, formatString } from '@/utils';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);


const numberWithCommas = (input: string | number) => {
  const number = typeof input === 'string' ? parseFloat(input.replace(/,/g, '')) : Number(input);
  return number.toLocaleString('en-US');
};

const checkIfEmpty = (input: string | number) => {
  if (input === 0 || input === "0" || input === "" || input === "0 sf") {
    return "-";
  } else {
    return input;
  }
}

const Tabs = ({ children }) => {
  const [activeTab, setActiveTab] = useState(children[0].props.label);

  const handleClick = (e, newActiveTab) => {
    e.preventDefault();
    setActiveTab(newActiveTab);
  };

  return (
    <div className="w-lg">
      <div className="flex border-b border-gray">
        {children.map(child => (
          <button
            key={child.props.label}
            className={`${
              activeTab === child.props.label ? 'border-b-2 border-black font-medium' : ''
            } flex-1 font-medium py-2`}
            onClick={e => handleClick(e, child.props.label)}
          >
            {child.props.label}
          </button>
        ))}
      </div>
      <div className="py-4">
        {children.map(child => {
          if (child.props.label === activeTab) {
            return <div key={child.props.label}>{child.props.children}</div>;
          }
          return null;
        })}
      </div>
    </div>
  );
};

const Tab = ({ label, children }) => {
  return (
    <div className="hidden">
      {children}
    </div>
  );
};


const LastSold = ({ getProperty, propertyType }) => {
  const propertyInfoArray: any[] = JSON.parse(getProperty.MLSData.Value);
  const isListing = propertyType.includes("Listing");
  const isLandListing = propertyType.includes("land");

  function getGarageSituation(availableParking: string): string {
    let answer: string = "Other";
  
    // Valid answers: Triple, Double, Single, Carpot, Open, Parking Available, Other, Underground
    try {
      const rank: string[] = ['Triple', 'Double', 'Single', 'Carpot', 'Open', 'Parking Available', 'Underground'];
  
      const parkingArray: string[] = availableParking.split(',');
  
      for (const parkingType of rank) {
        for (const word of parkingArray) {
          if (word.includes(parkingType)) {
            answer = parkingType;
            return answer;
          }
        }
      }
    } catch (error) {
    }
  
    return answer;
  }
  const data = [
    {name: "Year Built", value: isListing ? getProperty.YearBuilt.Value : getProperty.YearConstructed.Value},
    {name: 'Lot Size', value: `${numberWithCommas(getProperty.LotSize.Value)} sf`},
    {name: 'Floor Area', value: isListing ? `${numberWithCommas(getProperty.TotalFloorArea.Value)} sf` : `${numberWithCommas(getProperty.FloorArea.Value)} sf`},
    {name: 'Beds', value: getProperty.Bedrooms.Value},
    {name: 'Baths', value: (isListing && !isLandListing) ? getBathrooms(getProperty.FullBaths.Value, getProperty.HalfBaths.Value) : getProperty.Bathrooms.Value},
    {name: 'Garage', value: (isListing && !isLandListing) ? getGarageSituation(getProperty.Parking.Value) : (!isListing && !isLandListing) ? getProperty.Garage.Value : 'N/A'},
    {name: 'First Floor', value: `${numberWithCommas(getProperty.FirstFloor.Value)} sf`},
    {name: 'Second Floor', value: `${numberWithCommas(getProperty.SecondFloor.Value)} sf`},
    {name: 'Third Floor', value: `${numberWithCommas(getProperty.ThirdFloor.Value)} sf`},
  ]
  return (
    <div>
      {getProperty.MLSData.Value && (
        <table className="w-full text-center text-black shadow-md mt-3">
          <thead className='bg-grayLight'>
            <tr>
              <th scope='col' className='px-6 py-3'>Date</th>
              <th scope='col' className='px-6 py-3'>Type</th>
              <th scope='col' className='px-6 py-3'>Sold Price</th>
            </tr>
          </thead>
          <tbody>
            {propertyInfoArray.map((propertyInfo, index) => (
              <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-grayLight'}`}>
                <td className='px-6 py-4'>{propertyInfo.Date}</td>
                <td className='px-6 py-4'>{propertyInfo.Type}</td>
                <td className='px-6 py-4'>{`$ ${checkIfEmpty(numberWithCommas(propertyInfo.Price))}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )} 

      <div className="grid md:grid-cols-3 grid-cols-2 p-4 pt-5">
        {data.map((item, index) => (
          <div className="min-w-0 flex-auto border-b p-3" key={index}>
            <p className="font-semibold leading-6 text-black uppercase">{item.name}</p>
            <p className="mt-1 truncate leading-5 text-black">{checkIfEmpty(item.value)}</p>
          </div>
        ))}
      </div>
      <p className='p-4 text-xs'><span className='font-semibold'>Note: </span> data provided by BCA / LTSA public record</p>
    </div>
  );
};

const Photos = ({ getProperty, propertyType}) => {
  const carouselRef = useRef<any>();
  const enlargedCarouselRef = useRef<any>();
  const [enlargedPhotos, setEnlargedPhotos] = useState<any>([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedSlide, setSelectedSlide] = useState(0);

  const scrollToSlide = (index) => {
    const carousel = carouselRef.current;    
  
    if (carousel) {
      const slideWidth = carousel.offsetWidth;
      carousel.scrollTo({
        left: index * slideWidth,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    setEnlargedPhotos(getProperty.Photos.Value);
  }, [])

  const scrollToSlideEnlarged = (index) => {
    if (enlargedCarouselRef.current) {
        const slides = enlargedCarouselRef.current.children;
        if (slides[index]) {
            slides[index].scrollTo({ behavior: 'smooth', block: 'nearest' });
            setSelectedSlide(index);
        }
    }
  };

  const openImageModal = (imageUrl, index) => {
    setSelectedSlide(index);
    setSelectedImage(imageUrl);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

 
  return (
    <div className='flex justify-center'>
      {
        getProperty.Photos.Value.length > 0 ? (
          <>
          <div className="carousel w-9/12 lg:w-6/12" ref={carouselRef} style={{ maxHeight: '50vh' }}>
            {getProperty.Photos.Value.map((photo, index) => (
              <div key={index} className="carousel-item relative w-full">
                  <Image src={photo.Value} alt={`Slide ${index}`} width={1000} height={600}></Image>
                  <div className="absolute flex justify-between transform -translate-y-1/2 left-1 right-1 md:left-5 md:right-5 top-1/2">
                    <div className={`btn btn-sm md:btn-md btn-circle ${index === 0 ? 'disabled' : ''}`} onClick={() => scrollToSlide(index - 1)}>❮</div> 
                    <div className={`btn btn-sm md:btn-md btn-circle ${index ===  getProperty.Photos.Value.length-1 ? 'disabled' : ''}`} onClick={() => scrollToSlide(index + 1)}>❯</div>
                  </div>
                  <div className="absolute bottom-2 right-4 bg-white text-brandDarker py-2 px-4 rounded-full shadow-lg flex items-center" onClick={() => openImageModal(photo, index)}>
                    <FaImage className="mr-2" /> 
                    <button className="">{getProperty.Photos.Value.length}</button>
                  </div>
              </div> 
              
            ))}
          </div>
          {selectedImage && (
                <div className="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg p-4 w-screen lg:w-7/12 m-6">
                        <div className="flex justify-end">
                            <button className="text-gray-500 hover:text-gray-700 focus:outline-none" onClick={closeImageModal}>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                        <div className="mt-4">
                            <div className="carousel w-full" ref={enlargedCarouselRef} style={{ maxHeight: '70vh' }}>
                                {enlargedPhotos.map((photo, index) => (
                                    <div key={index} className={`carousel-item relative w-full ${index === selectedSlide ? 'block' : 'hidden'}`}>
                                        <Image src={photo.Value} alt={`Slide ${index}`} width={1000} height={600}></Image>
                                        <div className="absolute flex justify-between transform -translate-y-1/2 left-1 right-1 md:left-5 md:right-5 top-1/2">
                                            <div 
                                                className={`btn btn-xs md:btn-md btn-circle ${index === 0 ? 'disabled' : ''}`} 
                                                onClick={() => scrollToSlideEnlarged(index - 1)}
                                            >
                                                ❮
                                            </div>
                                            <div 
                                                className={`btn btn-xs md:btn-md btn-circle ${index === enlargedPhotos.length - 1 ? 'disabled' : ''}`} 
                                                onClick={() => scrollToSlideEnlarged(index + 1)}
                                            >
                                                ❯
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
          </>
        ) : (
          <span className="inline-flex items-center rounded-md bg-red px-10 md:px-20 py-3 mt-5 font-medium text-white ring-1 ring-inset ring-red"> No Photos</span>
        )
      }
    </div>
  );
};

const NearbyPhotos = ({ getProperty, propertyType }) => {
  const neighbourhood = getProperty.Neighbourhood.Value;
  const [imageUrls, setImageUrls] = useState<any>([]);
  const [imageUrlsEnlarged, setImageUrlsEnlarged] = useState<any>([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const carouselRef = useRef<any>();
  const enlargedCarouselRef = useRef<any>();
  
  const formattedNeighbourhood = neighbourhood ? neighbourhood.replace(/\s+/g, '-') : 'Downtown-Squamish';

  useEffect(() => {
    AWS.config.update({
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
      correctClockSkew: true,
      region: process.env.NEXT_PUBLIC_AWS_REGION
    });
    
    const s3 = new AWS.S3();
    
    const bucketName = 'sr-webimages-002';
    const folderPath = `nearby/${formattedNeighbourhood}/`;
    
    const listObjectsParams: AWS.S3.ListObjectsV2Request = {
      Bucket: bucketName,
      Prefix: folderPath
    };
    
    s3.listObjectsV2(listObjectsParams, (err, data) => {
      if (err) {
        return;
      } else {
        const imageUrls = data?.Contents?.map(object => {
          return `https://${bucketName}.s3.amazonaws.com/${object.Key}`;
        });
    
        setImageUrls(imageUrls);
        setImageUrlsEnlarged(imageUrls);
      }
    });
  }, [])

  useEffect(() => {
    // Reorder the imageUrls array so that the selected image is at the beginning
    if (selectedImage && imageUrlsEnlarged.includes(selectedImage)) {
      const selectedIndex = imageUrlsEnlarged.indexOf(selectedImage);
      const reorderedImageUrls = [
        selectedImage,
        ...imageUrlsEnlarged.slice(0, selectedIndex),
        ...imageUrlsEnlarged.slice(selectedIndex + 1)
      ];
      setImageUrlsEnlarged(reorderedImageUrls);
    }
  }, [selectedImage]);

  const scrollToSlide = (index) => {
    const carousel = carouselRef.current;    
  
    if (carousel) {
      const slideWidth = carousel.offsetWidth;
      carousel.scrollTo({
        left: index * slideWidth,
        behavior: 'smooth'
      });
    }
  };

  const scrollToSlideEnlarged = (index) => {
    const carousel = enlargedCarouselRef.current;    
  
    if (carousel) {
      const slideWidth = carousel.offsetWidth;
      carousel.scrollTo({
        left: index * slideWidth,
        behavior: 'smooth'
      });
    }
  };

  const openImageModal = imageUrl => {
    setSelectedImage(imageUrl);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };


 
  return (
    <div className='flex justify-center'>
      <div className="carousel w-9/12 lg:w-6/12" ref={carouselRef} style={{ maxHeight: '50vh' }}>
      
    
        {imageUrls.map((photo, index) => (
          <div key={index} className="carousel-item relative w-full" >
            <Image src={photo} alt={`Slide ${index}`} width={1000} height={600} onClick={() => openImageModal(photo)}></Image>
            <div className="absolute flex justify-between transform -translate-y-1/2 left-1 right-1 md:left-5 md:right-5 top-1/2">
              <div className={`btn btn-xs md:btn-md btn-circle ${index === 0 ? 'disabled' : ''}`} onClick={() => scrollToSlide(index - 1)}>❮</div>
              <div className={`btn btn-xs md:btn-md btn-circle ${index === imageUrls.length-1 ? 'disabled' : ''}`} onClick={() => scrollToSlide(index + 1)}>❯</div>
            </div>
            <div className="absolute bottom-4 right-4 bg-white text-brandDarker py-2 px-4 rounded-full shadow-lg flex items-center" onClick={() => openImageModal(photo)}>
              <FaImage className="mr-2" /> 
              <button className="">{imageUrls.length}</button>
            </div>
          </div>
        ))}
      </div>
      {selectedImage && (
        
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-4 w-screen lg:w-7/12 m-6">
          <div className="flex justify-end">
            <button className="text-gray-500 hover:text-gray-700 focus:outline-none" onClick={closeImageModal}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div className="mt-4">
          <div className="carousel w-full" ref={enlargedCarouselRef} style={{ maxHeight: '50vh' }}>
            {imageUrlsEnlarged.map((photo, index) => (
              <div key={index} className="carousel-item relative w-full" >
                <Image src={photo} alt={`Slide ${index}`} width={1000} height={600}></Image>
                <div className="absolute flex justify-between transform -translate-y-1/2 left-1 right-1 md:left-5 md:right-5 top-1/2">
                  <div className={`btn btn-xs md:btn-md btn-circle ${index === 0 ? 'disabled' : ''}`} onClick={() => scrollToSlideEnlarged(index - 1)}>❮</div>
                  <div className={`btn btn-xs md:btn-md btn-circle ${index === imageUrlsEnlarged.length-1 ? 'disabled' : ''}`} onClick={() => scrollToSlideEnlarged(index + 1)}>❯</div>
                </div>
              </div>
            ))}
          </div>
           
          </div>
        </div>
  </div>
      )}
    </div>
  );
};

const BCAssessment = ({ getProperty, propertyType }) => {
  const isListing = propertyType.includes("Listing");
  const data = [
    {name: 'Lot Size', value: `${numberWithCommas(getProperty.LotSize.Value)} sf`} ,
    {name: 'Floor Area', value: isListing ? `${numberWithCommas(getProperty.TotalFloorArea.Value)} sf` : `${numberWithCommas(getProperty.FloorArea.Value)} sf`},
    {name: 'Classification', value: getProperty.BCAssessmentDesc.Value},
  ];
  
  const bcAssessmentDataArray: any[] = JSON.parse(getProperty.BCAssessmentData.Value);
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 p-4 pt-5">
        {data.map((item, index) => (
          <div className="min-w-0 flex-auto border-b p-3" key={index}>
            <p className="font-semibold leading-6 text-black uppercase">{item.name}</p>
            <p className="mt-1 truncate leading-5 text-black">{checkIfEmpty(item.value)}</p>
          </div>
        ))}
      </div>

      <div>
      {getProperty.BCAssessmentData.Value && (
        <table className="w-full text-center text-black shadow-md mt-3">
          <thead className='bg-grayLight'>
            <tr>
              <th scope='col' className='px-6 py-3'>July 1</th>
              <th scope='col' className='px-6 py-3'>Land Value</th>
              <th scope='col' className='px-6 py-3'>Building Value</th>
              <th scope='col' className='px-6 py-3'>Total Value</th>
            </tr>
          </thead>
          <tbody>
            {bcAssessmentDataArray
            .sort((a, b) => b.year - a.year)
            .map((bcAssessmentInfo, index) => (
              <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-grayLight'}`}>
                <td className='px-6 py-4'>{checkIfEmpty(bcAssessmentInfo.year)}</td>
                <td className='px-6 py-4'>$ {checkIfEmpty(numberWithCommas(bcAssessmentInfo.land_val))}</td>
                <td className='px-6 py-4'>$ {checkIfEmpty(numberWithCommas(bcAssessmentInfo.improv_val))}</td>
                <td className='px-6 py-4'>$ {checkIfEmpty(numberWithCommas(bcAssessmentInfo.total_val))}</td>
              </tr>
            ))}
          </tbody>
      </table>
      )} 
      </div>
      <p className='p-4 text-xs'><span className='font-semibold'>Note: </span> data provided by BCA / LTSA public record</p>
    </div>
  );
};

const Taxes = ({ getProperty, propertyType }) => {
  const data = [
    {name: 'Zoning', value: propertyType.includes("strata") ? getProperty.Zoning.Value : getProperty.ZoneCode.Value} ,
    {name: 'PID', value: getProperty.PID.Value},
    {name: 'Zone Description', value: propertyType.includes("strata") ? 'N/A' : getProperty.ZoneDesc.Value },
    {name: 'Legal Description', value: getProperty.LegalDetail.Value},
  ];

  const taxDataArray: any[] = JSON.parse(getProperty.GrossTaxData.Value);
  return (
    <div>
      <div>
      {getProperty.GrossTaxData.Value && (
        <table className="w-full text-center text-black shadow-md mt-3 ">
          <thead className='bg-grayLight'>
            <tr>
              <th scope='col' className='px-6 py-3'>Year</th>
              <th scope='col' className='px-6 py-3'>Gross Tax</th>
              <th scope='col' className='px-6 py-3'>Change</th>
            </tr>
          </thead>
          <tbody>
            {taxDataArray
            .sort((a, b) => b.year - a.year)
            .map((taxInfo, index) => (
              <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-grayLight'}`}>
                <td className='px-6 py-4'>{checkIfEmpty(taxInfo.year)}</td>
                <td className='px-6 py-4'>$ {checkIfEmpty(numberWithCommas(taxInfo.tax))}</td>
                <td className='px-6 py-4'>{checkIfEmpty(taxInfo.change)}</td>
              </tr>
            ))}
          </tbody>
      </table>
      )} 
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 p-4 pt-5">
        {data.map((item, index) => (
          <div className={`min-w-0 flex-auto border-b p-3 ${index === data.length - 1 ? 'col-span-3' : ''} ${index === data.length - 2 ? 'col-span-2 md:col-span-1' : ''}`} key={index}>
            <p className="font-semibold leading-6 text-black uppercase">{item.name}</p>
            <p className="mt-1 leading-5 text-black break-all">{checkIfEmpty(item.value)}</p>
          </div>
        ))}
      </div>
      <p className='p-4 text-xs'><span className='font-semibold'>Note: </span> data provided by BCA / LTSA public record</p>
    </div>
  );
};

const SchoolPrograms = ({ getProperty, propertyType }) => {
  const data = [
    {name: 'Elementary School', value: getProperty.ElementarySchool.Value} ,
    {name: 'Middle School', value: 'Don Ross Middle School'},
    {name: 'Private', value:' Coast Mountain Academy'},
    {name: 'High School', value: 'Howe Sound Secondary'},
    {name: 'University', value: ' Capilano University Canada'}
  ];

  return (
    <div>
      <div className="grid grid-cols-1 p-2 md:p-4 pt-5">
        {data.map((item, index) => (
          <div className="min-w-0 flex-auto p-3 bg-grayLight mb-2" key={index}>
            <p className="leading-6 text-black">{item.value}</p>
            <p className="mt-1 truncate leading-5 text-black font-semibold">{item.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const NewListings = ({newListings, propertyType}) => {  
  const [newListingsData, setNewListingsData] = useState<any>([]);

  const getListingURL = (propertyType, pid) => {
    const baseURL = propertyType === 'detached' ? '/api/rets/detached/getDetachedListing/' : '/api/rets/strata/getStrataListing/';
    return `${baseURL}${pid}`;
  };

  useEffect(() => {
    const fetchListings = async () => {
      if (newListings.length > 0) {
          const promises = newListings.map(listing =>
              axios.get(getListingURL(propertyType, listing.PID.Value))
                  .then(response => response.data[0])
          );
          const results = await Promise.all(promises);
          setNewListingsData(results);
      }
  };

  fetchListings();

  }, [newListings])
  return (
    <div>
      {
       newListingsData.length > 0 ? (
        <table className="w-full text-center text-black shadow-md mt-3 block overflow-x-auto">
          <thead className='bg-grayLight'>
            <tr>
              <th scope='col' className='px-6 py-3'>Address</th>
              <th scope='col' className='hidden md:table-cell px-6 py-3'>Bed</th>
              <th scope='col' className='hidden md:table-cell px-6 py-3'>Bath</th>
              <th scope='col' className='hidden md:table-cell px-6 py-3'>Living Area</th>
              <th scope='col' className='hidden md:table-cell px-6 py-3'>Lot Size</th>
              <th scope='col' className='px-6 py-3'>Asking Price</th>
            </tr>
          </thead>
          <tbody>
            {newListingsData.map((newListing, index) => (
              <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-grayLight'}`}>
                <td className='px-6 py-4 font-bold text-brand'>
                  {
                    propertyType === 'strata' ? (
                      <Link href={`/listing/landing/strata/${encodeURIComponent(newListing.PID.Value)}/${encodeURIComponent(formatString(newListing.CivicAddress.Value))}`}  target="_blank">
                        {newListing.CivicAddress.Value.toLowerCase()
                          .split(' ')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ')
                        }
                      </Link>
                    ) : (
                      <Link href={`/listing/landing/detached/${encodeURIComponent(newListing.PID.Value)}/${encodeURIComponent(formatString(newListing.CivicAddress.Value))}`}  target="_blank">
                       {newListing.CivicAddress.Value.toLowerCase()
                          .split(' ')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ')
                        }
                      </Link>
                    )
                  }
                </td>
                <td className='hidden md:table-cell px-6 py-4'>{newListing.Bedrooms.Value}</td>
                <td className='hidden md:table-cell px-6 py-4'>{getBathrooms(newListing.FullBaths.Value, newListing.HalfBaths.Value)}</td>
                <td className='hidden md:table-cell px-6 py-4'>{`${numberWithCommas(newListing.TotalFloorArea.Value)} sf`}</td>
                <td className='hidden md:table-cell px-6 py-4'>{`${numberWithCommas(newListing.LotSize.Value)} sf`}</td>
                <td className='px-6 py-4'>{`$ ${numberWithCommas(newListing.AskingPrice.Value)}`}</td>
              </tr>
            ))}
          </tbody>
      </table>
       ) : (
        <></>
       )
      }
    </div>
  );
}

const RecentSolds = ({recentSoldListings, propertyType}) => {  
  return (
    <div>
       {
       recentSoldListings.length > 0 ? (
        <table className="w-full text-center text-black shadow-md mt-3 block overflow-x-auto">
          <thead className='bg-grayLight'>
            <tr>
              <th scope='col' className='px-6 py-3'>Address</th>
              <th scope='col' className='hidden md:table-cell px-6 py-3'>Bed</th>
              <th scope='col' className='hidden md:table-cell px-6 py-3'>Bath</th>
              <th scope='col' className='hidden md:table-cell px-6 py-3'>Living Area</th>
              <th scope='col' className='hidden md:table-cell px-6 py-3'>Lot Size</th>
              <th scope='col' className='px-6 py-3'>Sold Price</th>
            </tr>
          </thead>
          <tbody>
            {recentSoldListings.map((soldProperty, index) => (
              <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-grayLight'}`}>
                <td className='px-6 py-4 font-bold text-brand'>
                  {
                    propertyType === 'strata' ? (
                      <Link href={`/property/landing/strata/${encodeURIComponent(soldProperty.PID.Value)}/${encodeURIComponent(formatString(soldProperty.CivicAddress.Value))}`}  target="_blank">
                        {soldProperty.CivicAddress.Value.toLowerCase()
                          .split(' ')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ')
                        }
                      </Link>
                    ) : (
                      <Link href={`/property/landing/detached/${encodeURIComponent(soldProperty.PID.Value)}/${encodeURIComponent(formatString(soldProperty.CivicAddress.Value))}`}  target="_blank">
                       {soldProperty.CivicAddress.Value.toLowerCase()
                          .split(' ')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ')
                        }
                      </Link>
                    )
                  }
                </td>
                <td className='hidden md:table-cell px-6 py-4'>{soldProperty.Bedrooms.Value}</td>
                <td className='hidden md:table-cell px-6 py-4'>{soldProperty.Bathrooms.Value}</td>
                <td className='hidden md:table-cell px-6 py-4'>{`${numberWithCommas(soldProperty.FloorArea.Value)} sf`}</td>
                <td className='hidden md:table-cell px-6 py-4'>{`${numberWithCommas(soldProperty.LotSize.Value)} sf`}</td>
                <td className='px-6 py-4'>{`$ ${checkIfEmpty(numberWithCommas(JSON.parse(soldProperty.MLSData.Value)[0].Price))}`}</td>
              </tr>
            ))}
          </tbody>
      </table>
       ) : (
        <></>
       )
      }
    </div>
  );
}

const FloorPlans = ({ getProperty, propertyType, floorPlanDocs }) => {
  const floorNames = ['First', 'Second', 'Third', 'Fourth'];

return (
  <div className='mt-4'>
    {floorPlanDocs.length > 0 ? (
      floorPlanDocs.map((doc, index) => {
        // Get the current floor name based on the index
        const currentFloorName = floorNames[index];
        console.log('Current floor name: ' + currentFloorName);

        // Determine the value to display based on the current floor's value
        let displayValue = getProperty[currentFloorName + 'Floor'].Value;

        console.log('Display value: ' + displayValue);
        // Check if the current floor value is 0 and determine the next one to display
        if (currentFloorName === 'Second' && displayValue === '0' && index + 1 < floorNames.length) {
          console.log('Second floor value is 0 - ' + getProperty['ThirdFloor'].Value) + ' ' + getProperty['SecondFloor'].Value;
          displayValue = getProperty['ThirdFloor'].Value;
        }

        if (currentFloorName === 'Third') {
          // If SecondFloor is 0, display FourthFloor for ThirdFloor
          if (getProperty['SecondFloor'].Value === '0') {
            displayValue = getProperty['FourthFloor'].Value;
          } 
          // If ThirdFloor is 0, display FourthFloor
          else if (displayValue === '0') {
            displayValue = getProperty['FourthFloor'].Value;
          }
        }

        return (
          <div className="collapse collapse-plus" key={index}>
            <input type="radio" name="floorPlans" className="peer" />
            <div className="collapse-title font-medium border-2 border-grayLight shadow-sm mb-2 peer-checked:bg-brandDarker peer-checked:text-white">
              <div className='flex justify-between'>
                Floor {index + 1}
                <p>
                  <span className='hidden md:block'>Sqft: </span>
                  {displayValue !== 0 && displayValue !== null ? displayValue + ' sf' : '-'}
                </p>
              </div>
            </div>
            <div className="collapse-content border-2 border-grayLight bg-white mb-2">
              <div className='flex justify-center'>
                <img src={doc.url} className="card-img w-78px mx-auto" alt="Floor Plan Image" />
              </div>
            </div>
          </div>
        );
      })
    ) : (
      <p>No floor plans available.</p> // Optional message for no data
    )}
  </div>
);

}

const HonestDoorPriceChart = ({ priceHistory, currentMonth }) => {

  // Helper function to subtract months from a date
  const subtractMonths = (numOfMonths, date = new Date()) => {
    date.setMonth(date.getMonth() - numOfMonths);
    return date;
  };

  // Generate labels dynamically based on the current month
  const labels = Array.from({ length: 13 }, (_, index) => {
    const date = subtractMonths(12 - index, new Date(Date.parse(`${currentMonth} 1, ${new Date().getFullYear()}`)));
    return date.toLocaleString('default', { month: 'short', year: '2-digit' });
  });

  const data = {
    labels,
    datasets: [
      {
        label: 'HonestDoor Price',
        data: priceHistory.map(item => item.Value),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  return (
    <div className="p-4">
      <Line data={data} options={ChartOption} />
    </div>
  );
};


export { Tabs, Tab, LastSold, Photos, NearbyPhotos, BCAssessment, Taxes, SchoolPrograms, NewListings, RecentSolds, FloorPlans, HonestDoorPriceChart};
