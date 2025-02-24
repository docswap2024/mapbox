import React from 'react';
import { PropertyDetail } from './propertyDetail';
import { Navbar } from '../navbar';

export const PropertyDetailPage = ({getProperty, propertyType, listings}) =>{
    return (
        <>
            <Navbar />
            <PropertyDetail getProperty={getProperty} propertyType={propertyType} listings={listings}/>
        </>
    )
} 