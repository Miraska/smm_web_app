import React from 'react';
import { Shield, Check, AlertTriangle, Key, Lock, Smartphone, Send } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { validatePhoneNumber, validateCode } from '../../../utils';

export const AuthPage: React.FC = () => {
  const {
    authStatus,
    loading,
    error,
    phoneNumber,
    setPhoneNumber,
    phoneCode,
    setPhoneCode,
    password,
    setPassword,
    step,
    sendCode,
    verifyCode,
    verifyPassword,
    setError,
    setStep,
  } = useAuth();

  const handleSendCode = () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Неверный формат номера телефона');
      return;
    }
    sendCode();
  };

  const handleVerifyCode = () => {
    if (!validateCode(phoneCode)) {
      setError('Код должен содержать от 4 до 6 цифр');
      return;
    }
    verifyCode();
  };

  const handleVerifyPassword = () => {
    if (!password) {
      setError('Введите пароль');
      return;
    }
    verifyPassword();
  };

  if (authStatus.authorized) {
    return (
      <div className="text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-tg-green to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-tg-dark-800 dark:text-white mb-2">
          Авторизация выполнена
        </h2>
        <p className="text-tg-gray-600 dark:text-tg-gray-400 mb-6">
          Вы успешно подключены к Telegram
        </p>
        <div className="inline-flex items-center px-4 py-2 bg-tg-green/10 text-tg-green rounded-tg border border-tg-green/20">
          <Check className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">Активное соединение</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-tg-blue-500 to-tg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-tg-dark-800 dark:text-white">
          Авторизация Telegram
        </h2>
        <p className="text-tg-gray-600 dark:text-tg-gray-400 mt-2">
          Подключитесь к вашему аккаунту Telegram для начала работы
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-tg-red/10 border border-tg-red/20 rounded-tg flex items-start space-x-3">
          <div className="w-5 h-5 bg-tg-red rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs">!</span>
          </div>
          <p className="text-tg-red font-medium">{error}</p>
        </div>
      )}

      {step === 'phone' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-tg-dark-700 dark:text-tg-gray-300 mb-2">
              <Smartphone className="w-4 h-4 inline mr-2" />
              Номер телефона
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+7 (999) 123-45-67"
              className="tg-input w-full p-4 rounded-tg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoComplete="tel"
              autoFocus
            />
            <p className="text-xs text-tg-gray-500 dark:text-tg-gray-400 mt-1">
              Введите номер телефона, привязанный к Telegram
            </p>
          </div>

          <button
            onClick={handleSendCode}
            disabled={loading || !phoneNumber}
            className="bg-black cursor-pointer tg-button w-full p-4 from-tg-blue-500 to-tg-blue-600 text-white rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-tg-blue-600 hover:to-tg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-tg-md"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Отправка...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Send className="w-5 h-5 mr-2" />
                Отправить код
              </div>
            )}
          </button>
        </div>
      )}

      {step === 'code' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-tg-dark-700 dark:text-tg-gray-300 mb-2">
              <Key className="w-4 h-4 inline mr-2" />
              Код подтверждения
            </label>
            <input
              type="text"
              value={phoneCode}
              onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, ''))}
              placeholder="12345"
              maxLength={6}
              className="tg-input w-full p-4 rounded-tg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-mono"
              autoComplete="one-time-code"
              autoFocus
            />
            <p className="text-xs text-tg-gray-500 dark:text-tg-gray-400 mt-1">
              Введите код из SMS или Telegram
            </p>
          </div>

          <button
            onClick={handleVerifyCode}
            disabled={loading || !phoneCode}
            className="tg-button w-full p-4 bg-gradient-to-r from-tg-blue-500 to-tg-blue-600 text-white rounded-tg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-tg-blue-600 hover:to-tg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-tg-md"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Проверка...
              </div>
            ) : (
              'Подтвердить'
            )}
          </button>
          
          <button
            onClick={() => {
              setStep('phone');
              setError(null);
            }}
            className="w-full p-3 text-tg-blue-600 dark:text-tg-blue-400 bg-transparent border border-tg-blue-600 dark:border-tg-blue-400 rounded-tg font-medium hover:bg-tg-blue-50 dark:hover:bg-tg-blue-900/20 transition-colors"
          >
            Отправить код повторно
          </button>
        </div>
      )}

      {step === 'password' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-tg-dark-700 dark:text-tg-gray-300 mb-2">
              <Lock className="w-4 h-4 inline mr-2" />
              Пароль двухфакторной аутентификации
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              className="tg-input w-full p-4 rounded-tg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoComplete="current-password"
              autoFocus
            />
            <p className="text-xs text-tg-gray-500 dark:text-tg-gray-400 mt-1">
              Пароль для входа в Telegram (если настроен)
            </p>
          </div>

          <button
            onClick={handleVerifyPassword}
            disabled={loading || !password}
            className="bg-black cursor-pointer tg-button w-full p-4 from-tg-blue-500 to-tg-blue-600 text-white rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-tg-blue-600 hover:to-tg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-tg-md"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Вход...
              </div>
            ) : (
              'Войти'
            )}
          </button>
        </div>
      )}

      {/* Progress indicator */}
      <div className="flex justify-center space-x-2 mt-8">
        {['phone', 'code', 'password'].map((stepName, index) => {
          const currentIndex = ['phone', 'code', 'password'].indexOf(step);
          const stepIndex = index;
          
          return (
            <div
              key={stepName}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                stepIndex <= currentIndex 
                  ? 'bg-tg-blue-500' 
                  : 'bg-tg-gray-300 dark:bg-tg-dark-600'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}; 