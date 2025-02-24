import React, { useState, useRef, useEffect} from 'react';
import { useForm} from 'react-hook-form';
import * as AWS from 'aws-sdk';
import S3 from 'react-aws-s3';
import Image from 'next/image';
import Link from 'next/link';
import { FaHeart, FaImage, FaThumbsUp, FaRegThumbsUp, FaRegEye, FaRegStar, FaStar, FaStarHalfAlt } from 'react-icons/fa';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import { ChartOption } from '@/utils';
import { getBathrooms, formatString } from '@/utils';
import { sendEmail } from '@/lib/utils/send-email';
import Slider from '@mui/material/Slider';
import {Rating} from '@/components/map/rating';

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
    const baseURL = 
    propertyType === 'detachedListing' || propertyType === 'detached' ? '/api/rets/detached/getDetachedListing/' :
    propertyType === 'strataListing' || propertyType === 'strata' ? '/api/rets/strata/getStrataListing/' :
    propertyType === 'landListing' ? '/api/rets/land/getLandListing/' :
    propertyType === 'multifamilyListing' ? '/api/rets/multifamily/getMultifamilyListing/' :
    '';
    return `${baseURL}${pid}`;
  };

  useEffect(() => {
    console.log('newListingsData', newListings) 
    console.log('propertyType ', propertyType)
    const fetchListings = async () => {
      if (newListings.length > 0) {
          const promises = newListings.map(listing =>
              axios.get(getListingURL(propertyType, listing.PID.Value))
                  .then(response => response.data[0])
          );
          const results = await Promise.all(promises);
          console.log('results', results)
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
                <th scope='col' className='hidden md:table-cell px-4 py-3'>Bed</th>
                <th scope='col' className='hidden md:table-cell px-4 py-3'>Bath</th>
                <th scope='col' className='hidden md:table-cell px-4 py-3'>Living Area</th>
                <th scope='col' className='hidden md:table-cell px-4 py-3'>Lot Size</th>
                <th scope='col' className='px-6 py-3'>Asking Price</th>
              </tr>
            </thead>
            <tbody>
              {newListingsData.map((newListing, index) => (
                <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-grayLight'}`}>
                  <td className='px-6 py-4 font-bold text-brand'>
                    {
                        <Link href={`/listing/landing/${propertyType.replace('Listing', '')}/${encodeURIComponent(newListing.PID.Value)}/${encodeURIComponent(formatString(newListing.CivicAddress.Value))}`}  target="_blank">
                          {newListing.CivicAddress.Value.toLowerCase()
                            .split(' ')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ')
                          }
                        </Link>
                     
                    }
                  </td>
                  {
                    propertyType === 'landListing' ? (
                      <td className='hidden md:table-cell px-4 py-4'>-</td>
                    ) : (
                    <td className='hidden md:table-cell px-4 py-4'>{newListing.Bedrooms.Value}</td>                    
                  )
                }

                  {
                    propertyType === 'landListing' ? (
                      <td className='hidden md:table-cell px-4 py-4'>-</td>
                    ) : (
                    <td className='hidden md:table-cell px-4 py-4'>{getBathrooms(newListing.FullBaths.Value, newListing.HalfBaths.Value)}</td>                    
                  )

                  }
                  <td className='hidden md:table-cell px-4 py-4'>{`${numberWithCommas(newListing.TotalFloorArea.Value)} sf`}</td>
                  <td className='hidden md:table-cell px-4 py-4'>{`${numberWithCommas(newListing.LotSize.Value)} sf`}</td>
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

const readFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
      let reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = function () {
          resolve(reader.result as string);
      };
      reader.onerror = function (error) {
          reject(error);
      };
  });
};

const processFiles = async (files: FileList): Promise<{ fileNames: string[], fileUploads: string[] }> => {
  let fileNames: string[] = [];
  let fileUploads: string[] = [];

  if (!files) return { fileNames, fileUploads };

  for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
          const result = await readFile(file);
          fileNames.push(file.name);
          fileUploads.push(result);
      } catch (error) {
          throw error;
      }
  }

  return { fileNames, fileUploads };
};
const ReviewForm = ({user, getProperty}) => {
  const [reviewEmailmessage, setReviewEmailMessage] = useState('');
  const [validateValueMessage, setValidateValueMessage] = useState('Only include numbers and specific characters: dollar sign ($), comma (,), and period (.).')
  const initialSliderValues = {
    'curb Appeal': 4.5,
    'view': 3.9,
    'location': 4.75,
    'landscaping': 4.25,
  };
  const [sliderValues, setSliderValues] = useState(initialSliderValues);

  type reviewFormData = {
    curbAppeal: number;
    view: number;
    location: number;
    landscaping: number;
    estimateValue: string;
    comments: string;
    fileUpload: FileList;
  };


  const { register: reviewRegister, handleSubmit: handleReview, reset: reviewReset, formState: { errors: reviewErrors } } = useForm<reviewFormData>();

  const handleSliderChange = (sliderName, newValue) => {
    setSliderValues(prevValues => ({
      ...prevValues,
      [sliderName]: newValue
    }));
  }

  const validateValue = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const isValid = /^[0-9$,.]*$/.test(value);
    if (!isValid) {
      setValidateValueMessage('Invalid Input')
    } else {
      setValidateValueMessage('Valid Input')
    }
  }


  const averageScore = (
      Object.keys(sliderValues).reduce((sum, sliderName) => sum + sliderValues[sliderName], 0) /
      Object.keys(sliderValues).length
  ).toFixed(2);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileName = event.target.files?.[0]?.name;
    const label = document.querySelector('.file-label') as HTMLLabelElement;

    if (label && event.target.files) {
        label.innerText = event.target.files.length > 1 ? `${event.target.files.length} files selected` : fileName || '';
    }
  };

  
  const onReview = async (data: reviewFormData) => {
    const { fileNames, fileUploads } = await processFiles(data.fileUpload);
    const curbAppeal = isNaN(Number(data['curb Appeal'])) ? 4.5 : Number(data['curb Appeal']);
    const view = isNaN(Number(data.view)) ? 3.9 : Number(data.view);
    const location = isNaN(Number(data.location)) ? 4.75 : Number(data.location);
    const landscaping = isNaN(Number(data.landscaping)) ? 4.25 : Number(data.landscaping);
    const reviewText = data.comments ?? 'N/A';
    const average = (curbAppeal + view + location + landscaping) / 4.0;
    var address = getProperty.CivicAddress.Value.split(' ')
    address[1] = address[1][0].toUpperCase() + address[1].slice(1).toLowerCase()
    address[2] = address[2][0].toUpperCase() + address[2].slice(1).toLowerCase()
    address = address.join(' ')

    var images: any[]=[]
    const config = {
        bucketName: 'review-images-bucket',
        dirName: `${getProperty.CivicAddress.Value}`,
        region: process.env.NEXT_PUBLIC_AWS_DEFAULT_REGION,
        accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
    }

    const ReactS3Client = new S3(config);
   
    if (data.fileUpload) {
      for (let i=0; i < data.fileUpload.length ; i++){
        const file = data.fileUpload[i]

        await ReactS3Client
        .uploadFile(file, file.name)
        .then(data => {
            images.push(data.location);
        })    
        .catch(err => console.log(err))
    
     }
    }

    const body = {
      "ID": getProperty.PID.Value,
      "Address": address,
      "Email": user.email,
      "CurbAppeal": curbAppeal,
      "View": view,
      "Location": location,
      "Landscaping": landscaping,
      "EstimateValue": data.estimateValue,
      "Comments": reviewText,
      "Images": images,
      "Approved": 'Pending',
    }

    console.log(body)

    const reviewResponse = await axios.post('/api/reviews/postReview', body, {
        headers: {
            'Content-Type': 'application/json',
        },
    });


    const formData = {
        name: user.name,
        realtorEmail: 'saziamakkar19@gmail.com',
        info: `
            <p style="font-weight: bold; font-size: 16px;">Thank You!</p>
            <p style="font-size: 14px;">Your review for <span>${address}</span> was submitted successfully. Here is a copy of your responses:</p>
            <p style="font-weight: bold;">Curb Appeal: <span class="value" style="font-weight: normal;">${curbAppeal}</span></p>
            <p style="font-weight: bold;">View: <span class="value" style="font-weight: normal;">${view}</span></p>
            <p style="font-weight: bold;">Location: <span class="value" style="font-weight: normal;">${location}</span></p>
            <p style="font-weight: bold;">Landscaping: <span class="value" style="font-weight: normal;">${landscaping}</span></p>
            <p style="font-weight: bold;">Review Score: <span class="value" style="font-weight: normal;">${average}</span></p>
            <p style="font-weight: bold;">Estimate Value: <span class="estimate-value" style="font-weight: normal;">${data.estimateValue}</span></p>
            <p style="font-weight: bold;">Property Review: <span class="review-text" style="font-weight: normal; font-style: italic;">${reviewText}</span></p>
        `,
        userEmail: user.email,
        fileUpload: fileUploads,
        fileName: fileNames,
    };

    try {
        const response = await sendEmail(formData);
        setReviewEmailMessage(response.message);
    } catch (error) {
        setReviewEmailMessage('Error sending email');
    }

    const timer = setTimeout(() => {
        setReviewEmailMessage('');
        reviewReset();
        setSliderValues(initialSliderValues);
        reviewReset(initialSliderValues);
        const label = document.querySelector('.file-label') as HTMLLabelElement;
        label.innerText = 'No file selected';
    }, 4000);
    return () => clearTimeout(timer);
  };

  return(
    <>
      <form onSubmit={handleReview(onReview)}>
          <div className='bg-grayLight p-4 pl-4 md:pl-12 relative'>
              {Object.keys(sliderValues).map((sliderName, index) => (
                  <div key={index} className="flex items-center gap-x-3  mb-6">
                      <div className="w-4/12 lg:w-1/6 capitalize">{sliderName}</div>
                          <div className="w-6/12 lg:w-3/5">
                              <Slider
                              disabled={!user} 
                              {...reviewRegister(sliderName as "curbAppeal" | "view" | "location" | "landscaping" | "estimateValue" | "comments", { required: false })}
                              min={0}
                              max={5}
                              step={0.1}
                              valueLabelDisplay="on"
                              aria-label={sliderName}
                              value={sliderValues[sliderName]}
                              onChange={(event, newValue) => handleSliderChange(sliderName, newValue)}
                          />
                      </div>
                  </div>
              ))}   
              <div className="p-4 text-center bg-white rounded-full md:absolute md:right-0 md:top-1/2 md:transform md:-translate-y-1/2 md:rounded-none md:rounded-l-full md:pr-6 md:pl-8">
                  <div className="mb-1 text-brand text-xl">
                      {averageScore}
                  </div>
                  <div className='text-gray text-xs'>Your Score</div>
              </div>     
          </div>
          <div className='p-4 pl-4 md:pl-12'>
              <div className="col-span-full">
                  <div className="mt-2">
                      <input type="text" required={true} placeholder="Estimate Value*"  disabled={!user}  {...reviewRegister('estimateValue', { required: true })} onChange={validateValue} name="estimateValue" id="estimateValue" className="block w-full rounded-md border-0 py-3 text-brandDarker focus:outline-grayborder bg-grayLight shadow-sm p-4 ring-1 ring-inset ring-grayborder placeholder:text-gray focus:bg-white focus:ring-grayborder sm:text-sm sm:leading-6 " />
                      {
                          validateValueMessage && <div className='block font-bold text-gray pt-2 pb-2 pl-2'>{validateValueMessage}</div>
                      }
                  </div>
              </div>
              <div className="col-span-full">
                  <div className="mt-4">
                      <textarea id="comments" placeholder="Your Review:" disabled={!user}  {...reviewRegister('comments', { required: false })} name="comments" rows={5} className="block w-full rounded-md border-0 py-3 text-brandDarker focus:outline-grayborder bg-grayLight shadow-sm p-4 ring-1 ring-inset ring-grayborder placeholder:text-gray focus:bg-white focus:ring-grayborder sm:text-sm sm:leading-6"></textarea>
                  </div>
              </div>
              <div className='mt-4'>
                  <label className="relative cursor-pointer rounded-md bg-grayLight font-semibold text-gray focus-within:outline-none focus-within:ring-2 focus-within:ring-grayborder focus-within:ring-offset-2 hover:text-gray" >
                      <div className="mt-2 flex justify-center rounded-lg border border-dashed border-grayborder  bg-grayLight px-6 py-10">
                          <div className="text-center">
                              <svg className="mx-auto h-12 w-12 text-gray" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                  <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
                              </svg>
                              <div className="mt-4 flex text-sm leading-6 text-gray">
                                  <span>Upload files</span>
                                  <p className="pl-1">or drag and drop</p>
                              </div>
                          </div>
                      </div>
                      <input id="fileUpload" type="file"  multiple disabled={!user}  {...reviewRegister('fileUpload', { required: false })} className="sr-only" onChange={handleFileChange} />
                  </label>
              </div>
              <div className='file-label mt-2 text-center text-gray'>
              No file selected
              </div>
          </div>
          <div className='p-4 pl-12'>
              <div>
                  {reviewEmailmessage && <div className='block font-bold text-gray pt-2 pb-2 pl-2'>{reviewEmailmessage}</div>}
              </div>
              <button className='btn bg-brandDark capitalize text-white text-xs md:text-sm lg:text-md hover:opacity-80 hover:bg-brandDark' disabled={!user}>
                  Submit Review
                  <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                      <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                      <g id="SVGRepo_iconCarrier"> 
                          <path d="M10.3009 13.6949L20.102 3.89742M10.5795 14.1355L12.8019 18.5804C13.339 19.6545 13.6075 20.1916 13.9458 20.3356C14.2394 20.4606 14.575 20.4379 14.8492 20.2747C15.1651 20.0866 15.3591 19.5183 15.7472 18.3818L19.9463 6.08434C20.2845 5.09409 20.4535 4.59896 20.3378 4.27142C20.2371 3.98648 20.013 3.76234 19.7281 3.66167C19.4005 3.54595 18.9054 3.71502 17.9151 4.05315L5.61763 8.2523C4.48114 8.64037 3.91289 8.83441 3.72478 9.15032C3.56153 9.42447 3.53891 9.76007 3.66389 10.0536C3.80791 10.3919 4.34498 10.6605 5.41912 11.1975L9.86397 13.42C10.041 13.5085 10.1295 13.5527 10.2061 13.6118C10.2742 13.6643 10.3352 13.7253 10.3876 13.7933C10.4468 13.87 10.491 13.9585 10.5795 14.1355Z" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          </path> 
                      </g>
                  </svg>
              </button>
          </div>
      </form>
      {!user && (
          <div className='p-4'>
              <div className="bg-grayLight border-t-4 border-gray rounded-b px-4 py-3 shadow-md" role="alert">
                  <div className="flex">
                      <div className="py-1"><svg className="fill-current h-6 w-6 text-black mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/></svg></div>
                      <div>
                          <p className="font-bold">Action Requires Authentication</p>
                          <p className="text-sm">Please log in to leave a review.</p>
                      </div>
                  </div>
          </div>
      </div>
      )}
    </>
  );
}

