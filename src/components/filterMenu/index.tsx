import React, {useState} from 'react';
import { FaFilter } from "react-icons/fa";

const FilterMenu = ({selectedStatuses, setSelectedStatuses}) => {
    const [isFiltersVisible, setIsFiltersVisible] = useState(false);

    const statusMap = {
        Sold: 'Closed',
        Pending: 'Pending',
        Expired: 'Expired',
        Cancelled: 'Terminated',
    };

    const handleCheckboxChange = (status: string) => {
        setSelectedStatuses(prevStatuses =>
          prevStatuses.includes(status)
            ? prevStatuses.filter(item => item !== status)
            : [...prevStatuses, status]
        );
    };

    return (
        <div className="absolute top-2 left-2 z-10">
          <button
            onClick={() => setIsFiltersVisible(!isFiltersVisible)}
            className="flex items-center px-4 py-[15px] md:px-3 md:py-2 mt-1 rounded-sm shadow-sm bg-white text-[#9ca3af] font-sans text-opacity-80 hover:bg-graybg transition-colors duration-200"
          >
            <FaFilter className='w-5 h-5 md:w-3 md:h-3 md:mr-2 text-[#757575]' />
            <span className='hidden md:block text-sm'>Icon Filters</span>
          </button>

            {isFiltersVisible && (
              <div
                id="status-filters"
                className="flex flex-col gap-2 p-4 mt-2 bg-white rounded-lg shadow-lg absolute top-full left-0 z-10"
              >
                 {
                  Object.entries(statusMap).map(([key, value]) => {
                    console.log(`Key: ${key}, Value: ${value}`);
                    return (
                      <label
                        key={value}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <span className="capitalize mr-2 text-sm text-black font-sans">{key}</span>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={selectedStatuses.includes(value)}
                            onChange={() => handleCheckboxChange(value)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-[#d1d5db] rounded-full peer-checked:bg-brand transition-colors duration-200"></div>
                          <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transform transition-transform duration-200 peer-checked:translate-x-4"></div>
                        </div>
                      </label>
                    )
                  })
                 }
              </div>
            )}
        </div>
    )
}


export default FilterMenu;