'use server';

import { NewOffer } from '@/db/schema/offers';
import { OfferService } from '@/db/server/service/offer.service'

export const uploadOffer = async (input: NewOffer) => {  
    const offer = await OfferService.uploadOffer(input);
    return offer;
  };
  