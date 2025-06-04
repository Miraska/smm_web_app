import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const getChannels = async () => (await api.get('/channels')).data;

export const getPosts = async (channel_id: string) =>
  (await api.get('/posts', { params: { channel_id } })).data;

export const rewrite = async (text: string, truncate?: number) =>
  (await api.post('/rewrite', { text, truncate })).data.result;

export const publish = async (payload: {
  channel_id: string;
  text: string;
  media_type?: string;
  file_id?: string;
}) => (await api.post('/publish', payload)).data;
