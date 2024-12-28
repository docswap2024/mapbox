"use client"
import React, { createContext, useContext, useState, useEffect } from 'react';

const PrintContext = createContext({
    handlePrint: (url: string) => {},
    isPrinting: false
});

export function PrintProvider({ children }) {
    const [isPrinting, setIsPrinting] = useState(false);

    const handlePrint = (url: string) => {
        setIsPrinting(true);

        if (window.location.pathname !== '/'){
            setTimeout(() => {
                window.print();
                setIsPrinting(false);
            }, 0);
        } else {
             // Open the URL in a new window
            const newWindow = window.open(url, '_blank');

            if (newWindow) {
                // Set up an event listener to print after the new window loads
                newWindow.onload = () => {
                    newWindow.print();
                    setIsPrinting(false); // Reset the printing state
                };
            }
        }
    };
    

    useEffect(() => {
        const resetPrintingState = () => setIsPrinting(false);
        window.addEventListener('afterprint', resetPrintingState);

        return () => {
            window.removeEventListener('afterprint', resetPrintingState);
        };
    }, []);

    return (
        <PrintContext.Provider value={{ handlePrint, isPrinting }}>
            {children}
        </PrintContext.Provider>
    );
}

export const usePrint = () => useContext(PrintContext);
