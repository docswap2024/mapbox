import React, {useState} from 'react';
import { FaWindowClose } from 'react-icons/fa';
import { UserPortal } from '../userPortal';

export const AccessDeniedPopup = ({ setShowAccessDenied, setShowPortal }) => {


  const handleOpenPortal = () => {
    setShowAccessDenied(false); // Close Access Denied Popup
    setShowPortal(true); // Open User Portal
  };

  return (
    <>
      {/* Access Denied Modal */}
      
        <div className="fixed inset-0 z-10 bg-black bg-opacity-50 flex justify-center items-start">
          <div className="flex flex-col items-center bg-white bg-opacity-95 justify-center rounded p-14 relative mt-10">
            <div className="absolute top-0 right-0 m-2">
              <FaWindowClose
                className="h-6 w-6 bg-white text-brandDarker hover:bg-white hover:text-gray cursor-pointer"
                onClick={() => setShowAccessDenied(false)} // Close Access Denied Popup
              />
            </div>
            <p className="mb-6 text-center text-brandDarker mt-4 text-sm">
              To access this listing, <br /> please create a free account
            </p>
            <button
              className="bg-brandDark text-white rounded p-3"
              onClick={handleOpenPortal} // Trigger state changes
            >
              Signup / Login
            </button>
          </div>
        </div>
    </>
  );
};
