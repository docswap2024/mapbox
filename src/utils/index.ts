import axios from "axios";
import { ChartOptions } from 'chart.js'; // Ensure you import the correct type


// utils/index.ts
export const fetchImage = (url) => {
    return fetch(url, { method: 'GET', mode: 'cors' })
      .then(response => {
        if (response.ok) {
          return url;
        } else {
          return '/images/Default-Card.jpg';
        }
      })
      .catch(error => {
        console.error(error);
        return '/images/Default-Card.jpg';
      });
};
  
export const formatPid = (pid: any) => {
    return pid.slice(0, 3) + '-' + pid.slice(3, 6) + '-' + pid.slice(6);
};


export const sliceAddress = (address) => {
    // Ensure that 'address' is not changed by creating a copy for formatting
    let formatAddress = address.slice(); // Creates a shallow copy of the string
    
    // Format the copy
    formatAddress = formatAddress.replaceAll(',', '');
    
    const words = formatAddress.split(' ');
  
    // If more than 4 words, slice it, otherwise return the formatted copy
    if (words.length > 4) {
      return words.slice(0, -4).join(' ');
    } else {
      return formatAddress;
    }
};

export function getBathrooms(FULL_BATH, HALF_BATH) {
  const halfBathExists = Boolean(HALF_BATH.trim().replace("-", ""));
  const fullBathExists = Boolean(FULL_BATH.trim().replace("-", ""));

  const halfBathCount = halfBathExists ? parseInt(HALF_BATH) : 0;
  const fullBathCount = fullBathExists ? parseInt(FULL_BATH) : 0;

  if (fullBathCount || halfBathCount) {
      return fullBathCount + (halfBathCount * 0.5);
  } else {
      return '−';
  }
}

export const formatPrice = (price: any) => {
  if (!price) {
    return 'N/A';
 }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(price));
}

export const formatString = (inputString) => {
  return inputString.replace(/ /g, '-').toLowerCase();
}

export const monthAbbreviations = {
  January: "Jan",
  February: "Feb",
  March: "Mar",
  April: "Apr",
  May: "May",
  June: "Jun",
  July: "Jul",
  August: "Aug",
  September: "Sep",
  October: "Oct",
  November: "Nov",
  December: "Dec",
};


export function formatCurrentHonestDoorPrice(currentPrice: number, currentMonth: string) {
  const currentYear = new Date().getFullYear();
  const monthIndex = new Date().getMonth(); // 0-11, where January is 0
  let dataYear = currentYear; // Assume the data year is the current year initially

  const dataMonthIndex = Object.keys(monthAbbreviations).indexOf(currentMonth) + 1; // 1-12

  if (dataMonthIndex > monthIndex + 1) {
    dataYear--;
  }

  const abbreviatedMonth = monthAbbreviations[currentMonth];
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(currentPrice);

  return `${formattedPrice} (${abbreviatedMonth}, ${dataYear})`;
}
  
export const checkUrl = async (url) => {

  try {
      const encodedUrl = encodeURIComponent(url); 
      const response = await axios.get(`/api/imageUrl/${encodedUrl}`);
      if (response.data === 'Image URL is valid') {
          return true;
      } else {
          return false;
      }
      
  } catch (error) {
      console.log('Error fetching image URL:', error);
      return false;
  }
};

export const ChartOption: ChartOptions<"line"> = {
  responsive: true,
  elements: {
    point: {
      hoverBackgroundColor: '#2e3f6e',
      hoverBorderColor: '#2e3f6e',
      hoverRadius: 7,
    },
  },
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'HonestDoor Price Over Last 13 Months',
    },
    tooltip: {
      enabled: true,
      intersect: false,
      mode: 'nearest' as const, // Using 'as const' for a narrower type
      external: function(context) {
        const chart = context.chart;
        const tooltip = context.tooltip;
        const ctx = chart.ctx;
        
        if (tooltip.opacity === 0) {
          return;
        }
        
        const x = tooltip.caretX;

        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.moveTo(x, chart.chartArea.bottom);
        ctx.lineTo(x, chart.chartArea.top);
        ctx.strokeStyle = '#2e3f6e';
        ctx.stroke();
        ctx.restore();
      }
    }
  },
} as ChartOptions<"line">; // Explicit type assertion here

export function formatCurrency(number: number, locale: string = 'en-US', currency: string = 'USD'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
}


export function formatDate(dateString) {
  const options = {
      weekday: 'long',
      month: 'long',
      year: 'numeric',
      day: 'numeric',
      timeZone: 'America/Los_Angeles'
  } as const ;

  // Create a new Date object from the dateString
  const date = new Date(dateString + 'T00:00:00'); // Treat as UTC midnight

  // Format the date directly in the Pacific Time zone
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

export function formatTime(timestamp) {
  const options = { hour: 'numeric', minute: 'numeric' } as const;

  const [hours, minutes, seconds] = timestamp.split(':');
  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);
  date.setSeconds(seconds);

  // Convert the Date object to a string in the Pacific Time zone
  const timePDT = new Date(date.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));

  // Format the time in the specified format
  return timePDT.toLocaleString('en-US', options);
}