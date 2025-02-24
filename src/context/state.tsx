"use client"
import React, {createContext, useState } from 'react';

interface ContextProps {
  currentUser: any;
  setCurrentUser: (user: any) => void;
}

export const Context = createContext<ContextProps | undefined>(undefined);

export function AppWrapper(props: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);

  const setCurrentUser = (user: any) => {
    setUser(user);
  }
  

  const value: ContextProps = {
    currentUser: user,
    setCurrentUser
  }

   return (
    <Context.Provider value={value}>
      {props.children}
    </Context.Provider>
  );
 
}