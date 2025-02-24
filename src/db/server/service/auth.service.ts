import { db } from "@/db";
import { hash, verify } from "@node-rs/argon2";
import { cookies } from "next/headers";
import { lucia } from "@/auth";
import { generateIdFromEntropySize } from "lucia";
import {users, users as usersModel} from "@/db/schema";
import { validateRequest } from "@/lib/utils/auth";
import { eq } from 'drizzle-orm';


export const AuthService = {    
    signUp: async (email: string, password: string, name: string, apiKey: string) => {
        if (typeof email !== "string" || email.trim() === "") {
            return {
                error: "Email is required."
            };
        }
        
        if (email.length < 3 || email.length > 255) {
            return {
                error: "Email must be between 3 and 255 characters long."
            };
        }
        
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return {
                error: "Please enter a valid email address."
            };
        }
        
        if (typeof password !== "string" || password.trim() === "") {
            return {
                error: "Password is required."
            };
        }
        
        if (password.length < 6) {
            return {
                error: "Password must be at least 6 characters long."
            };
        }
        
        if (password.length > 255) {
            return {
                error: "Password must be no longer than 255 characters."
            };
        }

        let user = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (user) {
            return {
                error: "Email already in use. Try signing in"
            };
        }
    
        const passwordHash = await hash(password, {
            // recommended minimum parameters
            memoryCost: 19456,
            timeCost: 2,
            outputLen: 32,
            parallelism: 1
        });
        const userId = generateIdFromEntropySize(10); // 16 characters long


    
        // TODO: check if username is already used
        await db.insert(usersModel).values({
            id: userId,
            email: email,
            name: name,
            passwordHash: passwordHash,
            apiKey: apiKey
        });
    
        const session = await lucia.createSession(userId, {});
        const sessionCookie = lucia.createSessionCookie(session.id);
        (await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

        return { ok: true };
    },

    logIn: async (email: string, password: string) => {
        const existingUser = await db.query.users.findFirst({
            where: eq(usersModel.email, email)
        });
		
        if (!existingUser) {
            return {
                error: "Incorrect username or password. Please try again."
            };
        }

        const validPassword = await verify(existingUser.passwordHash, password, {
            memoryCost: 19456,
            timeCost: 2,
            outputLen: 32,
            parallelism: 1
        });
        if (!validPassword) {
            return {
                error: "Incorrect username or password. Please try again."
            };
        }

        const session = await lucia.createSession(existingUser.id, {});
        const sessionCookie = lucia.createSessionCookie(session.id);
        (await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

        return { ok: true };
    },

    logOut: async () => {
        const { session } = await validateRequest();
        if (!session) {
            return {
                error: "Unauthorized"
            };
        }

        await lucia.invalidateSession(session.id);

        const sessionCookie = lucia.createBlankSessionCookie();
        (await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

        return { ok: true };
        // return redirect("/login");
    }

};