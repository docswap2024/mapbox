import { NewOffer, offers as offersModel } from "@/db/schema/offers";
import { db } from '@/db';


export const OfferService = {

    uploadOffer : async (data: NewOffer) => {
        return await db.insert(offersModel).values(data).returning();
    }
}