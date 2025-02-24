import React from 'react';
import { FaExclamationCircle } from "react-icons/fa";

const AccessDenied = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white">
        <div className="flex justify-center mb-6">
            <FaExclamationCircle className='w-10 h-10'/>
        </div>
        <h1 className="text-3xl font-semibold text-center text-gray-800 mb-4">
          Oops! Access Denied
        </h1>
        <p className="text-lg text-center text-gray-600 mb-6">
          Sorry, you don’t have permission to access this page. If you think this is a mistake, please contact support.
        </p>
        <div className="flex justify-center">
          <a
            href="mailto:seanbrawley@gmail.com"
            className="bg-red-500 text-white px-6 py-3 rounded-md shadow-md text-lg hover:bg-red-600 transition duration-200"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
