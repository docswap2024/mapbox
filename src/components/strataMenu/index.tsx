import React, { Fragment } from 'react';
import { Menu, Transition, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import { sliceAddress } from '@/utils';


interface StrataMenuProps {
    strataProperties: Array<any>; 
}

const StrataMenu: React.FC<StrataMenuProps> = ({ strataProperties }) => (
    <Menu as="div" className="relative inline-block text-left w-full">
        <div>
            <MenuButton className="inline-flex flex justify-between w-full rounded-md bg-white px-3 py-2 text-sm font-semibold text-brandDarker shadow-sm ring-1 ring-inset ring-grayLight hover:bg-grayLight">
            Select Unit
            <ChevronDownIcon className="-mr-1 h-5 w-5" aria-hidden="true" />
            </MenuButton>
        </div>
        <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
        >
            <MenuItems className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1 overflow-auto h-40">
            {
                strataProperties
                    .slice() // Create a copy of the array to avoid mutating the original array
                    .sort((a, b) => {
                    const addressA = parseInt(a.CivicAddress.Value.match(/\d+/)[0], 10);
                    const addressB = parseInt(b.CivicAddress.Value.match(/\d+/)[0], 10);
                    return addressA - addressB;
                    })
                    .map((property, index) => (
                    <MenuItem key={index}>
                        <div
                            className=' data-[focus]:bg-grayLight  data-[focus]:text-gray text-brandDarker block px-4 py-2 text-sm '
                            onClick={() => {
                            // handleButtonClick();
                            // addView(property.PID.Value)
                            // setStrataProperty(property);
                            }}
                        >
                            {sliceAddress(property.CivicAddress.Value)}
                        </div>
                    </MenuItem>
                    ))
            }

            </div>
            </MenuItems>
        </Transition>
    </Menu>
);

export default StrataMenu;
