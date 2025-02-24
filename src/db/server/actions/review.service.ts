'use server';

import { NewReview } from '@/db/schema/reviews';
import { ReviewService } from '@/db/server/service/review.service'

export const uploadReview = async (input: NewReview) => {  
    const offer = await ReviewService.uploadReview(input);
    return offer;
  };
  