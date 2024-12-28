"use client";

import React, {useEffect, useState, useRef} from 'react'
import { FaRegClock, FaEye, FaMapMarkerAlt , FaHome, FaTools, FaThermometerFull, FaBed, FaBath, FaVectorSquare, FaParking, FaRulerCombined, FaCheck, FaImage, FaDollarSign, FaEllipsisV, FaCommentAlt, FaExclamationTriangle} from "react-icons/fa";
import { LastSold, Photos, NearbyPhotos, BCAssessment, Taxes, SchoolPrograms, FloorPlans } from './helperComponents';
import { ShareMenu } from '../shareMenu';
import { useRouter } from 'next/navigation';
import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react';
import Image from 'next/image';
import axios from 'axios';
import { getBathrooms, formatPrice, formatDate, checkUrl, formatTime } from '@/utils';
import { usePrint } from '@/context/printContext';

export const ListingDetail = ({getListing, listingType, landingUrl}) => {
    const router = useRouter();
    const [floorPlanDocs, setFloorPlanDocs] = useState<any>([]);
    const [floorPlansCount, setFloorPlansCount] = useState<number>(0);
    const [scheduleTourDates, setScheduleTourDates] = useState<any>([]);
    const [viewCount, setViewCount] = useState<number>(0);
    const [selectedImage, setSelectedImage] = useState(null);
    const [enlargedPhotos, setEnlargedPhotos] = useState<any>([]);
    const enlargedCarouselRef = useRef<any>();
    const [selectedSlide, setSelectedSlide] = useState(0);
    const [openhouses, setOpenhouses] = useState<any>([]);
    const [averageRating, setAverageRating] = useState(0);
    const [reviewCount, setReviewCount] = useState(0);
    const [reviews, setReviews] = useState<any>([]);
    const [showReportForm, setShowReportForm] = useState(false);
    const reviewsRef = useRef<any>(null);
    const reportRef = useRef<any>(null);
    const [openAccordions, setOpenAccordions] = useState({});
    const [bookmarkCount, setBookmarkCount] = useState(0);
    const [likedCount, setLikedCount] = useState(0);
    const { isPrinting } = usePrint();

    const toggleAccordion = (index) => {
        setOpenAccordions((prevState) => ({
            ...prevState,
            [index]: !prevState[index],
        }));
    };

    function classNames(...classes) {
        return classes.filter(Boolean).join(' ')
    }

    const scrollToRef = (ref, value) => {
        console.log(ref);
        ref?.current?.scrollIntoView({ behavior: 'smooth' });
        if (ref?.current instanceof HTMLInputElement) {
            ref.current.checked = true;
        }
    };

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
    
    function getElapsedTime(listDate: string): string {
        try {
            const listingDate = new Date(listDate);
            const todayDate = new Date();
            const deltaT = todayDate.getTime() - listingDate.getTime();
    
            const listingDays = Math.floor(deltaT / (1000 * 60 * 60 * 24));
    
            if (listingDays < 30) {
                return `${listingDays} days`;
            } else {
                const months = Math.floor(listingDays / 30);
                const days = listingDays % 30;
    
                return `${months} months, ${days} days`;
            }
        } catch (error) {
            return 'Invalid date format';
        }
    }

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

    const checkIfEmpty = (input: string | number) => {
        if (input === 0 || input === "0" || input === "" || input === "0 sf") {
          return "-";
        } else {
          return input;
        }
    };

    const formatDateString = (inputDate) => {
        if(!inputDate) return 'N/A';
        const months = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const [year, month, day] = inputDate.split('-').map(Number);
      
        return `${day} ${months[month - 1]}, ${year}`;
    }; 
  

    async function getFloorPlanDocs(civicAddress: string) {
        const BASE_BUCKET_URL = 'https://sr-webimages-002.s3.us-west-2.amazonaws.com/';
        const FLOOR_PLAN_CHECK_LIMIT = 10;
        civicAddress = civicAddress.replace(/-/g, ' ');
        var civic_address = civicAddress.split(' ')
        const FILE_EXTENSION = '.png';
        const documents: { url: string; fileName: string }[] = [];

        for (let i = 1; i <= FLOOR_PLAN_CHECK_LIMIT; i++) {
            let potentialUrl;
            if (listingType === 'strataListing') {
                civic_address[2] = civic_address[2][0].toUpperCase() + civic_address[2].slice(1).toLowerCase()
                potentialUrl = `${BASE_BUCKET_URL}strata/${getListing.GISID.Value}/fp/${civic_address[0]}-${civic_address[1]}-${civic_address[2]}-Floor-Plan-${i}${FILE_EXTENSION}`;
            } else {
                if (!isNaN(Number(civic_address[1]))) {
                    console.log(`${civic_address[1]} is a number.`);
                    civic_address[2] = civic_address[2][0].toUpperCase() + civic_address[2].slice(1).toLowerCase()
                    potentialUrl = `${BASE_BUCKET_URL}Streetview/${civic_address[2]}/fp/${civic_address[0]}-${civic_address[1]}-${civic_address[2]}-Floor-Plan-${i}${FILE_EXTENSION}`;
                } else {
                    console.log(`${civic_address[1]} is not a number.`);
                    civic_address[1] = civic_address[1][0].toUpperCase() + civic_address[1].slice(1).toLowerCase()
                    potentialUrl = `${BASE_BUCKET_URL}Streetview/${civic_address[1]}/fp/${civic_address[0]}-${civic_address[1]}-Floor-Plan-${i}${FILE_EXTENSION}`;
                }
            }
            const result = await checkUrl(potentialUrl);
            if (!result) {
                break;
            } else {
                const fileName = potentialUrl.split('/').pop() || '';
                documents.push({ url: potentialUrl, fileName });
            }
        }

        return documents;
    }

    useEffect(() => {
        console.log(getListing);
        if (getListing.Photos.Value.length === 0) {
            setEnlargedPhotos([
              '/images/dashboard/Squamish-1.jpg',
              '/images/dashboard/Squamish-2.jpg',
              '/images/dashboard/Squamish-3.jpg',
            ]
            );
        } else if (getListing.Photos.Value.length === 1) {
           setEnlargedPhotos([
             getListing.Photos.Value[0],
             '/images/dashboard/Squamish-1.jpg',
             '/images/dashboard/Squamish-2.jpg',
           ]
           );
        } else if (getListing.Photos.Value.length === 2) {
           setEnlargedPhotos([
             getListing.Photos.Value[0],
             getListing.Photos.Value[1],
             '/images/dashboard/Squamish-1.jpg',
           ]
           );
        } else {
              setEnlargedPhotos(getListing.Photos.Value);
          }
        const fetchFloorPlanDocs = async () => {
            try {
                console.log(getListing.CivicAddress.Value)
                const floorPlanDocs = await getFloorPlanDocs(getListing.CivicAddress.Value);
                setFloorPlanDocs(floorPlanDocs);
                setFloorPlansCount(floorPlanDocs.length);
            } catch (error) {
                console.log('Error fetching floor plan documents:', error);
            }
        }; 
    
        fetchFloorPlanDocs();

        const getDates = () => {
            const dates: any[] = [];
            const today = new Date();
        
            for (let i = 1; i <= 7; i++) {
              const nextDate = new Date();
              nextDate.setDate(today.getDate() + i);
              dates.push(nextDate.toDateString());
            }
            setScheduleTourDates(dates);
            return dates;
          };

          getDates();

        const getViews = async () => {
            try{
                const response = await axios.get(`/api/views/getViews/${getListing.PID.Value}`);
                const data = await response.data;
                if (data) {
                    setViewCount(data.ViewCount);
                }
            } catch (error) {
                console.log(error);
            }
        }

        getViews();

        const getReviews = async () => {
            try{
                const response = await axios.get(`/api/forms/reviews/getReviewsByID/${getListing.PID.Value}`);
                let data = await response.data;
                if (Array.isArray(data) && data.length > 0) {
                    console.log(data);
                    data = data.filter(review => review.Approved === 'True');
                    console.log(data);
                    setReviews(data);
                    const totalAvg = data.reduce((sum, review) => sum + review.Avg, 0) / data.length;

                    console.log('Total Average:', totalAvg);
                    
                    setAverageRating(totalAvg);
                    setReviewCount(data.length);
                }
            } catch (error) {
                console.log(error);
            } 
        }

        getReviews();

        const getOpenhouses = async () => {
            try {
                const response = await axios.get(`/api/openhouses/getOpenhouses/${getListing.ListingID.Value}`);
                let data = await response.data;
                if (data) {
                    data = data.sort((a, b) => {
                        const startDateA = new Date(a.StartDate + 'T' + a.StartTimestamp);
                        const startDateB = new Date(b.StartDate + 'T' + b.StartTimestamp);
                        
                        return startDateA.getTime() - startDateB.getTime();
                    });
                    data = data.filter(openHouse => {
                        return !isPastEvent(openHouse.StartDate, openHouse.StartTimestamp);
                    });
                    setOpenhouses(data);
                }
            } catch (error) {
                console.log(error);
            }
        
        }

        getOpenhouses();

        const fetchBookmarkCount = async () => {
            try {
                const response = await axios.get(`/api/savedProperties/getSavedPropertyByID/${getListing.PID.Value}`);
                const data = await response.data;
                console.log(data);
                if (Array.isArray(data) && data.length > 0) {
                    setBookmarkCount(data.length);
                }
            } catch (error) {
                console.log(error);
            }  
        }

        fetchBookmarkCount();

        const fetchLikeCount = async () => {
            try {
                const response = await axios.get(`/api/likedProperties/getLikedPropertyByID/${getListing.PID.Value}`);
                const data = await response.data;
                if (Array.isArray(data) && data.length > 0) {
                    setLikedCount(data.length);
                }
            } catch (error) {
                console.log(error);
            }  
        }

        fetchLikeCount();

    }, [])


    const features = [
        {name: 'Type', value: getListing.DwellType.Value, icon: FaHome},
        {name: 'Year Built', value: getListing.YearBuilt.Value === '9999' ? 'N/A' : getListing.YearBuilt.Value, icon: FaTools},
        {name: 'Heating', value: listingType.includes('land') ? 'N/A' : getListing.Heating.Value , icon: FaThermometerFull},
        {name: 'Sqft', value: getListing.TotalFloorArea.Value, icon: FaVectorSquare},
        {name: 'Bedrooms', value: getListing.Bedrooms.Value, icon: FaBed},
        {name: 'Bathrooms', value: listingType.includes('land') ? getListing.Bathrooms.Value : getBathrooms(getListing.FullBaths.Value, getListing.HalfBaths.Value), icon: FaBath},
        {name: 'Garage', value: listingType.includes('land') ? 'N/A' :  getGarageSituation(getListing.Parking.Value), icon: FaParking},
        {name: 'Lot Size', value: `${getListing.LotSize.Value} sf`, icon: FaRulerCombined},
        ...(listingType === 'strataListing' ? [{ name: 'Strata Fee', value: getListing.StrataFee.Value, icon: FaDollarSign }] : [])
    ]

    const listingInfo = [
        {name: `Sold History (${formatDateString(getListing.LastMLSDate.Value)})`, component: LastSold},
        {name: `Photos (${getListing.Photos.Value.length})`, component: Photos},
        {name: `Floor Plans (${floorPlansCount})`, component: FloorPlans},
        {name: 'Nearby Photos', component: NearbyPhotos},
        {name: 'BC Assessment', component: BCAssessment},
        {name: 'Taxes', component: Taxes},
        {name: 'School Programs', component: SchoolPrograms}
    ]
    
    function isPastEvent(dateString, timeString) {
        const eventDate = new Date(`${dateString}T${timeString}`);
        const currentDate = new Date();
        return eventDate < currentDate;
    }

    function createGoogleCalendarLink(event) {
        const start = new Date(`${event.StartDate}T${event.StartTimestamp}`).toISOString().replace(/-|:|\.\d+/g, '');
        const end = new Date(`${event.StartDate}T${event.EndTimestamp}`).toISOString().replace(/-|:|\.\d+/g, '');
        const text = encodeURIComponent('Open House');
        const details = encodeURIComponent(`${event.comments}`);
        const location = encodeURIComponent(`Open House at ${getListing.CivicAddress.Value}`);
    
        return `https://www.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}&location=${location}`;
    }

  return (
    <div className='bg-grayLight p-2 text-xs md:text-sm lg:text-sm'>
        <div className='mb-2 relative'>
            {
                getListing && getListing.Photos.Value && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        

                    {(() => {
                            
                            const mainImageUrl = getListing.Photos && getListing.Photos.Value && getListing.Photos.Value.length > 0 ? getListing.Photos.Value[0].Value: '/images/dashboard/Squamish-1.jpg';
                            return (
                                <div className="col-span-2 row-span-2">
                                    <img className="h-full w-full object-fill rounded-lg" src={mainImageUrl} alt="Main Property Image" onClick={() => openImageModal(mainImageUrl, 0)} />
                                </div>
                            );
                        })()}
                        {(() => {
                            const imageUrl1 = getListing.Photos && getListing.Photos.Value && getListing.Photos.Value.length > 1 ? getListing.Photos.Value[1].Value : '/images/dashboard/Squamish-2.jpg';
                            return (
                                <div className="hidden md:block col-span-1 row-span-1">
                                    <img className="h-full w-full object-fill rounded-lg" src={imageUrl1} alt="Property Image 1" onClick={() => openImageModal(imageUrl1, 1)} />
                                </div>
                            );
                        })()}
                        {(() => {
                            const imageUrl2 =getListing.Photos && getListing.Photos.Value && getListing.Photos.Value.length > 2 ? getListing.Photos.Value[2].Value : '/images/dashboard/Squamish-3.jpg';
                            return (
                                <div className="hidden md:block col-span-1 row-span-1">
                                    <img className="h-full w-full object-fill rounded-lg" src={imageUrl2} alt="Property Image 2" onClick={() => openImageModal(imageUrl2, 2)} />
                                </div>
                            );
                        })()}
                    </div>
                
                )
            }           

            {getListing && getListing.Photos.Value && getListing.Photos.Value.length > 3 && (
                <button 
                    className="absolute bottom-4 right-4 bg-white text-brandDarker py-2 px-4 rounded-full shadow-lg flex items-center" 
                    onClick={() => openImageModal(getListing.Photos.Value[3].Value, 3)}
                >
                    <FaImage className="mr-2" /> 
                    <span className='hidden md:block'>{getListing.Photos.Value.length - 3} more</span>
                    <span className='md:hidden'>{getListing.Photos.Value.length - 1} more</span>
                </button>
            )}
             {selectedImage && enlargedPhotos && (
                <div className="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg p-8 w-7/12">
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
                                        <Image src={photo.Value || photo} alt={`Slide ${index}`} width={1000} height={600}></Image>
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
            
        </div>
        <div className='flex flex-col'>
            <div className='flex justify-end mb-2'>
                {landingUrl && <ShareMenu url={`https://squamish.realestate` +  landingUrl} />}
            </div>
            <div className='lg:flex'>
                <div className='lg:mr-5 mb-2'>
                    <div className='mb-2 text-base font-bold'>
                        <span className='inline-flex items-center text-brandDarker'><FaMapMarkerAlt className='mr-1'/>{getListing.CivicAddress.Value}</span>
                    </div>
                      
                    <div>
                        <span className="inline-flex items-center rounded-md bg-orange px-2 py-1 font-medium text-white ring-1 ring-inset ring-orange mr-2">{getListing.MLSNumber.Value}</span>
                        <span className="inline-flex items-center rounded-md bg-aqua px-2 py-1 font-medium text-white ring-1 ring-inset ring-aqua mr-2">{getListing.Status.Value}</span>
                        <span className='inline-flex px-2 py-1 items-center text-gray'><FaRegClock className='mr-2' />{getElapsedTime(getListing.ListingDate.Value)} on site</span>
                        <span className='inline-flex px-2 py-1 items-center text-gray'><FaEye className='mr-2' />{viewCount} views</span>
                    </div>
                    <div className='flex text-gray mt-4 justify-between'>
                        <div>
                            {/* <div className='flex'>
                                <FaMapMarkerAlt className='mr-1'/>
                                <p>{getListing.CivicAddress.Value}</p>
                            </div> */}
                            <p className='ml-1'>
                                {getListing.Status.Value === 'Pending' || getListing.Status.Value === 'Closed' ? (
                                    <p className='text-sm md:text-md lg:text-base '><span className='font-bold'>Sold Price: </span>{formatPrice(getListing.SoldPrice.Value)}</p>
                                ) : getListing.Status.Value === 'Active Under Contract' ? (
                                    <p className='text-sm md:text-md lg:text-base '><span className='font-bold'>Subject Removal Date: </span>{formatDateString(getListing.SubjectRemovalDate.Value)}</p>
                                ) : null}
                            </p>
                        </div>
                        <div className='ml-4'>
                            <p className='text-black font-bold tracking-wider text-xs md:text-lg lg:text-xl'>{formatPrice(getListing.AskingPrice.Value)}</p>
                            <p className='tracking-wider'>{formatPrice(Math.round(parseFloat(getListing.AskingPrice.Value) / parseFloat(getListing.TotalFloorArea.Value)))}/sf</p>
                        </div>
                    </div>
                    {
                    getListing.ListingRemarks.Value && getListing.ListingRemarks.Value !== 'None' ? (
                        <div className='p-2 pb-8 border-b-2 border-grayborder'>
                            <p className='text-black text-xs md:text-lg lg:text-lg'>Description</p>
                            <p className='text-gray tracking-wide leading-loose pt-2'>{getListing.ListingRemarks.Value}</p>
                        </div>
                    ) : (
                        <></>
                    )
                    }
                
                    <div className='p-2 pb-8 border-b-2 border-grayborder'>
                        <p className='text-xs md:text-lg lg:text-lg'>Features</p>
                        <div className='grid grid-cols-2 md:grid-cols-3 gap-5 pt-2'>
                        {
                            features.map((feature, index) => {
                                return (
                                    <div className="flex min-w-0 gap-x-4 border-gray" key={index}>
                                            <feature.icon className='w-4 h-4 md:h-6 md:w-6 flex-none text-brandDarker' />
                                            <div className="min-w-0 flex-auto">
                                                <p className="leading-tight uppercase">{feature.name}</p>
                                                <p className='mt-1 truncate leading-tight font-semibold'>{checkIfEmpty(feature.value)}</p>
                                            </div>
                                    </div>
                                )
                            })
                        }
                        </div>
                    </div>
                    <div className='p-2 pb-8 border-b-2 border-grayborder'>
                        <p className='text-xs md:text-lg lg:text-lg'>Amenities</p>
                        <div className='flex gap-10'>
                            {!listingType.includes('land') && getListing.Amenities.Value && getListing.Amenities.Value !== 'None' ? (
                                getListing.Amenities.Value.split(',').map((amenity, index) => (
                                <div className='flex' key={index}>
                                    <FaCheck className='mr-1 mt-1' />
                                    <span className='text-gray tracking-wide leading-loose'>{amenity}</span>
                                </div>
                                ))
                            ) : (
                                <span className='text-gray tracking-wide leading-loose p-2'>None</span>
                            )}
                        </div>

                    </div>
                    <div className='p-2 pb-8 text-right'>
                        <p className='text-xs md:text-sm'>Listing By <span className='font-bold italic'>{getListing.ListingOffice.Value}</span></p>
                    </div>
                    <div className='p-2 pb-8 flex items-center'>
                        <Image src='/images/mlsrlogo.png' alt='MLS Logo' width={300} height={300} />
                        <p className='text-xs md:text-sm pl-4'>This representation is based in whole or in part on data generated by the Chilliwack and District Real Estate Board, Fraser Valley Real Estate Board or Greater Vancouver REALTORS® which assume no responsibility for its accuracy </p>
                    </div>
                    <div className='p-2 mb-5'>
                        {
                            listingInfo.map((info, index) => (
                                <div className="collapse collapse-plus" key={index}>
                                    <input type="checkbox" name="listingInfo" className="peer" checked={isPrinting || openAccordions[index] || false} // Expands during print
                        onChange={() => toggleAccordion(index)} /> 
                                    <div className="collapse-title font-medium border-2 border-grayLight shadow-sm mb-2 peer-checked:bg-brandDarker peer-checked:text-white ">
                                        {info.name}
                                    </div>
                                    <div className="collapse-content border-2 border-grayLight bg-white mb-2 overflow-x-auto"> 
                                        {
                                            (info.name.includes('Floor Plans')) ? (
                                                floorPlanDocs && React.createElement(FloorPlans, { getProperty: getListing, propertyType: listingType, floorPlanDocs: floorPlanDocs})
                                            ) : (
                                                React.createElement(info.component, { getProperty: getListing, propertyType: listingType})
                                            )                                                
                                        }
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                
                    <div className='p-2 pb-8 border-b-2 border-grayborder'>
                        <p className='text-xs md:text-lg lg:text-lg'>Open Houses</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2 ">
                            {
                                openhouses && openhouses.length > 0 && openhouses.map((openHouse, index) => (
                                        <div className="bg-white shadow-md font-medium p-4 rounded-lg" key={index}>
                                            <p className="text-xs md:text-sm lg:text-sm text-brandDarker mb-2">{formatDate(openHouse.StartDate)}</p>
                                            <p className="text-xs md:text-sm lg:text-sm text-gray mb-2">{formatTime(openHouse.StartTimestamp)} - {formatTime(openHouse.EndTimestamp)}</p>
                                            <p className="text-xs md:text-sm lg:text-sm text-gray mb-2">{openHouse.Comments}</p>
                                            <a 
                                                href={createGoogleCalendarLink(openHouse)} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className='text-xs md:text-sm lg:text-sm underline text-brand'
                                            >
                                                Add to calendar
                                            </a>
                                        </div>
                                ))
                            }
                        </div>
                    </div>
                    {
                    getListing.VirtualTour.Value.includes('youtu.be') ? (
                        <>
                            <div className='p-2 pb-8 border-b-2 border-grayborder'>
                                <p className='text-xs md:text-lg lg:text-lg'>Virtual Tour</p>
                                <iframe
                                    width="100%"
                                    height="315"
                                    src = {`https://www.youtube.com/embed/${getListing.VirtualTour.Value.split('youtu.be/')[1]}`}
                                    title="YouTube video player"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    ></iframe>
                            </div>
                        </>
                    ) : getListing.VirtualTour.Value.includes('matterport') ? (
                        <>
                            <div className='p-2 pb-8 border-b-2 border-grayborder'>
                                <p className='text-xs md:text-lg lg:text-lg'>Virtual Tour</p>
                                <iframe
                                    width="100%"
                                    height="315"
                                    src = {getListing.VirtualTour.Value}
                                    title="YouTube video player"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    ></iframe>
                            </div>
                        </>
                    ) : (
                        <></>
                    )
                    }
                </div>
            </div>
        </div>
    </div>
  )
}