const ReportIssue = ({user, getProperty, showReportForm, setShowReportForm, reportRef}) => {
  type reportFormData = {
    info: string;
  };

  const [errMessage, setErrMessage] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  const showReport = () => {
    if (!user) {
        setShowReportForm(false);
        setErrMessage('Please log in to report an issue.');
        return;
    }
    setShowReportForm(true);
  }

  const onReport = async (data: reportFormData) => {
    const issue = data.info !== undefined && data.info !== null && data.info !== '' ? data.info : 'N/A'

    const body = {
      "ID": getProperty.PID.Value,
      "Email": user.email,
      "Issue": issue,
  }

  console.log(body)

    const isssueResponse = await axios.post('/api/issues/postIssue', body, {
        headers: {
            'Content-Type': 'application/json',
        },
    });


    const formData = {
      name: user.name,
      realtorEmail: 'saziamakkar19@gmail.com',
      info: `
          <p style="font-weight: bold; font-size: 16px;">Thank You!</p>
          <p style="font-size: 14px;">Your issue was submitted successfully. Here is a copy of your responses:</p>
          <p style="font-weight: bold;">Issue: <span class="value" style="font-weight: normal;">${issue}</span></p>
      `,
      userEmail: user.email,
    }

    try {
        const response = await sendEmail(formData);
        setEmailMessage(response.message);
    } catch (error) {
        setEmailMessage('Error sending email');
    }

    const timer = setTimeout(() => {
        setEmailMessage('');
        reportReset();
        
    }, 4000);
    return () => clearTimeout(timer);
  }


  const { register: reportRegister, handleSubmit: handleReport, reset: reportReset, formState: { errors: reportErrors } } = useForm<reportFormData>();

  return (
    <>
      <div ref={reportRef} className="p-6 rounded-lg bg-white shadow-md mb-5 justify-between" >
          <div>
              <h5 className="mb-2 lg:text-lg font-semibold tracking-tight">Report an Issue</h5>
              <p className="mb-3 font-normal">Your feedback is invaluable to us! If you’ve come across any issues, or have suggestions for improvement, please take a moment to let us know.</p>
          </div>
          <div>
              <button className='btn bg-brandDark capitalize text-white text-xs md:text-sm lg:text-md hover:opacity-80 hover:bg-brandDark' onClick={showReport}>Report Now</button>
          </div>
      </div>
      {
        showReportForm && (
            <form className='rounded-lg bg-white shadow-md mb-5' onSubmit={handleReport(onReport)}>
                <div className='p-4 pl-6 bg-white'>
                    <div className="col-span-full mb-4">
                        <div className="mt-2">
                            <input type="text" required placeholder="The issue (250 char):" id="info" {...reportRegister('info', { required: true })} className="block w-full rounded-md border-0 py-3 text-brandDarker focus:outline-grayborder bg-grayLight shadow-sm p-4 ring-1 ring-inset ring-grayborder placeholder:text-gray focus:bg-white focus:ring-grayborder sm:text-sm sm:leading-6 " />
                        </div>
                    </div>
                    <div>
                        {emailMessage && <div className='block font-bold text-gray pt-2 pb-2 pl-2'>{emailMessage}</div>}
                    </div>
                    <button className='btn bg-brandDark capitalize text-white text-xs md:text-sm lg:text-md hover:opacity-80 hover:bg-brandDark'>
                        Report Issue
                        <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                            <g id="SVGRepo_iconCarrier"> 
                                <path d="M10.3009 13.6949L20.102 3.89742M10.5795 14.1355L12.8019 18.5804C13.339 19.6545 13.6075 20.1916 13.9458 20.3356C14.2394 20.4606 14.575 20.4379 14.8492 20.2747C15.1651 20.0866 15.3591 19.5183 15.7472 18.3818L19.9463 6.08434C20.2845 5.09409 20.4535 4.59896 20.3378 4.27142C20.2371 3.98648 20.013 3.76234 19.7281 3.66167C19.4005 3.54595 18.9054 3.71502 17.9151 4.05315L5.61763 8.2523C4.48114 8.64037 3.91289 8.83441 3.72478 9.15032C3.56153 9.42447 3.53891 9.76007 3.66389 10.0536C3.80791 10.3919 4.34498 10.6605 5.41912 11.1975L9.86397 13.42C10.041 13.5085 10.1295 13.5527 10.2061 13.6118C10.2742 13.6643 10.3352 13.7253 10.3876 13.7933C10.4468 13.87 10.491 13.9585 10.5795 14.1355Z" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                </path> 
                            </g>
                        </svg>
                    </button>
                </div>
            </form>
        )
      }
      {errMessage && (
        <div className='p-4 mt-5 text-brandDarker'>
            <div className="bg-grayLight border-t-4 border-gray rounded-b px-4 py-3 shadow-md" role="alert">
                <div className="flex">
                    <div className="py-1"><svg className="fill-current h-6 w-6 text-black mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/></svg></div>
                    <div>
                        <p className="font-bold">Action Failed</p>
                        <p className="text-sm">{errMessage}</p>
                    </div>
                </div>
            </div>
        </div>
      )}
    </>
  )
}


