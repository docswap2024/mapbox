
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { websiteOwners } from "../schema";

export const websiteOwnerSeeder = async (
    db: NodePgDatabase<Record<string, never>>,
) => {
    const websiteOwnerData = {
        apiKey: '1fdcb576-fa11-4a80-843d-1db22372a4d7',
        name: 'Sean Brawley',
        email: 'seanbrawley@gmail.com',
        domain: 'https://seanbrawley.remaxseatosky.com/',
    }

    try {    
        const [websiteOwner] = await db.insert(websiteOwners).values(websiteOwnerData).returning();
    }
    catch (error) {
        console.error('Error inserting websiteOwner and assigning role:', error);
    }
};