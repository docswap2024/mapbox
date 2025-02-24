'use server';

import { WebsiteOwnerService } from '@/db/server/service/websiteOwner.service';

export const getWebsiteOwnerByApiKey = async (id: any) => {
  const websiteOwners = await WebsiteOwnerService.getWebsiteOwnerByApiKey(id);
  return websiteOwners;
};