const Reviews = ({ averageRating, reviewCount }) => {
  return (
    <>
      <Rating rating={Number(averageRating.toFixed(2))} count={reviewCount} />
    </>
  );
};

const PropertyReviews = ({ reviews, getProperty, propertyType }) => {
  const carouselRefs = useRef<any>([]);
  const [approvedReviews, setReviews] = useState<any>([]);
  const reviewCarouselRef = useRef<any>(null);
  const [cardImage, setCardImage] = useState('');
  const scrollToSlideImage = (carouselIndex, index) => {
    const carousel = carouselRefs.current[carouselIndex];
    if (carousel) {
        const slideWidth = carousel.offsetWidth;
        carousel.scrollTo({
            left: index * slideWidth,
            behavior: 'smooth'
        });
    }
};

const handleDotClick = (reviewIndex, index) => {
    setReviews(prevPhotos => {
        const updatedPhotos = [...prevPhotos];
        updatedPhotos[reviewIndex].activeIndex = index;
        return updatedPhotos;
    });
    scrollToSlideImage(reviewIndex, index);
};

  const scrollToSlide = (index) => {
    const carousel = reviewCarouselRef.current;
    if (carousel) {
      const slideWidth = carousel.offsetWidth; // Width of one slide
      carousel.scrollTo({
        left: index * slideWidth,
        behavior: 'smooth',
      });
    }
  };

  const fetchImage = (url) => {
    return fetch(url, { method: 'GET', mode: 'cors' })
      .then(response => {
        if (response.ok) {
          return url;
        } else {
          return 'no-image-found';
        }
      })
      .catch(error => {
        return 'no-image-found';
      });
    };


  useEffect(() => {
    console.log(reviews);
    
    // Filter reviews to include only those that are approved
    const filteredReviews = reviews.filter(review => review.Approved === 'True');
    
    // Map over the filtered reviews to set the active index
    const reviewsWithActiveIndex = filteredReviews.map((review, index) => ({
      ...review,
      activeIndex: 0,
    }));
  
    // Set the state with the updated reviews
    setReviews(reviewsWithActiveIndex);
    
  }, [reviews]);

  useEffect(() => {
    if(propertyType === 'strata') {
      const bucket = 'https://sr-webimages-002.s3.us-west-2.amazonaws.com/strata/';
      const card_image = bucket + getProperty.GISID.Value + '/card.jpg';

      fetchImage(card_image).then(result => {
        setCardImage(result);
      });
    } else {
      var civic_address = getProperty.CivicAddress.Value.split(' ')
      civic_address[1] = civic_address[1][0].toUpperCase() + civic_address[1].slice(1).toLowerCase()
      var bucket = 'https://sr-webimages-002.s3.us-west-2.amazonaws.com/Streetview/'
      var card_image = bucket + civic_address[1] + '/card/' + civic_address[0] + '-' + civic_address[1] + '.jpg'

      fetchImage(card_image)// what? Net 40050
      .then(result => {
        setCardImage(result);
      });
    }
  }, []);

  const StarRating = ({ rating }) => {
    let averageRating = rating; 
    const starElements = Array.from({ length: 5 }, (_, index) => {
      let starIcon = FaRegStar; // Empty star
  
      if (averageRating > 0) {
        if (averageRating > 0.5) {
          starIcon = FaStar; // Full star
        } else {
          starIcon = FaStarHalfAlt; // Half star
        }
      }
  
      averageRating--;
  
      return (
        <span key={index} style={{ width: '1em' }} className='text-white text-xs md:text-sm ml-1'>
          {React.createElement(starIcon)}
        </span>
      );
    });
  
    return (
        <div className='flex  justify-center items-center'>
        {starElements}
        <span className='ml-2 text-white font-medium text-xs md:text-sm'>({rating.toFixed(1)})</span>
        </div>
    );
  };


  return (
    <> 
      {
        approvedReviews && approvedReviews.length > 0 && (
          <div className="flex flex-col items-center mt-2">
            <div ref={reviewCarouselRef} className="carousel w-full overflow-hidden relative flex">
              {approvedReviews.map((reviewData, reviewIndex) => (
              <div key={reviewIndex} className="carousel-item w-full mx-auto">
                <div className="bg-white w-full p-4 rounded-lg shadow-md relative flex flex-col md:flex-row">
                  <div className="absolute flex justify-between transform -translate-y-1/2 left-0.5 right-1 top-1/2">
                    <div className={`btn btn-xs md:btn-sm btn-circle ${reviewIndex === 0 ? 'disabled' : ''}`} onClick={() => scrollToSlide(reviewIndex - 1)}>❮</div>
                    <div className={`btn btn-xs md:btn-sm btn-circle ${reviewIndex === approvedReviews.length-1 ? 'disabled' : ''}`} onClick={() => scrollToSlide(reviewIndex + 1)}>❯</div>
                  </div>
                  {/* Image Section */}
                  
                  <div className="w-full md:w-1/3 flex-shrink-0 flex justify-center p-4 bg-gray-50 rounded-t-lg md:rounded-l-lg md:rounded-tr-none relative">
                  {
                    reviewData?.Images && reviewData?.Images.length > 0 ? (
                      <div className='relative'>
                        <div className="carousel w-full h-full overflow-y-hidden pb-4 md:pb-0" ref={(el) => { carouselRefs.current[reviewIndex] = el; }} style={{ maxHeight: '35vh'}}>
                          {
                          reviewData?.Images && reviewData?.Images.length > 0 && (
                              reviewData?.Images.map((image, i) => (
                                <div key={`${reviewIndex}-${i}`} className="carousel-item relative w-full justify-center items-center">
                                    <img
                                      src={image}
                                      alt="Property Image 1"
                                      className="h-48 md:h-4/6 lg:h-5/6  rounded-lg object-fit shadow-md"
                                    />
                                </div>
                              ))
                              
                            )
                          }
                        </div>
                        <div className="carousel-dots absolute bottom-0 left-0 right-0 flex justify-center">
                            {reviewData?.Images && reviewData?.Images.map((_, i) => (
                                <div key={i} className={`dot w-3 h-3 rounded-full mx-1 ${reviewData.activeIndex === i ? 'bg-brand' : 'bg-gray'}`} onClick={() => handleDotClick(reviewIndex, i)}></div>
                            ))}
                        </div>
                      </div>
                    ) : (
                      <div className="carousel-item relative w-full justify-center items-center">
                      <img
                        src={cardImage}
                        alt="Property Image 1"
                        className="h-48 md:h-4/6 lg:h-5/6 rounded-lg object-fit shadow-md"
                      />
                      </div>
                    )
                  }
                  </div>
              
                  {/* Rating and Details Section */}
                  <div className="w-full md:w-2/3 pr-6 flex flex-col justify-between">
                    {/* <div className={styles.reviewRating}>{reviewData.Avg.toFixed(2)}</div> */}
                    <div className="flex justify-between items-center space-x-4">
                      {/* Estimate Value */}
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="inline-flex items-center bg-gradient-to-r from-brandDark to-brandDark text-white rounded-full px-3 py-1 shadow-md transition-transform hover:scale-105">
                          <span className="font-semibold text-xs md:text-sm">{reviewData.EstimateValue}</span>
                        </div>
                      </div>

                      {/* Star Rating */}
                      <div className="inline-flex items-center bg-gradient-to-r from-brandDark to-brandDark text-white rounded-full px-3 py-1 shadow-md transition-transform hover:scale-105">
                        <StarRating rating={reviewData.Avg} />
                      </div>
                    </div>

              
                    {/* Individual Ratings */}
                    <div className="mt-2">
                      {['CurbAppeal', 'Landscaping', 'Location', 'View'].map((key) => (
                        <div key={key} className="flex items-center mb-3">
                          <p className="w-24 text-gray-700 font-medium">{key.replace(/([A-Z])/g, ' $1')}:</p>
                          <progress 
                            className="flex-grow h-2 rounded-lg overflow-hidden progress-info"
                            value={reviewData[key] * 20} max="100"></progress>
                          <span className="text-xs md:text-sm font-medium text-gray-800 ml-3">{reviewData[key]}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs md:text-sm text-brandDarker italic">{reviewData.Comments} ({reviewData.Date})</p>
                    {/* <p className='w-24 text-gray-700 font-medium" mt-2'>Estimate Value</p>
                    <p className="text-xs md:text-sm text-brandDarker">{reviewData.EstimateValue}</p> */}
                  </div>
                </div>
              </div>
            
            
              ))}            </div>
          </div>
        ) 
      }
    </>
  )
}
export { Tabs, Tab, LastSold, Photos, NearbyPhotos, BCAssessment, Taxes, SchoolPrograms, NewListings, RecentSolds, FloorPlans, HonestDoorPriceChart, ReviewForm, ReportIssue, Reviews, PropertyReviews};
