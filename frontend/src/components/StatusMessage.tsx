import React from 'react';
import { CheckCircle, AlertCircle, XCircle, Info, Loader2 } from 'lucide-react';

interface StatusMessageProps {
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  title?: string;
  message: string;
  className?: string;
}

export const StatusMessage: React.FC<StatusMessageProps> = ({
  type,
  title,
  message,
  className = ''
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
      case 'loading':
        return <Loader2 className="w-5 h-5 animate-spin" />;
    }
  };

  const getStyles = () => {
    const baseStyles = "rounded-lg p-4 flex items-start space-x-3 transition-all duration-300";
    
    switch (type) {
      case 'success':
        return `${baseStyles} light-theme-success dark:bg-green-900/30 text-white dark:text-green-300`;
      case 'error':
        return `${baseStyles} light-theme-error dark:bg-red-900/30 text-white dark:text-red-300`;
      case 'warning':
        return `${baseStyles} light-theme-warning dark:bg-yellow-900/30 text-white dark:text-yellow-300`;
      case 'info':
        return `${baseStyles} light-theme-info dark:bg-blue-900/30 text-white dark:text-blue-300`;
      case 'loading':
        return `${baseStyles} light-theme-glass dark:bg-gray-800 light-theme-text-primary dark:text-gray-100`;
    }
  };

  return (
    <div className={`${getStyles()} ${className}`}>
      <div className="flex-shrink-0">
        {getIcon()}
      </div>
      <div className="flex-1">
        {title && (
          <h4 className="font-semibold mb-1">
            {title}
          </h4>
        )}
        <p className="text-sm opacity-90">
          {message}
        </p>
      </div>
    </div>
  );
}; 