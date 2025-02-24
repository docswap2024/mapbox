import Image from 'next/image';
import Link from 'next/link';
import React, {useState, useEffect} from 'react';
import {styles} from './propertyDetailsStyle';
import {FaWindowClose} from 'react-icons/fa';
import { ListingDetail } from './listingDetail';
import { useRouter } from 'next/navigation';
import { formatString } from '@/utils';

export const ListingDetailPopup = ({showListingDetails, setShowListingDetails, getListing, listingType, listings}) =>{
    const router = useRouter();
    const [landingUrl, setLandingUrl] = useState<string>('');

    useEffect(() => {
        if (listingType === 'detachedListing') {
            setLandingUrl(`/listing/landing/detached/${encodeURIComponent(getListing.PID.Value)}/${encodeURIComponent(formatString(getListing.CivicAddress.Value))}`);
        } else if (listingType === 'strataListing') {
            setLandingUrl(`/listing/landing/strata/${encodeURIComponent(getListing.PID.Value)}/${encodeURIComponent(formatString(getListing.CivicAddress.Value))}`);
        } else if (listingType === 'landListing') {
            setLandingUrl(`/listing/landing/land/${encodeURIComponent(getListing.PID.Value)}/${encodeURIComponent(formatString(getListing.CivicAddress.Value))}`);
        } else if (listingType === 'multifamilyListing') {
            setLandingUrl(`/listing/landing/multifamily/${encodeURIComponent(getListing.PID.Value)}/${encodeURIComponent(formatString(getListing.CivicAddress.Value))}`);
        }

        console.log('landingUrl', landingUrl);
      }, []);

    if (!showListingDetails) return null;

    return (
        <div className='overflow-auto fixed bg-gray bg-opacity-50 inset-0 z-10 md:p-10 md:pt-0'>
            <div className={styles.container} style={{position: 'sticky',  top: '0', zIndex: '10'}}>
                <div className={styles.left}>
                    <Link href='' as='/'>
                        <Image
                        src='/SRE-Logo1.png'
                        alt='Squamish Real Estate Logo'
                        style={{ padding: '16px' }}
                        height={300}
                        width={300}
                        priority
                        ></Image>
                    </Link>
                </div>
                <div className={styles.right}>
                    <FaWindowClose className='h-6 w-6 flex-none bg-brandDark text-white hover:bg-white hover:text-brandDark' onClick={() => setShowListingDetails(false)} />
                </div>
            </div>
            <ListingDetail getListing={getListing}  listingType={listingType} landingUrl={landingUrl} listings={listings}/>
        </div>
    )
} 