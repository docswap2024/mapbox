"use client";

import Image from 'next/image';
import React, {useState, useRef, useEffect, Fragment} from 'react';
import {styles} from './propertyDetailsStyle';
import {Tabs, Tab, LastSold, Photos, NearbyPhotos, BCAssessment, Taxes, SchoolPrograms, NewListings, RecentSolds, FloorPlans, HonestDoorPriceChart, ReportIssue, Reviews, ReviewForm, PropertyReviews} from './helperComponents';
import {FaArrowLeft, FaBed, FaBath, FaArrowsAlt, FaClock, FaLandmark, FaDollarSign, FaRegChartBar, FaCommentDollar, FaBriefcase, FaHome, FaInfo, FaImage, FaChartLine, FaSchool, FaMoneyCheckAlt, FaEllipsisV, FaCommentAlt, FaExclamationTriangle } from 'react-icons/fa';
import HDWidgetComponent from './HDWidgetComponent';
import { Menu, Transition } from '@headlessui/react';
import HDMyHomeWidgetComponent from './HDMyHomeWidgetComponent';
import { useRouter, usePathname } from 'next/navigation';
import {ShareMenu} from '@/components/shareMenu';
import axios from 'axios';
import { formatCurrentHonestDoorPrice } from '@/utils';
import { CompleteUser } from '@/db/schema';
import { formatString } from '@/utils';
import { me } from '@/db/server/actions/user.action';
import {checkUrl} from '@/utils/';
import { usePrint } from '@/context/printContext';

