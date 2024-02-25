import axios from 'axios';
import { BACKEND_URL } from './credentials';

export const AxiosClient = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    Accept: '*/*',
    'Content-Type': 'application/json',
  },
});
