'use server';


import { UserService } from "../service/user.service";
import { getCurrentUser } from "@/lib/utils/session";

export const me = async () => {
    const user = await getCurrentUser();
    if (user) {
        const profile = await UserService.getUserDetails(user.id);
        return profile;
    }

    return null;

};