export const PropertyDetail = ({getProperty, propertyType, listings}) =>{
    const router = useRouter();
    const pathname = usePathname();
    const [landingImage, setLandingImage] = useState(''); 
    const detailsRef = useRef<any>(null);
    const salesHistoryRef = useRef<any>(null);
    const photosRef = useRef<any>(null);
    const nearbyPhotosRef = useRef<any>(null);
    const honestDoorPriceHistoryRef = useRef<any>(null);
    const floorPlansRef = useRef<any>(null);
    const bcAssessmentRef = useRef<any>(null);
    const taxesRef = useRef<any>(null);
    const reportRef = useRef<any>(null);
    const schoolProgramsRef = useRef<any>(null);
    const yearConstructed = getProperty.YearConstructed.Value;
    const age = yearConstructed === '0' ? '-' : (new Date().getFullYear() - parseInt(yearConstructed)).toString();
    const [currentUserDetails, setCurrentUserDetails] = useState<CompleteUser | null>();
    const [showReportForm, setShowReportForm] = useState(false);
    const [newListings, setNewListings] = useState<any>([]);
    const [recentSoldListings, setRecentSoldListings] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [floorPlanDocs, setFloorPlanDocs] = useState<any>([]);
    const [floorPlansCount, setFloorPlansCount] = useState(0);
    const [honestDoorLastUpdated, setHonestDoorLastUpdated] = useState("N/A");
    const [unformattedHonestDoorPrice, setUnformattedHonestDoorPrice] = useState(0);
    const [honestDoorPrice, setHonestDoorPrice] = useState("N/A");
    const [honestDoorCurrentPrice, setHonestDoorCurrentPrice] = useState("Coming Soon");
    const [HonestDoorURL, setHonestDoorUrl] = useState('');
    const [streetAverage, setStreetAverage] = useState("N/A");
    const [openAccordions, setOpenAccordions] = useState({});
    const [reviews, setReviews] = useState<any>([]);
    const [averageRating, setAverageRating] = useState(0);
    const [reviewCount, setReviewCount] = useState(0);
    const { isPrinting } = usePrint();
    const reviewsRef = useRef<any>(null);
    
    
    const toggleAccordion = (index) => {
        setOpenAccordions((prevState) => ({
            ...prevState,
            [index]: !prevState[index],
        }));
    };


    const handleItemClick = (value) => {
        setSelectedItem(value);
    };

    useEffect(() => {
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

        var landing_image = ''

        if(propertyType === 'detached') {
            var bucket = 'https://sr-webimages-002.s3.us-west-2.amazonaws.com/Streetview/'
            var civic_address = getProperty.CivicAddress.Value.split(' ')
            civic_address[1] = civic_address[1][0].toUpperCase() + civic_address[1].slice(1).toLowerCase()
            landing_image = bucket + civic_address[1] + '/landing/' + civic_address[0] + '-' + civic_address[1] + '.jpg'
            fetchImage(landing_image)
                .then(result => {
                if (result === 'no-image-found') {
                    setLandingImage('https://sr-webimages-002.s3.us-west-2.amazonaws.com/strata/default/6.jpg');
                }
                else {
                    setLandingImage(result);
                }
            });
        } else {
            const bucket = 'https://sr-webimages-002.s3.us-west-2.amazonaws.com/strata/'
            const gisid = getProperty.GISID.Value
            const cleanedAddress = getProperty.CivicAddress.Value.replace('-', ' ').replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase().split(' ');
            cleanedAddress[2] = cleanedAddress[2][0].toUpperCase() + cleanedAddress[2].slice(1).toLowerCase();
            const address = cleanedAddress[0] + '-' + cleanedAddress[1] + '-' + cleanedAddress[2];
            landing_image = bucket + gisid + '/landing/' + address + '.jpg'
            fetchImage(landing_image)
                .then (result => {
                    if (result === 'no-image-found') {
                        const randomNumber = Math.floor(Math.random() * (6 - 1 + 1)) + 1;
                        landing_image = bucket + gisid + '/' + randomNumber + '.jpg'
                        fetchImage(landing_image)
                        .then(result => {
                            if (result === 'no-image-found') {
                                setLandingImage('https://sr-webimages-002.s3.us-west-2.amazonaws.com/strata/default/6.jpg');
                            }
                            else {
                                setLandingImage(result);
                            }
                        });
                    }
                    else {
                        setLandingImage(result);
                    }
            });
        }

        const getTenLatestListings = (data) => {

            const copiedListings = data.filter(listing => (listing.Status.Value === 'Active' || listing.Status.Value === 'Active Under Contract'));
            const sortedListings = copiedListings.sort((a, b) => {
                const dateA = new Date(a.ListingDate.Value);
                const dateB = new Date(b.ListingDate.Value);
                return dateB.getTime() - dateA.getTime();
            });
            return sortedListings.slice(0, 10);
        
        }


        setNewListings(getTenLatestListings(listings));

        const getTenRecentSolds = (data) => {
            const sortedListings = data.sort((a, b) => {
                const dateA = new Date(a.LastMLSDate.Value);
                const dateB = new Date(b.LastMLSDate.Value);
                return dateB.getTime() - dateA.getTime();
            });
            return sortedListings.slice(0, 10);
        
        }

        const fetchRecentSoldListings = async () => {
            if (propertyType === 'strata') {
                try {
                    const response = await axios.get(`/api/property/strata/getSoldStrata`);
                    const data = await response.data;
                    if (data.length > 0) {
                        setRecentSoldListings(getTenRecentSolds(data));
                    } 
                } catch (error) {
                    console.log(error);
                }
            } else {
                try {
                    const response = await axios.get(`/api/property/parcels/getSoldParcels`);
                    const data = await response.data;
                    if (data.length > 0) {
                        setRecentSoldListings(getTenRecentSolds(data));
                    } 
                } catch (error) {
                    console.log(error);
                }
            }
        }

        fetchRecentSoldListings();

        async function getFloorPlanDocs(civicAddress: string){
            const BASE_BUCKET_URL = 'https://sr-webimages-002.s3.us-west-2.amazonaws.com/';
            const FLOOR_PLAN_CHECK_LIMIT = 10;
            civicAddress = civicAddress.replace(/-/g, ' ');
            var civic_address = civicAddress.split(' ')
            
            const FILE_EXTENSION = '.png';
            const documents: { url: string; fileName: string }[] = [];
          
            for (let i = 1; i <= FLOOR_PLAN_CHECK_LIMIT; i++) {
                let potentialUrl;
                if(propertyType === 'strata'){
                    civic_address[0] = civic_address[0].replace(/,/g, '');
                    civic_address[2] = civic_address[2][0].toUpperCase() + civic_address[2].slice(1).toLowerCase()
                    potentialUrl = `${BASE_BUCKET_URL}strata/${getProperty.GISID.Value}/fp/${civic_address[0]}-${civic_address[1]}-${civic_address[2]}-Floor-Plan-${i}${FILE_EXTENSION}`;
                } else {
                    if (!isNaN(Number(civic_address[1]))) {
                        civic_address[2] = civic_address[2][0].toUpperCase() + civic_address[2].slice(1).toLowerCase()
                        potentialUrl = `${BASE_BUCKET_URL}Streetview/${civic_address[2]}/fp/${civic_address[0]}-${civic_address[1]}-${civic_address[2]}-Floor-Plan-${i}${FILE_EXTENSION}`;
                    } else {
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
      
        const fetchFloorPlanDocs = async () => {
            try {
                console.log(getProperty.CivicAddress.Value)
                const floorPlanDocs = await getFloorPlanDocs(getProperty.CivicAddress.Value);
                setFloorPlanDocs(floorPlanDocs);
                setFloorPlansCount(floorPlanDocs.length);
            } catch (error) {
                console.log('Error fetching floor plan documents:', error);
            }
        };
    
        fetchFloorPlanDocs();

        const fetchHonestDoorPrice = async () => {
            try {
                let response;
                if (propertyType === 'strata') {
                    response = await axios.get(`/api/honestdoor-price/strata/${getProperty.PID.Value}`);
                } else if (propertyType === 'detached') {
                    response = await axios.get(`/api/honestdoor-price/parcels/${getProperty.PID.Value}`);
                }

                if (response.data && response.data.CurrentPrice && response.data.CurrentPrice.Value && !isNaN(response.data.CurrentPrice.Value)) {
                    const priceWithDate = formatCurrentHonestDoorPrice(response.data.CurrentPrice.Value, response.data.CurrentMonth.Value)
                    setUnformattedHonestDoorPrice(response.data.CurrentPrice.Value);
                    setHonestDoorLastUpdated(response.data.LastUpdated.Value);
                    setHonestDoorCurrentPrice(priceWithDate);
                    setHonestDoorPrice(response.data);
                    setHonestDoorUrl(response.data.HonestDoorURL.Value);
                }
            } catch (error) {
                console.log('Error fetching Honest Door Price:', error);
            }
        }
        
        fetchHonestDoorPrice();


        const fetchStreetAverage = async () => {
            if (propertyType === 'strata') {
                try {
                    const response = await axios.get(`/api/street-average/strata/${getProperty.GISID.Value}`);
                    const data = response.data;
                    if (data) {
                        setStreetAverage(data);
                    }
                } catch (error) {
                    console.log(error);
                }
            }
            if (propertyType === 'detached') {
                try {
                    const response = await axios.get(`/api/street-average/parcels/${getProperty.Street.Value}`);
                    const data = response.data;
                    if (data) {
                        setStreetAverage(data);
                    }
                } catch (error) {
                    console.log(error);
                }
            }

        }

        fetchStreetAverage();

        const getUserDetails = async () => {
            const user = await me();
            setCurrentUserDetails(user);
        }
        
        getUserDetails();

        const getReviews = async () => {
            try{
                const response = await axios.get(`/api/forms/reviews/getReviewsByID/${getProperty.PID.Value}`);
                let data = await response.data;
                if (data) {
                    console.log(data);
                    data = data.filter(review => review.Approved === 'True');
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
        
    }, [])

    const numberWithCommas = (input: string | number) => {
        const number = typeof input === 'string' ? parseFloat(input.replace(/,/g, '')) : Number(input);
        return number.toLocaleString('en-US');
    };

    const formatDate = (inputDate) => {
        if(!inputDate) return 'N/A';
        const months = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const [year, month, day] = inputDate.split('-').map(Number);
      
        return `${day} ${months[month - 1]}, ${year}`;
    }; 

    const formatTax = (inputTax) => {
        const [number, info] = inputTax.split(" ");
        const roundedNumber = Math.round(parseFloat(number) * 100) / 100;
        return `${roundedNumber.toFixed(2)} ${info}`;
    }

    const appreciation = () => {
        if (honestDoorCurrentPrice === "Coming Soon" || unformattedHonestDoorPrice === 0 || getProperty.MLSData.Value === "[]") {
            return "Coming Soon";
        } else { 
            const propertyInfoArray: any[] = JSON.parse(getProperty.MLSData.Value);
            const lastSoldPrice = propertyInfoArray[0].Price;
            const lastSoldDate = new Date(propertyInfoArray[0].Date);
            const honestDoorDate = new Date(honestDoorLastUpdated);

            const timeDifference = Math.abs(lastSoldDate.getTime() - honestDoorDate.getTime()); 

            const millisecondsInYear = 1000 * 60 * 60 * 24 * 365.25; 
            const differenceInYears = (timeDifference / millisecondsInYear);

            const appreciation = ((( (unformattedHonestDoorPrice - lastSoldPrice) * 100 ) / lastSoldPrice) / differenceInYears).toFixed(2);
            return `${appreciation}%`;
        }
    }

    const labelData = [
        { label: "Sales History", value: "sales history", icon: FaInfo, ref: salesHistoryRef },
        { label: "Photos", value: "photos", icon: FaImage, ref: photosRef },
        { label: "HonestDoor Price", value: "honestdoor price history", icon: FaChartLine, ref: honestDoorPriceHistoryRef },
        { label: "BC Assessment", value: "bc assessment", icon: FaMoneyCheckAlt, ref: bcAssessmentRef },
        { label: "Taxes", value: "taxes", icon: FaLandmark, ref: taxesRef },
        { label: "Schools", value: "school programs", icon: FaSchool, ref: schoolProgramsRef },
    ];

    const propertyDetails = [
        {name: 'Bedrooms', value: getProperty.Bedrooms.Value, icon: FaBed},
        {name: 'Bathrooms', value: getProperty.Bathrooms.Value, icon: FaBath},
        {name: 'Floor Area', value: `${numberWithCommas(getProperty.FloorArea.Value)} sf`, icon: FaArrowsAlt},
        {name: 'Age', value: age, icon: FaClock},
        {name: 'Tax', value: `$ ${formatTax(getProperty.TaxPaid.Value)}`, icon: FaLandmark},
        {name: 'Tax Trend', value: getProperty.TaxTrend.Value, icon: FaDollarSign},
        {name: 'Assessment Trend', value: getProperty.BCAssessmentTrend.Value, icon: FaRegChartBar},
        {name: 'Property Size', value: `${numberWithCommas(getProperty.LotSize.Value)} sf`, icon: FaArrowsAlt},
        {name: 'Market Status', value: getProperty.MarketStatus.Value, icon: FaChartLine},
        {name: 'HonestDoor Price', value: honestDoorCurrentPrice, icon: FaCommentDollar, href: HonestDoorURL },
        {name: 'Street Average', value: streetAverage, icon: FaBriefcase},
        {name: 'Appreciation/year', value:  appreciation(), icon: FaHome},
    ]

    const propertyInfo = [
        {name: `Last Sold: ${formatDate(getProperty.LastMLSDate.Value)}`, component: LastSold, ref: salesHistoryRef},
        {name: `Photos (${getProperty.Photos.Value.length})`, component: Photos, ref: photosRef},
        {name: `Floor Plans (${floorPlansCount})`, component: FloorPlans, ref: floorPlansRef},
        {name: 'Nearby Photos', component: NearbyPhotos, ref: nearbyPhotosRef},
        {name: 'HonestDoor Price History', component: NearbyPhotos, ref: honestDoorPriceHistoryRef},
        {name: 'BC Assessment', component: BCAssessment, ref: bcAssessmentRef},
        {name: 'Taxes', component: Taxes, ref: taxesRef},
        {name: 'School Programs', component: SchoolPrograms, ref: schoolProgramsRef},
    ]

    const propertyExplorer = [
        {name: 'New Listings', component: NewListings},
        {name: 'Recent Solds', component: RecentSolds},
    ]


    const checkIfEmpty = (input: string | number) => {
        if (input === 0 || input === "0" || input === "" || input === "0 sf") {
          return "-";
        } else {
          return input;
        }
    };

    const scrollToRef = (ref, value) => {
        ref?.current?.scrollIntoView({ behavior: 'smooth' });
        if (ref?.current instanceof HTMLInputElement) {
            ref.current.checked = true;
        }
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
    function classNames(...classes) {
        return classes.filter(Boolean).join(' ')
    }

    return (
        <div>
            <div className={styles.imageDiv}>
                {landingImage && <Image src={landingImage} alt="" width={1000} height={800} style={{width: '100%', height: 'auto'}}></Image>}
                <div className={styles.imageText}>
                    {getProperty && (
                        <p>
                            {checkIfEmpty(getProperty.CivicAddress.Value)}<br />
                            {checkIfEmpty(getProperty.Neighbourhood.Value)}&nbsp;|&nbsp;{checkIfEmpty(getProperty.PostalCode.Value)}<br />
                            Beds {checkIfEmpty(getProperty.Bedrooms.Value)} &nbsp;|&nbsp;Baths {checkIfEmpty(getProperty.Bathrooms.Value)} &nbsp;|&nbsp;Floor Area {checkIfEmpty(numberWithCommas(getProperty.FloorArea.Value))}<br />
                            Lot Size {checkIfEmpty(numberWithCommas(getProperty.LotSize.Value))} sf<br />
                        </p>
                    )}
                    {pathname !== '/' && (
                            <button className={styles.imageTextButton} onClick={() => router.push('/')}>
                                <FaArrowLeft className='inline-block vertical-align-middle uppercase mr-1' /> Go to map
                            </button>
                        )}
                    
                </div>
                <div className={styles.detailContainer}>
                    {
                        reviewCount == 0 ? (
                            <></>
                        ) : (
                        <div className={styles.reviewsContainer}>
                            <Reviews averageRating={averageRating} reviewCount={reviewCount}/>
                         </div>
                        )
                    }
                </div>
                
            </div>
            <div className='relative bg-grayLight p-2 flex'>
                <div className={styles.buttonGroup}>
                    <ShareMenu url={`https://squamish.realestate/property/landing/${propertyType}/${encodeURIComponent(getProperty.PID.Value)}/${encodeURIComponent(formatString(getProperty.CivicAddress.Value))}`} />
                    <Menu as="div" className={`inline-block text-left`}>
                        <div>
                            <Menu.Button className={`inline-flex w-full justify-center gap-x-1.5 ${styles.buttonAction}`}>
                            <span className={styles.buttonActionText}>More</span>
                            <FaEllipsisV className="-mr-1 h-5 w-5 text-brand" aria-hidden="true" />
                            </Menu.Button>
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
                            <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <div className="py-1">
                                <Menu.Item>
                                    {({ active }) => (
                                        <div className={classNames(active ? 'bg-grayLight text-brandDarker' : 'text-brandDarker', 'flex items-center px-4 py-2 text-sm')} onClick={() => scrollToRef(reviewsRef, '')}>
                                        <FaCommentAlt  className="mr-2" />
                                        Write a Review
                                        </div>
                                    )}
                                </Menu.Item>
                                <Menu.Item>
                                    {({ active }) => (
                                        <div className={classNames(active ? 'bg-grayLight text-brandDarker' : 'text-brandDarker', 'flex items-center px-4 py-2 text-sm')}   onClick={() => { setShowReportForm(true); scrollToRef(reportRef, ''); }}>
                                        <FaExclamationTriangle className="mr-2" />
                                        Report
                                        </div>
                                    )}
                                </Menu.Item>
                            </div>
                            </Menu.Items>
                        </Transition>
                    </Menu>
                </div>
            </div>
            <div className='bg-grayLight p-6 pt-10 text-xs md:text-sm lg:text-md lg:flex' >
                <div className='lg:w-2/3 lg:mr-5'>
                    <div className="hidden tabs bg-white p-2 mb-5 shadow-md md:flex md:justify-evenly flex-wrap">
                        {labelData.map(({ label, value, icon, ref }) => (
                            <div className={`dataitem relative flex items-center whitespace-nowrap gap-1 p-1 uppercase font-medium hover:bg-gray hover:bg-opacity-5 ${
                                selectedItem === value ? 'text-brand' : 'text-blueLight'
                              }`} id={value} key={value} onClick={() => {
                                scrollToRef(ref, value);
                                handleItemClick(value);
                              }} >
                                {React.createElement(icon, { className: `dataitem w-4 h-4 ${selectedItem === value ? 'text-brand' : 'text-[#e5e5e5]'}` })}
                                
                                {label}
                            </div>
                        ))}
                    </div>
                    <div ref={detailsRef} className="grid grid-rows-6 md:grid-rows-4 grid-flow-col justify-around p-4 bg-white gap-4 shadow-md mb-5">
                        {
                            propertyDetails.map((detail, index) => (
                            <div className="flex min-w-0 gap-x-2 md:gap-x-4 border-gray text-black" key={index}>
                                <detail.icon className='w-4 h-4 md:h-6 md:w-6 flex-none' />
                                <div className="min-w-0 flex-auto">
                                    <p className="leading-tight uppercase">{detail.name}</p>
                                    {detail.href ? (
                                        <a href={detail.href} className="mt-1 truncate font-semibold leading-tight text-blue-500 hover:underline hover:text-[#4cb7fe]">
                                            {checkIfEmpty(detail.value)}
                                        </a>
                                    ) : (
                                        <p className="mt-1 truncate font-semibold leading-tight">{checkIfEmpty(detail.value)}</p>
                                    )}
                                </div>
                            </div>
                        ))}     
                    </div>
                    <div className='bg-white p-2 shadow-md mb-5 text-black'>
                        <Tabs>
                            {
                                propertyExplorer.map((info, index) => (
                                    <Tab label={info.name} key={index}>
                                        <div className="py-4">
                                            {
                                                info.name === 'New Listings' ? (
                                                    <NewListings newListings={newListings} propertyType={propertyType} />
                                                ) : (
                                                    <RecentSolds recentSoldListings={recentSoldListings} propertyType={propertyType} />
                                                )
                                            }
                                        </div>
                                    </Tab>
                                ))
                            }
                        </Tabs>
                    </div>
                    <div className='bg-white p-2 shadow-md text-[#666666] mb-5'>
                        {
                            propertyInfo.map((info, index) => (
                                <div className="collapse collapse-plus" key={index}>
                                    <input type="checkbox" name="propertyInfo" className="peer" ref={info.ref} checked={isPrinting || openAccordions[index] || false} // Expands during print
                        onChange={() => toggleAccordion(index)} /> 
                                    <div className="collapse-title font-semibold border-2 border-grayLight mb-2 peer-checked:bg-brandDarker peer-checked:text-white ">
                                        {info.name}
                                    </div>
                                    <div className="collapse-content border-2 border-grayLight mb-2 overflow-x-auto"> 
                                        {
                                             (
                                                info.name === 'HonestDoor Price History' ? (
                                                    ((honestDoorPrice as any).PriceHistory && (honestDoorPrice as any).CurrentMonth) ? (
                                                    <div className="w-full flex flex-col justify-center items-center min-w-0 mb-8">
                                                    <div className="w-full lg:w-3/4 xl:w-1/2 min-w-[330px] custom-chart-container"> {/* Adjusted line */}
                                                        {React.createElement(HonestDoorPriceChart, {
                                                        priceHistory: (honestDoorPrice as any).PriceHistory?.Value,
                                                        currentMonth: (honestDoorPrice as any).CurrentMonth?.Value,
                                                        })}
                                                    </div>

                                                    <div className='bg-white flex justify-center p-6 mb-5'>
                                                        <HDMyHomeWidgetComponent />
                                                    </div>
                                                    </div>
                                                    ) : (
                                                      <div className="w-full flex justify-center items-center h-64"> {/* Center "Coming Soon" text */}
                                                        <p className="text-xl font-medium">Coming Soon</p>
                                                      </div>
                                                    )
                                                ) : (
                                                    info.name.includes('Floor Plans') ? (
                                                        floorPlanDocs && React.createElement(FloorPlans, { getProperty, propertyType, floorPlanDocs })
                                                    ) : (
                                                        // Default case for other components
                                                        React.createElement(info.component, { getProperty, propertyType })
                                                    )
                                                )
                                            )
                                        }
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                    <div className='bg-white shadow-md text-[#666666] font-medium mb-5'>
                        <div className='p-4 font-semibold border-b border-grayLight'>
                        Reviews ({reviews?.filter(review => review.Approved === 'True').length || 0})

                        </div>
                        {   
                        
                            reviews && <PropertyReviews reviews={reviews} getProperty={getProperty} propertyType={propertyType}/> 
                        }

                    </div>
                    <div ref={reviewsRef} className='bg-white shadow-md text-[#666666] font-medium mb-5'>
                        <div className='p-4 font-semibold border-b border-grayLight'>
                            Add Property Review
                        </div>
                        <ReviewForm getProperty={getProperty} user={currentUserDetails} />
                    </div>
                </div>
                <div className='lg:w-1/3'>
                    <div className='p-2 flex justify-center mb-5'>
                        <div className='mr-2'>
                            <Image className='rounded-md' width={300} height={300} priority src={`https://maps.googleapis.com/maps/api/streetview?size=300x300&location=${getProperty.Latitude.Value},${getProperty.Longitude.Value}&fov=80&pitch=0&key=AIzaSyCj9uSdVdZcQtAHRw44oGJjLiti4z7IKOU`} alt="" ></Image>
                        </div>
                        <div>
                            <Image className='rounded-md' width={300} height={300} priority src={`https://maps.googleapis.com/maps/api/staticmap?maptype=satellite&zoom=18&center=${getProperty.Latitude.Value},${getProperty.Longitude.Value}&size=300x300&markers=color:blue%7C${getProperty.Latitude.Value},${getProperty.Longitude.Value}&key=AIzaSyCj9uSdVdZcQtAHRw44oGJjLiti4z7IKOU`} alt="" ></Image>
                        </div>
                    </div>
                    <div className='bg-white shadow-md flex justify-center p-5 mb-5'>
                        <HDWidgetComponent />
                    </div>
                    <ReportIssue user={currentUserDetails} getProperty={getProperty} showReportForm={showReportForm} setShowReportForm={setShowReportForm} reportRef={reportRef}/>
            </div>
            </div>
        </div>
    )
}