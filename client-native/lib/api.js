import axios from "axios";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
if (!API_URL) throw new Error("EXPO_PUBLIC_API_URL is not defined");

export const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
});

// Create a holder for the token getter function
let getAuth0Token = null;
export const setAuth0TokenGetter = (fn) => { getAuth0Token = fn; };

// 🚀 Automatically add the token to EVERY request
api.interceptors.request.use(async (config) => {
  if (getAuth0Token) {
    const token = await getAuth0Token();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const verifyCleanup = async (reportId, file, lat, lng) => {
  const formData = new FormData();
  
  // React Native Image Object
  formData.append("image", file); 
  formData.append("lat", lat);
  formData.append("lng", lng);

  // No need to pass 'token' or 'headers' manually anymore!
  const response = await api.post(`/api/garbage/${reportId}/verify-cleanup`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};