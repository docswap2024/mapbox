import React from 'react';
import {FaStar,FaStarHalfAlt, FaRegStar} from 'react-icons/fa';

export const Rating: React.FC<{ rating: number, count: any }> = ({ rating, count }) => {
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
      <span key={index} style={{ width: '1em' }} className='text-brandDarker text-xs lg:text-sm ml-1'>
      {React.createElement(starIcon)}
      </span>
    );
  });

  return (
      <>
        <div className='flex justify-center items-center md:flex-col'>
          <div className='flex'>
                {starElements}
          </div>
        </div>
        <span className='text-brandDarker font-semibold text-sm ml-1 mr-1'>{rating}</span>
        <span className='text-brandDarker text-sm'>({count} {count == 1 ? 'review' : 'reviews'})</span>
      
      </>
  );
};


