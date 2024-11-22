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
  