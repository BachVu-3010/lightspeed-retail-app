import { backOff } from 'exponential-backoff';

const fetchWithRetry = async (url) => {
  let res;
  try {
    res = await fetch(url);
  } catch (e) {
    return null;
  }

  if (res && res.ok) {
    return await res.json();
  } else if (res && (res.status === 502 || res.status === 429)) {
    throw new Error('Retry request');
  }

  return null;
};

export default async (url) => {
  try {
    return await backOff(() => fetchWithRetry(url), {
      numOfAttempts: 3,
      startingDelay: 500,
      timeMultiple: 1.5,
    });
  } catch (e) {
    return null;
  }
};
