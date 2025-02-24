import { NewReview, reviews as reviewsModel } from "@/db/schema/reviews";
import { db } from '@/db';


export const ReviewService = {

    uploadReview : async (data: NewReview) => {
        return await db.insert(reviewsModel).values(data).returning();
    }
}