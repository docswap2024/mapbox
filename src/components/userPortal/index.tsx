
import React, { useState } from 'react';
import { FaWindowClose } from 'react-icons/fa';
import { toast } from 'sonner';
import { signUp, logIn } from '@/db/server/actions/auth.action';
import { useCustomContext } from '@/context/useState';
import { getCurrentUser } from '@/lib/utils/session'


export const UserPortal = ({ setShowPortal }) => {
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between Sign Up and Log In
    const { setCurrentUser } = useCustomContext();

  const handleSignUp = async (event) => {
    event.preventDefault();

    const { email, fullName, password } = event.target.elements;

    // Call your sign-up function here and pass the necessary arguments
    const signUpResponse  = await signUp(email.value, password.value, fullName.value, '1fdcb576-fa11-4a80-843d-1db22372a4d7');

    if (!signUpResponse.ok) {
        console.log(signUpResponse.error);
        return toast.error(signUpResponse.error, { position: 'top-center'});
    }

    // Log the user in after successful sign-up
    const loginResponse = await logIn(email.value, password.value);

    if (!loginResponse.ok) {
        return toast.error(loginResponse.error,{ position: 'top-center'});
    }

    const user = await getCurrentUser();
    setCurrentUser(user);

    // Close the portal
    setShowPortal(false);
  };

  const handleSignIn = async (event) => {
    event.preventDefault();

    const { email, password } = event.target.elements;

    // Call your log-in function here and pass the necessary arguments
    const loginResponse =  await logIn(email.value, password.value);

    if (!loginResponse.ok) {
    return toast.error(loginResponse.error, { position: 'top-center'});
    }

   const user = await getCurrentUser();
   setCurrentUser(user);

    // Close the portal
    setShowPortal(false);
  };

  return (
    <div className="fixed inset-0 z-20 bg-black bg-opacity-50 flex justify-center items-start">
      <div className="flex flex-col items-center bg-white justify-center rounded p-10 relative mt-10">
        <div className="absolute top-0 right-0 m-2">
          <FaWindowClose
            className="h-6 w-6 bg-white text-brandDarker hover:bg-white hover:text-gray cursor-pointer"
            onClick={() => setShowPortal(false)}
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex mb-6 text-sm">
          <button
            className={`px-4 py-2 rounded-t ${isSignUp ? 'bg-brandDark text-white' : 'bg-gray-200 text-gray-600'}`}
            onClick={() => setIsSignUp(true)}
          >
            Sign Up
          </button>
          <button
            className={`px-4 py-2 rounded-t ${!isSignUp ? 'bg-brandDark text-white' : 'bg-gray-200 text-gray-600'}`}
            onClick={() => setIsSignUp(false)}
          >
            Log In
          </button>
        </div>

        {/* Form Content */}
        {isSignUp ? (
          <div className="w-full max-w-sm text-sm">
            <form onSubmit={handleSignUp}>
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                className="w-full mb-4 p-2 border border-gray-300 rounded"
                autoComplete="name"
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="w-full mb-4 p-2 border border-gray-300 rounded"
                autoComplete="email"
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                className="w-full mb-4 p-2 border border-gray-300 rounded"
                autoComplete="password"
              />
              <button
                type="submit"
                className="bg-brandDark text-white w-full rounded p-3"
              >
                Create Account
              </button>
            </form>
          </div>
        ) : (
          <div className="w-full max-w-sm">
            <form onSubmit={handleSignIn}>
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="w-full mb-4 p-2 border border-gray-300 rounded"
                autoComplete='email'
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                className="w-full mb-4 p-2 border border-gray-300 rounded"
                autoComplete="password"
              />
              <button
                type="submit"
                className="bg-brandDark text-white w-full rounded p-3"
              >
                Log In
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
