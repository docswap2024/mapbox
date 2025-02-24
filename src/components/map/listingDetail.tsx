"use client";

import React, {useEffect, useState, useRef} from 'react'
import { FaRegClock, FaEye, FaMapMarkerAlt , FaHome, FaTools, FaThermometerFull, FaBed, FaBath, FaVectorSquare, FaParking, FaRulerCombined, FaCheck, FaImage, FaDollarSign, FaEllipsisV, FaCommentAlt, FaExclamationTriangle } from "react-icons/fa";
import {Tabs, Tab, LastSold, Photos, NearbyPhotos, BCAssessment, Taxes, SchoolPrograms, FloorPlans, ReviewForm, ReportIssue, NewListings, Reviews, PropertyReviews } from './helperComponents';
import { ShareMenu } from '../shareMenu';
import { useForm} from 'react-hook-form';
import Image from 'next/image';
import { Menu, Transition, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import { Fragment } from 'react'
import { getBathrooms, formatPrice, formatDate, checkUrl, formatTime } from '@/utils';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { useCustomContext } from '@/context/useState';
import { usePrint } from '@/context/printContext';
import { uploadOffer } from '@/db/server/actions/offer.action';
import { CompleteUser } from '@/db/schema';
import { me } from '@/db/server/actions/user.action';
import { sendEmail } from '@/lib/utils/send-email';
import axios from 'axios';

export const ListingDetail = ({getListing, listingType, landingUrl, listings}) => {
    const [floorPlanDocs, setFloorPlanDocs] = useState<any>([]);
    const [floorPlansCount, setFloorPlansCount] = useState<number>(0);
    const [selectedImage, setSelectedImage] = useState(null);
    const [enlargedPhotos, setEnlargedPhotos] = useState<any>([]);
    const enlargedCarouselRef = useRef<any>();
    const [selectedSlide, setSelectedSlide] = useState(0);
    const [openhouses, setOpenhouses] = useState<any>([]);
    const [openAccordions, setOpenAccordions] = useState({});
    const [scheduleTourDates, setScheduleTourDates] = useState<any>([]);
    const { isPrinting } = usePrint();
    const { currentUser, setCurrentUser } = useCustomContext();  
    const [newListings, setNewListings] = useState<any>([]);
    const [currentUserDetails, setCurrentUserDetails] = useState<CompleteUser | null>();
    const [showReportForm, setShowReportForm] = useState(false);
    const [averageRating, setAverageRating] = useState(0);
    const [reviewCount, setReviewCount] = useState(0);
    const [reviews, setReviews] = useState<any>([]);
    const reportRef = useRef<any>(null);
    const reviewsRef = useRef<any>(null);
    
    const toggleAccordion = (index) => {
        setOpenAccordions((prevState) => ({
            ...prevState,
            [index]: !prevState[index],
        }));
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

    const scrollToRef = (ref, value) => {
        ref?.current?.scrollIntoView({ behavior: 'smooth' });
        if (ref?.current instanceof HTMLInputElement) {
            ref.current.checked = true;
        }
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

        const getUserDetails = async () => {
            const user = await me();
            setCurrentUserDetails(user);
        }

        getUserDetails();

        const getReviews = async () => {
            try{
                const response = await axios.get(`/api/reviews/getReviewsByID/${getListing.PID.Value}`);
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
            console.log('openhouses')
            try {
                const response = await axios.get(`/api/openhouses/getOpenhouses/${getListing.ListingID.Value}`);
                console.log(response.data);
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
                    console.log(data);
                    setOpenhouses(data);
                }
            } catch (error) {
                console.log(error);
            }
        
        }

        getOpenhouses();

        const getTenLatestListings = (data) => {

            const copiedListings = data.filter(listing => (listing.Status.Value === 'Active' || listing.Status.Value === 'Active Under Contract'));
            const sortedListings = copiedListings.sort((a, b) => {
                const dateA = new Date(a.ListingDate.Value);
                const dateB = new Date(b.ListingDate.Value);
                return dateB.getTime() - dateA.getTime();
            });
            return sortedListings.slice(0, 10);
        
        }


        console.log(listings)
        setNewListings(getTenLatestListings(listings));

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

    const ScheduleTour = () => {
        const [scheduleTourMessage, setScheduleTourMessage] = useState('');
        const [currentSlide, setCurrentSlide] = useState(0);
        const [selectedDate, setSelectedDate] = useState(null);
        const [selectedHour, setSelectedHour] = useState('1');
        const [selectedMinute, setSelectedMinute] = useState('00');
        const [selectedAmPm, setSelectedAmPm] = useState('AM');
        const [loading, setLoading] = useState(false)
      
        const handleHourChange = (event) => {
          setSelectedHour(event.target.value);
        };
      
        const handleMinuteChange = (event) => {
          setSelectedMinute(event.target.value);
        };
      
        const handleAmPmChange = (event) => {
          setSelectedAmPm(event.target.value);
        };
      

        const { register: scheduleTourRegister, handleSubmit: handleScheduleTour, reset: scheduleTourReset, formState: { errors: scheduleTourErrors } } = useForm<scheduleTourFormData>();

        type scheduleTourFormData = {
            name: string,
            email: string,
            phone: string,
        }

        const onScheduleTour = async (data: scheduleTourFormData) => {
            setLoading(true)
            const phone = data.phone !== undefined && data.phone !== null && data.phone !== '' ? data.phone : 'N/A'
    
            const formData = {
                name: data.name,
                realtorEmail: currentUserDetails?.websiteOwners.email,
                info: `
                    <p style="font-weight: bold; font-size: 16px;">Thank You!</p>
                    <p style="font-size: 14px;">Your request for ${getListing.CivicAddress.Value} tour was submitted successfully. Here is a copy of your responses:</p>
                    <p style="font-weight: bold;">Name: <span class="value" style="font-weight: normal;">${data.name}</span></p>
                    <p style="font-weight: bold;">Email: <span class="value" style="font-weight: normal;">${data.email}</span></p>
                    <p style="font-weight: bold;">Phone: <span class="value" style="font-weight: normal;">${phone}</span></p>
                    <p style="font-weight: bold;">Date: <span class="value" style="font-weight: normal;">${selectedDate}</span></p>
                    <p style="font-weight: bold;">Time: <span class="value" style="font-weight: normal;">${selectedHour}:${selectedMinute} ${selectedAmPm}</span></p>
                `,
                userEmail: data.email
            }

            try {
                const response = await sendEmail(formData);
                setScheduleTourMessage(response.message);
                setLoading(false)
            } catch (error) {
                setScheduleTourMessage('Error sending email');
                setLoading(false)
            }
    
            const timer = setTimeout(() => {
                setScheduleTourMessage('');
                scheduleTourReset();
                
            }, 4000);
            return () => clearTimeout(timer);
        }

        const settings = {
            infinite: false,
            arrows: true,
            speed: 500,
            slidesToShow: 5,
            slidesToScroll: 1,
          };        

        return (
            <div className='p-5 pt-0'>
                <form onSubmit={handleScheduleTour(onScheduleTour)}>
                    <Slider {...settings} className='flex justify-around'>
                        {scheduleTourDates.map((date, index) => {
                            const dateObject = new Date(date);
                            const day = dateObject.toLocaleDateString('en-US', { weekday: 'short' });
                            const month = dateObject.toLocaleDateString('en-US', { month: 'short' });
                            const dayNumber = dateObject.toLocaleDateString('en-US', { day: 'numeric' });
                    
                            return (
                            <div className='md:p-2 pb-2' key={index} onClick={() => { setCurrentSlide(index); setSelectedDate(scheduleTourDates[index]);}}>
                                <div className={`items-center text-center shadow-md ${index === currentSlide ? 'border-2 border-brandDarker' : ''}`} key={index}>
                                    <div className="day text-gray">{day}</div>
                                    <div className="date font-bold">{dayNumber}</div>
                                    <div className="month text-gray">{month}</div>
                                </div>
                            </div>    
                            );
                        })}
                    </Slider>
                    <div className="block w-full rounded-md border-0 py-3 text-brandDarker focus:outline-grayborder bg-grayLight shadow-sm p-4 ring-1 ring-inset ring-grayborder placeholder:text-gray focus:bg-white focus:ring-grayborder sm:text-sm sm:leading-6 ">
                        <div className="flex">
                            <select name="hours" value={selectedHour} onChange={handleHourChange} className="bg-transparent appearance-none outline-none">
                                {Array.from({ length: 12 }, (_, index) => (
                                    <option key={index + 1} value={index + 1}>
                                    {index + 1}
                                    </option>
                                ))}
                            </select>
                            <span className="mr-2">:</span>
                            <select name="minutes"  value={selectedMinute} onChange={handleMinuteChange} className="bg-transparent appearance-none outline-none mr-4">
                                <option value="0">00</option>
                                <option value="15">15</option>
                                <option value="30">30</option>
                                <option value="45">45</option>
                            </select>
                            <select name="ampm" value={selectedAmPm} onChange={handleAmPmChange} className="bg-transparent appearance-none outline-none">
                                <option value="AM">AM</option>
                                <option value="PM">PM</option>
                            </select>
                        </div>
                    </div>
                    <div className="col-span-full">
                        <div className="mt-2">
                            <input type="text"  required={true} placeholder="Name *"  {...scheduleTourRegister('name', { required: true })} name="name" id="name" className="block w-full rounded-md border-0 py-3 text-brandDarker focus:outline-grayborder bg-grayLight shadow-sm p-4 ring-1 ring-inset ring-grayborder placeholder:text-gray focus:bg-white focus:ring-grayborder sm:text-sm sm:leading-6 " />
                        </div>
                    </div>
                    <div className="col-span-full">
                        <div className="mt-2">
                            <input type="text"  required={true} placeholder="Email *"  {...scheduleTourRegister('email', { required: true })} name="email" id="email" className="block w-full rounded-md border-0 py-3 text-brandDarker focus:outline-grayborder bg-grayLight shadow-sm p-4 ring-1 ring-inset ring-grayborder placeholder:text-gray focus:bg-white focus:ring-grayborder sm:text-sm sm:leading-6 " />
                        </div>
                    </div>
                    <div className="col-span-full">
                        <div className="mt-2">
                            <input type="text"  required={false} placeholder="Phone"  {...scheduleTourRegister('phone', { required: false })} name="phone" id="phone" className="block w-full rounded-md border-0 py-3 text-brandDarker focus:outline-grayborder bg-grayLight shadow-sm p-4 ring-1 ring-inset ring-grayborder placeholder:text-gray focus:bg-white focus:ring-grayborder sm:text-sm sm:leading-6 " />
                        </div>
                    </div>
                    {/* <div className="mt-6 space-y-6 mb-2">
                        <div className="relative flex gap-x-3">
                            <div className="flex h-6 items-center">
                                <input id="check" name="check" required type="checkbox" className="h-4 w-4 rounded border-gray focus:ring-gray" />
                            </div>
                            <div className="text-xs leading-6">
                                <label className="text-gray">
                                    I agree to Squamish.RealEstate <Link href="" target="_blank">terms of use</Link> and <Link href="" target="_blank">privacy terms and conditions</Link>.
                                </label>
                            </div>
                        </div>
                    </div> */}
                    <div>
                        {scheduleTourMessage && <div className='block font-bold text-gray pt-2 pb-2 pl-5'>{scheduleTourMessage}</div>}
                    </div>
                    <button className='btn bg-brandDark capitalize text-white text-xs md:text-sm w-full hover:opacity-80 hover:bg-brandDark mt-2' disabled={!currentUser}>
                        {loading ? (
                            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                        ) : (
                            "Schedule Tour"
                        )}
                    </button>

                    {!currentUser && (
                        <div className="mt-3 flex items-center border border-brandDarker text-brandDarker p-3 rounded-lg text-sm w-full">
                            <svg className="w-5 h-5 mr-2 text-brandDarker" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0zm-9-3a1 1 0 1 1 2 0v3a1 1 0 0 1-2 0V7zm1 6a1 1 0 1 1 0-2h.01a1 1 0 1 1 0 2H10z" clipRule="evenodd"/>
                            </svg>
                            <span>Please <strong>log in</strong> to schedule a tour.</span>
                        </div>
                    )}
                </form>
            </div>
        )
    }

    const RequestInfo = () => {
        const [requestMessage, setRequestMessage] = useState('');
        const [loading, setLoading] = useState(false);
        const { register: requestRegister, handleSubmit: handleRequest, reset: requestReset, formState: { errors: requestErrors } } = useForm<requestFormData>();

        type requestFormData = {
            name: string,
            email: string,
            phone: string,
            message: string
        }

        const onRequest = async (data: requestFormData) => {
            setLoading(true);
            const phone = data.phone !== undefined && data.phone !== null && data.phone !== '' ? data.phone : 'N/A'
            const message = data.message !== undefined && data.message !== null && data.message !== '' ? data.message : 'N/A'


    
            const formData = {
                name: data.name,
                realtorEmail: currentUserDetails?.websiteOwners.email,
                info: `
                    <p style="font-weight: bold; font-size: 16px;">Thank You!</p>
                    <p style="font-size: 14px;">Your request for ${getListing.CivicAddress.Value} was submitted successfully. Here is a copy of your responses:</p>
                    <p style="font-weight: bold;">Name: <span class="value" style="font-weight: normal;">${data.name}</span></p>
                    <p style="font-weight: bold;">Email: <span class="value" style="font-weight: normal;">${data.email}</span></p>
                    <p style="font-weight: bold;">Phone: <span class="value" style="font-weight: normal;">${phone}</span></p>
                    <p style="font-weight: bold;">Message: <span class="value" style="font-weight: normal;">${message}</span></p>
                `,
                userEmail: data.email
            }
    
            try {
                const response = await sendEmail(formData);
                setRequestMessage(response.message);
                setLoading(false)
            } catch (error) {
                setRequestMessage('Error sending email');
                setLoading(false)
            }

            const timer = setTimeout(() => {
                setRequestMessage('');
                requestReset();
                
            }, 4000);
            return () => clearTimeout(timer);
        }

        return (
            <div className='pl-5 pr-5'>
                <div className="group relative flex items-center gap-x-6 text-xs md:text-sm lg:text-md leading-6 hover:bg-gray-50 pb-4  border-b-2 border-grayborder">
                    <div className="flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white">
                        <img src="https://sr-webimages-002.s3.us-west-2.amazonaws.com/images/realtors/SEANB-140x.jpg" alt="" />
                    </div>
                    <div className="flex-auto">
                        <p className="block font-semibold text-black">
                        {currentUserDetails?.websiteOwners.name}
                        <span className="absolute inset-0"></span>
                        </p>
                        <p className="text-xs mt-3 text-graylight">PERSONAL REAL ESTATE CORP </p>
                        <p className="text-xs text-graylight">{currentUserDetails?.websiteOwners.email}</p>
                    </div>
                </div>
                <form onSubmit={handleRequest(onRequest)}>
                    <div className="col-span-full">
                        <div className="mt-2">
                            <input type="text"  required={true} placeholder="Name *"  {...requestRegister('name', { required: true })} name="name" id="name" className="block w-full rounded-md border-0 py-3 text-brandDarker focus:outline-grayborder bg-grayLight shadow-sm p-4 ring-1 ring-inset ring-grayborder placeholder:text-gray focus:bg-white focus:ring-grayborder sm:text-sm sm:leading-6 " />
                        </div>
                    </div>
                    <div className="col-span-full">
                        <div className="mt-2">
                            <input type="text"  required={true} placeholder="Email *"  {...requestRegister('email', { required: true })} name="email" id="email" className="block w-full rounded-md border-0 py-3 text-brandDarker focus:outline-grayborder bg-grayLight shadow-sm p-4 ring-1 ring-inset ring-grayborder placeholder:text-gray focus:bg-white focus:ring-grayborder sm:text-sm sm:leading-6 " />
                        </div>
                    </div>
                    <div className="col-span-full">
                        <div className="mt-2">
                            <input type="text"  required={false} placeholder="Phone"  {...requestRegister('phone', { required: false })} name="phone" id="phone" className="block w-full rounded-md border-0 py-3 text-brandDarker focus:outline-grayborder bg-grayLight shadow-sm p-4 ring-1 ring-inset ring-grayborder placeholder:text-gray focus:bg-white focus:ring-grayborder sm:text-sm sm:leading-6 " />
                        </div>
                    </div>
                    <div className="col-span-full mb-2">
                        <div className="mt-2">
                            <textarea id="message" placeholder="" {...requestRegister('message', { required: false })} name="message" rows={5} className="block w-full rounded-md border-0 py-3 text-brandDarker focus:outline-grayborder bg-grayLight shadow-sm p-4 ring-1 ring-inset ring-grayborder placeholder:text-gray focus:bg-white focus:ring-grayborder sm:text-sm sm:leading-6"></textarea>
                        </div>
                    </div>
                    <div>
                        {requestMessage && <div className='block font-bold text-gray pt-2 pb-2 pl-5'>{requestMessage}</div>}
                    </div>
                    <button className='btn bg-brandDark capitalize text-white text-xs md:text-sm w-full hover:opacity-80 hover:bg-brandDark' disabled={!currentUser}>
                        {loading ? (
                            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                        ) : (
                            "Request Info"
                        )}
                    </button>
                    {!currentUser && (
                        <div className="mt-3 flex items-center border border-brandDarker text-brandDarker p-3 rounded-lg text-sm w-full">
                            <svg className="w-5 h-5 mr-2 text-brandDarker" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0zm-9-3a1 1 0 1 1 2 0v3a1 1 0 0 1-2 0V7zm1 6a1 1 0 1 1 0-2h.01a1 1 0 1 1 0 2H10z" clipRule="evenodd"/>
                            </svg>
                            <span>Please <strong>log in</strong> to request Info.</span>
                        </div>
                    )}
                </form>
            </div>
        )
    }

    const StartOffer = () => {
        const [startOfferMessage, setStartOfferMessage] = useState('');
        const [loading, setLoading] = useState(false);
        const { register: startOfferRegister, handleSubmit: handleStartOffer ,reset: startOfferReset, formState: { errors: startOfferErrors } } = useForm<startOfferFormData>();

        type startOfferFormData = {
            name: string,
            email: string,
            phone: string,
            purchasePrice: string,
            depositAmount: string,
            message: string
        }

        

        const onStartOffer = async (data: startOfferFormData) => {
            setLoading(true);

            const phone = data.phone !== undefined && data.phone !== null && data.phone !== '' ? data.phone : 'N/A'
            const message = data.message !== undefined && data.message !== null && data.message !== '' ? data.message : 'N/A'

            const startOfferResponse = await uploadOffer({
                ...data,
                userId: currentUser.id,
                pid: getListing.PID.Value
            });


            const formData = {
                name: data.name,
                realtorEmail: currentUserDetails?.websiteOwners.email,
                info: `
                    <p style="font-weight: bold; font-size: 16px;">Thank You!</p>
                    <p style="font-size: 14px;">Your offer for ${getListing.CivicAddress.Value} was submitted successfully. Here is a copy of your responses:</p>
                    <p style="font-weight: bold;">Name: <span class="value" style="font-weight: normal;">${data.name}</span></p>
                    <p style="font-weight: bold;">Email: <span class="value" style="font-weight: normal;">${data.email}</span></p>
                    <p style="font-weight: bold;">Purchase Price: <span class="value" style="font-weight: normal;">${data.purchasePrice}</span></p>
                    <p style="font-weight: bold;">Deposit Amount: <span class="value" style="font-weight: normal;">${data.depositAmount}</span></p>
                    <p style="font-weight: bold;">Phone: <span class="value" style="font-weight: normal;">${phone}</span></p>
                    <p style="font-weight: bold;">Message: <span class="value" style="font-weight: normal;">${message}</span></p>
                `,
                userEmail: data.email
            }
            try {
                const response = await sendEmail(formData);
                setStartOfferMessage('Offer submitted successfully. Check your email for a copy of your response')
                setLoading(false)
            } catch (error) {
                setStartOfferMessage('Error sending email');
                setLoading(false)
            }

            const timer = setTimeout(() => {
                setStartOfferMessage('');
                startOfferReset();
                
            }, 3000);
            return () => clearTimeout(timer);

            
        }

        
        return (
            <div className='pl-5 pr-5'>
                <div className="group relative flex items-center gap-x-6 text-xs md:text-sm lg:text-md leading-6 hover:bg-gray-50 pb-4  border-b-2 border-grayborder">
                    <div className="flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white">
                        <img src="https://sr-webimages-002.s3.us-west-2.amazonaws.com/images/realtors/SEANB-140x.jpg" alt="" />
                    </div>
                    <div className="flex-auto">
                        <p className="block font-semibold text-black">
                          {currentUserDetails?.websiteOwners.name}
                        <span className="absolute inset-0"></span>
                        </p>
                        <p className="text-xs mt-3 text-graylight">PERSONAL REAL ESTATE CORP </p>
                        <p className="text-xs text-graylight">{currentUserDetails?.websiteOwners.email}</p>
                    </div>
                </div>
                <form onSubmit={handleStartOffer(onStartOffer)}>
                    <div className="col-span-full">
                        <div className="mt-2">
                            <input type="text"  required={true} placeholder="Name *"  {...startOfferRegister('name', { required: true })} name="name" id="name" className="block w-full rounded-md border-0 py-3 text-brandDarker focus:outline-grayborder bg-grayLight shadow-sm p-4 ring-1 ring-inset ring-grayborder placeholder:text-gray focus:bg-white focus:ring-grayborder sm:text-sm sm:leading-6 " />
                        </div>
                    </div>
                    <div className="col-span-full">
                        <div className="mt-2">
                            <input type="text"  required={true} placeholder="Email *"  {...startOfferRegister('email', { required: true })} name="email" id="email" className="block w-full rounded-md border-0 py-3 text-brandDarker focus:outline-grayborder bg-grayLight shadow-sm p-4 ring-1 ring-inset ring-grayborder placeholder:text-gray focus:bg-white focus:ring-grayborder sm:text-sm sm:leading-6 " />
                        </div>
                    </div>
                    <div className="col-span-full">
                        <div className="mt-2">
                            <input type="text"  required={false} placeholder="Phone"  {...startOfferRegister('phone', { required: false })} name="phone" id="phone" className="block w-full rounded-md border-0 py-3 text-brandDarker focus:outline-grayborder bg-grayLight shadow-sm p-4 ring-1 ring-inset ring-grayborder placeholder:text-gray focus:bg-white focus:ring-grayborder sm:text-sm sm:leading-6 " />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                            <div className="mt-2">
                                <input type="text" id="purchasePrice"  required={true} placeholder="Purchase Price" {...startOfferRegister('purchasePrice', { required: true })} className="block w-full rounded-md border-0 py-3 text-brandDarker focus:outline-grayborder bg-grayLight shadow-sm p-4 ring-1 ring-inset ring-grayborder placeholder:text-gray focus:bg-white focus:ring-grayborder sm:text-sm sm:leading-6 " />
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <div className="mt-2">
                                <input type="text" id="deposit" required={true}  placeholder='Deposit Amount'  {...startOfferRegister('depositAmount', { required: true })} className="block w-full rounded-md border-0 py-3 text-brandDarker focus:outline-grayborder bg-grayLight shadow-sm p-4 ring-1 ring-inset ring-grayborder placeholder:text-gray focus:bg-white focus:ring-grayborder sm:text-sm sm:leading-6 " />
                            </div>
                        </div>
                    </div>
                    <div className="col-span-full mb-2">
                        <div className="mt-2">
                            <textarea id="message" placeholder="" {...startOfferRegister('message', { required: false })} name="message" rows={5} className="block w-full rounded-md border-0 py-3 text-brandDarker focus:outline-grayborder bg-grayLight shadow-sm p-4 ring-1 ring-inset ring-grayborder placeholder:text-gray focus:bg-white focus:ring-grayborder sm:text-sm sm:leading-6"></textarea>
                        </div>
                    </div>
                    {/* <div className="mt-6 space-y-6 mb-2">
                        <div className="relative flex gap-x-3">
                            <div className="flex h-6 items-center">
                                <input id="check" name="check" required type="checkbox" className="h-4 w-4 rounded border-gray focus:ring-gray" />
                            </div>
                            <div className="text-xs leading-6">
                                <label className="text-gray">
                                    I agree to Squamish.RealEstate <Link href="" target="_blank">terms of use</Link> and <Link href="" target="_blank">privacy terms and conditions</Link>.
                                </label>
                            </div>
                        </div>
                    </div> */}
                    <div>
                        {startOfferMessage && <div className='block font-bold text-gray pt-2 pb-2 pl-5'>{startOfferMessage}</div>}
                    </div>
                    <button className='btn bg-brandDark capitalize text-white text-xs md:text-sm w-full hover:opacity-80 hover:bg-brandDark' disabled={!currentUser}>
                        {loading ? (
                            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                        ) : (
                            "Make Offer"
                        )}
                    </button>

                    {!currentUser && (
                        <div className="mt-3 flex items-center border border-brandDarker text-brandDarker p-3 rounded-lg text-sm w-full">
                            <svg className="w-5 h-5 mr-2 text-brandDarker" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0zm-9-3a1 1 0 1 1 2 0v3a1 1 0 0 1-2 0V7zm1 6a1 1 0 1 1 0-2h.01a1 1 0 1 1 0 2H10z" clipRule="evenodd"/>
                            </svg>
                            <span>Please <strong>log in</strong> to make an offer.</span>
                        </div>
                    )}
                </form>
            </div>
        )
    }

    const listingExplorer = [
        {name: 'Schedule Tour', component: ScheduleTour},
        {name: 'Request Info', component: RequestInfo},
        {name: 'Start Offer', component: StartOffer}
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

    function classNames(...classes) {
        return classes.filter(Boolean).join(' ')
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

            <div className='absolute bottom-4 left-4'>
                {
                    reviewCount == 0 ? (
                        <></>
                    ) : (
                        <div className='flex lg:mb-4 items-center bg-white rounded-md py-2 px-4'>
                            <Reviews averageRating={averageRating} reviewCount={reviewCount}/>
                        </div>
                    )
                }
            </div>        

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
                <Menu as="div" className={`inline-block text-left`}>
                        <div>
                            <MenuButton className={`inline-flex w-full justify-center gap-x-1.5 md:bg-brandDark text-white md:pl-4 md:pr-4 pt-2 pb-2 rounded-md text-xs md:text-sm lg:text-md hover:opacity-80 md:hover:bg-brandDarker`}>
                            <span className='hidden md:inline'>More</span>
                            <FaEllipsisV className="-mr-1 h-5 w-5 text-brand" aria-hidden="true" />
                            </MenuButton>
                        </div>
                        <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                        >
                            <MenuItems className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <div className="py-1">
                                <MenuItem>
                                    {({ active }) => (
                                        <div className={classNames(active ? 'bg-grayLight text-brandDarker' : 'text-brandDarker', 'flex items-center px-4 py-2 text-sm')} onClick={() => scrollToRef(reviewsRef, '')}>
                                        <FaCommentAlt  className="mr-2" />
                                        Write a Review
                                        </div>
                                    )}
                                </MenuItem>
                                <MenuItem>
                                    {({ active }) => (
                                        <div className={classNames(active ? 'bg-grayLight text-brandDarker' : 'text-brandDarker', 'flex items-center px-4 py-2 text-sm')}   onClick={() => { setShowReportForm(true); scrollToRef(reportRef, ''); }}>
                                        <FaExclamationTriangle className="mr-2" />
                                        Report
                                        </div>
                                    )}
                                </MenuItem>
                            </div>
                            </MenuItems>
                        </Transition>
                    </Menu>
            </div>
            <div className='lg:flex'>
                <div className='lg:w-3/5 lg:mr-5 mb-2'>
                    <div className='mb-2 text-base font-bold'>
                        <span className='inline-flex items-center text-brandDarker'><FaMapMarkerAlt className='mr-1'/>{getListing.CivicAddress.Value}</span>
                    </div>
                      
                    <div>
                        <span className="inline-flex items-center rounded-md bg-orange px-2 py-1 font-medium text-white ring-1 ring-inset ring-orange mr-2">{getListing.MLSNumber.Value}</span>
                        <span className="inline-flex items-center rounded-md bg-aqua px-2 py-1 font-medium text-white ring-1 ring-inset ring-aqua mr-2">{getListing.Status.Value}</span>
                        <span className='inline-flex px-2 py-1 items-center text-gray'><FaRegClock className='mr-2' />{getElapsedTime(getListing.ListingDate.Value)} on site</span>
                    </div>
                    <div className='flex text-gray mt-4 justify-between'>
                        <div>
                            {/* <div className='flex'>
                                <FaMapMarkerAlt className='mr-1'/>
                                <p>{getListing.CivicAddress.Value}</p>
                            </div> */}
                            <div className='ml-1'>
                                {getListing.Status.Value === 'Pending' || getListing.Status.Value === 'Closed' ? (
                                    <p className='text-sm md:text-md lg:text-base '><span className='font-bold'>Sold Price: </span>{formatPrice(getListing.SoldPrice.Value)}</p>
                                ) : getListing.Status.Value === 'Active Under Contract' ? (
                                    <p className='text-sm md:text-md lg:text-base '><span className='font-bold'>Subject Removal Date: </span>{formatDateString(getListing.SubjectRemovalDate.Value)}</p>
                                ) : null}
                            </div>
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

                    <div className='p-2 pb-8 border-b-2 border-grayborder'>
                        <div className='text-xs md:text-lg lg:text-lg'>
                            Reviews ({reviews?.filter(review => review.Approved === 'True').length || 0})
                        </div>
                        {   
                        
                            reviews && <PropertyReviews reviews={reviews} getProperty={getListing} propertyType={listingType} /> 
                        }

                    </div>

                    <div ref={reviewsRef} className='p-2 pb-8 border-b-2 border-grayborder'>
                        <div className='text-xs md:text-lg lg:text-lg'>
                            Add Listing Review
                        </div>
                        <div className='bg-white shadow-md text-[#666666] font-medium mb-5 mt-4'>
                        <ReviewForm getProperty={getListing} user={currentUserDetails} />
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
                <div className='flex flex-col lg:w-2/5'>
                    <div className='bg-white p-2 shadow-md mb-5 text-black'>
                        <Tabs>
                            {
                                listingExplorer.map((info, index) => (
                                    <Tab label={info.name} key={index}>
                                        <div className="py-4">
                                            {
                                                React.createElement(info.component)
                                            }
                                        </div>
                                    </Tab>
                                ))
                            }
                        </Tabs>
                    </div>
                    {newListings && 
                        (
                            <div className="p-6 rounded-lg bg-white shadow-md mb-5 justify-between text-xs">
                            <p className="mb-2 lg:text-lg font-semibold tracking-tight">Latest Listings</p>
                            <NewListings newListings={newListings} propertyType={listingType} />
                            </div>
                        )
                        
                    }
                    <ReportIssue user={currentUserDetails} getProperty={getListing} showReportForm={showReportForm} setShowReportForm={setShowReportForm} reportRef={reportRef}/>
                </div>
            </div>
        </div>
    </div>
  )
}
