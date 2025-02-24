"use client";
import React, {useState, useEffect} from 'react';
import { ListingDetail } from './listingDetail';
import { formatString } from '@/utils/index';
import { Navbar } from '../navbar';


export const ListingDetailPage = ({getListing, listingType, listings}) => {
    const [landingUrl, setLandingUrl] = useState('');
    
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
    }, []);

    return (
            <>
                <Navbar />
                <ListingDetail getListing={getListing} listingType={listingType}  landingUrl={landingUrl} listings={listings} />
            </>
    ) 
} 