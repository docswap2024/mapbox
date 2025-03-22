"use client";

import React, { useEffect, useState } from 'react';
import { useCustomContext } from '@/context/useState';
import { getCurrentUser } from '@/lib/utils/session';
import { UserPortal } from '../userPortal';
import { logOut } from '@/db/server/actions/auth.action';

export const Navbar = () => {

    const { currentUser, setCurrentUser } = useCustomContext();
    const [showPortal, setShowPortal] = useState<any>(null);

     useEffect(() => {
        const getUser = async () => {
          try {
            const user = await getCurrentUser();
            setCurrentUser(user)
          } catch (error) {
            return null;
          }
        }
    
        getUser();
    
      }, []);
    return (
        <>
            <div className="flex items-center justify-between px-6 py-2 bg-brandDarker shadow-md text-white">
                <div className="text-lg font-bold">Map View</div>
                <div className="flex items-center">
                    {currentUser && (
                    <span className="mr-4">{currentUser.email}</span>
                    )}
                    <button
                    className={`px-2 py-2 rounded font-bold transition-colors hover:text-brand`}
                    onClick={() => { currentUser ? (logOut(), setCurrentUser(null)) : setShowPortal(true) }}
                    >
                    {currentUser ? "Logout" : "Login"}
                    </button>
                </div>
            </div>
            
            {
            showPortal && <UserPortal setShowPortal={setShowPortal}/>
            }
            
        </>
    );
}