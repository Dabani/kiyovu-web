import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  withXSRFToken: true,
  headers: { Accept: 'application/json' },
});

/** Must be called once before login — primes the XSRF-TOKEN cookie via Sanctum. */
export async function primeCsrf(): Promise<void> {
  await axios.get('/sanctum/csrf-cookie', { baseURL: '/', withCredentials: true });
}

// Central 401 handling: bounce to /login unless we're already there.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      window.location.assign('/login');
    }
    return Promise.reject(error);
  }
);
