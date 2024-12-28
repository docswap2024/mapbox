import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import {styles} from './propertyDetailsStyle';
import {FaWindowClose} from 'react-icons/fa';
import { PropertyDetail } from './propertyDetail';

export const PropertyDetailPopup = ({showPropertyDetails, setShowPropertyDetails, getProperty, propertyType, listings}) =>{

    if (!showPropertyDetails) return null;

    return (
        <div className='overflow-auto fixed bg-gray bg-opacity-50 inset-0 z-10 md:p-10 md:pt-0'>
            <div className={styles.container} style={{position: 'sticky',  top: '0', zIndex: '10'}}>
                <div className={styles.right}>
                    <FaWindowClose className='h-6 w-6 flex-none bg-brandDark text-white hover:bg-white hover:text-brandDark' onClick={() => setShowPropertyDetails(false)} />
                </div>
            </div>
            <PropertyDetail getProperty={getProperty} propertyType={propertyType} listings={listings}/>
        </div>
    )
} 