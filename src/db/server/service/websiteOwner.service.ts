import 'server-only';

import { db } from '@/db';
import {
  WebsiteOwner,
  websiteOwners as WebsiteOwnersModel,
} from '@/db/schema';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';

type WebsiteOwnerPromise = Promise<WebsiteOwner | undefined>;

export const WebsiteOwnerService = {
    getWebsiteOwnerByApiKey: async (apiKey: string) => {
        return await db.query.websiteOwners.findFirst({
          where: eq(WebsiteOwnersModel.apiKey, apiKey),
        });
      },

};
