import { useState, useEffect, useCallback } from 'react';
import { sourcesApi, channelsApi } from '../services/api';
import { getErrorMessage } from '../utils';
import type { Source, Channel } from '../types';

export const useSources = () => {
  const [sources, setSources] = useState<Source[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSources = useCallback(async (search?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await sourcesApi.getAll(search);
      setSources(data);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadChannels = useCallback(async (search?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await channelsApi.getAll(search);
      setChannels(data);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  const addSource = useCallback(async (channel: Channel) => {
    try {
      setLoading(true);
      setError(null);
      const newSource = await sourcesApi.add(channel);
      setSources(prev => [...prev, newSource]);
      return newSource;
    } catch (error) {
      setError(getErrorMessage(error));
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeSource = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await sourcesApi.remove(id);
      setSources(prev => prev.filter(source => source.id !== id));
      return response;
    } catch (error) {
      setError(getErrorMessage(error));
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const parseAllSources = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await sourcesApi.parseAll();
      return response;
    } catch (error) {
      setError(getErrorMessage(error));
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Загружаем данные при монтировании
  useEffect(() => {
    loadSources();
    loadChannels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    sources,
    channels,
    loading,
    error,
    loadSources,
    loadChannels,
    addSource,
    removeSource,
    parseAllSources,
    setError,
  };
}; 