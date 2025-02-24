import 'server-only';

import { db } from '@/db';

export const UserService = {
    getUserDetails: async (id: string) => {
        const user = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.id, id),
          with: {
            websiteOwners: true,
            offers: true,
            reviews: true
          }
        });
    
        if (!user) {
          throw new Error('User not found');
        }
       
        return {
          ...user,
        };
      },
}