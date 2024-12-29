import React from 'react';
import { PropertyDetail } from './propertyDetail';

export const PropertyDetailPage = ({getProperty, propertyType, listings}) =>{
    return (
        <>
            <PropertyDetail getProperty={getProperty} propertyType={propertyType} listings={listings}/>
        </>
    )
} 