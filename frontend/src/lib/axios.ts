import axios from "axios";

declare global {
  interface Window {
    Clerk?: {
      session?: {
        getToken(): Promise<string | null>;
      };
    };
  }
}

export const axiosInstance = axios.create({
	baseURL: import.meta.env.MODE === "development" ? "http://localhost:5000/api" : "/api",
});

// Add auth token to requests
axiosInstance.interceptors.request.use(async (config) => {
	try {
		const token = await window.Clerk?.session?.getToken();
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
	} catch (error) {
		console.error('Failed to get auth token:', error);
	}
	return config;
}, (error) => {
	return Promise.reject(error);
});
