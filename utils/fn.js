export const makeid = (num = 12) => {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var characters9 = characters.length;
  for (var i = 0; i < num; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters9));
  }
  return result;
};
function removeTrailingZeroes(value) {
  return parseFloat(value.toFixed(1)).toString();
};
export function timeEstiated(dateStr) {
  const date = new Date(dateStr);

  // Format: "28 Sep"
  const options = { day: "2-digit", month: "short" };
  return date.toLocaleDateString("en-GB", options);
}
export function roundNumber(n) {
  if (n < 100) {
    return Math.ceil(n / 10) * 10 + '+';
  } else if (n < 1000) {
    return Math.ceil(n / 100) * 100 + '+';
  } else if (n < 10000) {
    return (Math.ceil(n / 100) * 100 / 1000).toFixed(1) + 'k+';
  } else if (n < 100000) {
    return (Math.ceil(n / 1000) * 1000 / 1000).toFixed(1) + 'k+';
  } else {
    return (Math.ceil(n / 100000) * 100000 / 100000).toFixed(1) + 'L+';
  }
};
export const sleep = async (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const backTo = (router, to = false) => {
  if (to) {
    router.push(to);
  } else {
    const back = sessionStorage.getItem("previousUrl");
    if (back) {
      router.push(back);
    } else {
      router.push("/");
    }
  }
};


// Helper function to get timezone offset as string
function getTimezoneOffsetString(date) {
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const hours = Math.floor(Math.abs(offset) / 60).toString().padStart(2, '0');
  const minutes = (Math.abs(offset) % 60).toString().padStart(2, '0');
  return `${sign}${hours}:${minutes}`;
}

export function timeAgo(timestamp) {
  // Handle cases where timestamp might be invalid or missing
  if (!timestamp) return "just now";

  const now = new Date();
  const past = new Date(timestamp);

  // Handle invalid date
  if (isNaN(past.getTime())) return "invalid date";

  const diff = now - past; // Difference in milliseconds

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30); // Approximate
  const years = Math.floor(days / 365); // Approximate

  if (seconds < 10) return "just now"; // More natural threshold
  if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
  if (weeks < 4) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
  return `${years} year${years !== 1 ? 's' : ''} ago`;
};

export function convertSecoundsToMinuts(seconds) {
  let minutes = seconds / 60;
  if (minutes >= 60) {
    let hours = minutes / 60;
    if (hours >= 24) {
      let days = hours / 24;
      return Math.round(days) + " days";
    } else {
      return Math.round(hours) + " hours";
    }
  } else {
    return Math.round(minutes) + " minutes";
  }
};
export function debounce(func, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};


export function formatNumber(num, precision = 2) {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(precision) + 'b';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(precision) + 'm';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(precision) + 'k';
  }
  return num.toString();
}

// More precise version that removes trailing .00 when not needed
export function formatNumberPrecise(num) {
  const lookup = [
    { value: 1, symbol: '' },
    { value: 1e3, symbol: 'k' },
    { value: 1e6, symbol: 'm' },
    { value: 1e9, symbol: 'b' }
  ];

  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  const item = lookup.slice().reverse().find(item => num >= item.value);

  return item ? (num / item.value).toFixed(2).replace(rx, '$1') + item.symbol : '0';
}
export function formatReadableDate12(dateString) {
  const date = new Date(dateString);
  const options = {
    day: "2-digit",
    month: "short", // gives Jan, Feb, Mar...
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };
  return date.toLocaleString("en-US", options).replace(",", "");
}