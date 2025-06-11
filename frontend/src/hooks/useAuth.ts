import { useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/api';
import { getErrorMessage } from '../utils';

export const useAuth = () => {
  const {
    authStatus,
    loading,
    initializing,
    error,
    formState,
    setAuthStatus,
    setLoading,
    setInitializing,
    setError,
    setPhoneNumber,
    setPhoneCode,
    setPassword,
    setPhoneCodeHash,
    setStep,
    resetForm,
    reset,
  } = useAuthStore();

  const checkAuthStatus = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Проверяем статус авторизации...');
      
      const status = await authApi.getStatus();
      console.log('📊 Получен статус авторизации:', status);
      
      setAuthStatus(status);
      setError(null);
      
      if (status.authorized) {
        console.log('✅ Пользователь авторизован');
      } else {
        console.log('❌ Пользователь не авторизован');
      }
    } catch (error) {
      console.error('❌ Ошибка проверки статуса авторизации:', error);
      const errorMessage = getErrorMessage(error);
      
      // Показываем ошибку только если это не таймаут/сеть во время инициализации
      if (!initializing || !errorMessage.includes('Сервер не отвечает')) {
        setError(errorMessage);
      }
      
      setAuthStatus({ authorized: false });
    } finally {
      setLoading(false);
      setInitializing(false);
    }
  }, [initializing, setAuthStatus, setError, setLoading, setInitializing]);

  const sendCode = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authApi.sendCode({ phone_number: formState.phoneNumber });
      setPhoneCodeHash(response.phone_code_hash);
      setStep('code');
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [formState.phoneNumber, setLoading, setError, setPhoneCodeHash, setStep]);

  const verifyCode = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔐 Попытка верификации кода:', {
        phone_number: formState.phoneNumber,
        phone_code: formState.phoneCode,
        phone_code_hash: formState.phoneCodeHash?.substring(0, 10) + '...',
      });
      
      const response = await authApi.verifyCode({
        phone_number: formState.phoneNumber,
        phone_code: formState.phoneCode,
        phone_code_hash: formState.phoneCodeHash,
      });

      console.log('📨 Ответ API:', response);

      if (response.status === 'need_password') {
        console.log('🔒 Требуется пароль двухфакторной аутентификации');
        setStep('password');
      } else if (response.status === 'success') {
        console.log('✅ Код верифицирован успешно');
        // Добавляем небольшую задержку для обновления сессии
        await new Promise(resolve => setTimeout(resolve, 1000));
        await checkAuthStatus();
        resetForm();
      } else if (response.status === 'code_expired') {
        console.log('⏰ Код истёк, возвращаемся к вводу номера');
        setStep('phone');
        setError('Код истёк. Запросите новый код.');
      } else {
        console.log('❓ Неожиданный статус ответа:', response.status);
        setError(response.message || 'Неожиданный ответ сервера. Попробуйте еще раз.');
      }
    } catch (error) {
      console.error('❌ Ошибка верификации кода:', error);
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [
    formState.phoneNumber,
    formState.phoneCode,
    formState.phoneCodeHash,
    setLoading,
    setError,
    setStep,
    checkAuthStatus,
    resetForm,
  ]);

  const verifyPassword = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔐 Попытка верификации пароля...');
      const response = await authApi.verifyPassword({ password: formState.password });
      
      console.log('📨 Ответ API пароля:', response);
      
      if (response.status === 'success') {
        console.log('✅ Пароль верифицирован успешно');
        // Добавляем небольшую задержку для обновления сессии
        await new Promise(resolve => setTimeout(resolve, 1000));
        await checkAuthStatus();
        resetForm();
      } else {
        console.log('❓ Неожиданный статус ответа пароля:', response.status);
        setError('Неожиданный ответ сервера. Попробуйте еще раз.');
      }
    } catch (error) {
      console.error('❌ Ошибка верификации пароля:', error);
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [formState.password, setLoading, setError, checkAuthStatus, resetForm]);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await authApi.logout();
    } catch (error) {
      console.error('Error during logout:', error);
      // Продолжаем выход даже если API не отвечает
    } finally {
      // Принудительно сбрасываем состояние авторизации
      setAuthStatus({ authorized: false });
      resetForm();
      setLoading(false);
      
      // Принудительно обновляем страницу для полной очистки состояния
      window.location.reload();
    }
  }, [setLoading, setAuthStatus, resetForm]);

  // Инициализация при монтировании компонента
  useEffect(() => {
    checkAuthStatus();
    
    // Периодически проверяем статус авторизации (каждые 5 минут)
    const interval = setInterval(checkAuthStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [checkAuthStatus]);

  // Слушаем события разлогинивания из API interceptors
  useEffect(() => {
    const handleAuthLogout = () => {
      setAuthStatus({ authorized: false });
      resetForm();
    };

    window.addEventListener('auth-logout', handleAuthLogout);
    return () => window.removeEventListener('auth-logout', handleAuthLogout);
  }, [setAuthStatus, resetForm]);

  return {
    // Status
    authStatus,
    loading,
    initializing,
    error,
    
    // Form state
    phoneNumber: formState.phoneNumber,
    phoneCode: formState.phoneCode,
    password: formState.password,
    step: formState.step,
    
    // Form setters
    setPhoneNumber,
    setPhoneCode,
    setPassword,
    setError,
    setStep,
    
    // Actions
    sendCode,
    verifyCode,
    verifyPassword,
    logout,
    checkAuthStatus,
    resetForm,
  };
}; 