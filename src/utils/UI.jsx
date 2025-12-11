import React, { useState } from 'react';
import { ChevronDown, X, AlertTriangle, Database, RefreshCw, Check, UploadCloud, Box, ChevronLeft, ChevronRight, Edit } from 'lucide-react';

// 1. Button
export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }) {
  const baseStyle = "inline-flex items-center border font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
    outline: "border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500",
    danger: "border-transparent text-white bg-red-600 hover:bg-red-700 focus:ring-red-500",
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded",
    md: "px-4 py-2 text-sm rounded-md",
    lg: "px-6 py-3 text-base rounded-md",
    icon: "p-2 text-sm rounded-md",
  };

  const combinedClassName = `${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`;
  
  return (
    <button className={combinedClassName} {...props}>
      {children}
    </button>
  );
}

// 2. Modal
export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>
      
      {/* 模态框内容 */}
      <div className="relative bg-white w-full max-w-5xl p-6 rounded-2xl shadow-xl m-4 transition-all transform scale-100 opacity-100">
        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          <Button variant="outline" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="mt-5 max-h-[70vh] overflow-y-auto pr-2">
          {children}
        </div>
      </div>
    </div>
  );
}

// 3. Loader
export function Loader({ className = 'w-5 h-5 text-white' }) {
  return (
    <svg 
      className={`animate-spin ${className}`} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      ></circle>
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}

// 4. useModal
export function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [props, setProps] = useState(null);

  const open = (modalProps = null) => {
    setProps(modalProps);
    setIsOpen(true);
  };
  
  const close = () => {
    setIsOpen(false);
    setProps(null);
  };

  return { isOpen, open, close, props };
}

// 5. InputGroup helper
export const InputGroup = ({ label, children, className = '' }) => (
    <div className={className}>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {children}
    </div>
);

// 6. Dropdown for Formula Field Helper
export const Dropdown = ({ label, options, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative inline-block text-left">
            <Button type="button" variant="outline" onClick={() => setIsOpen(!isOpen)} className="justify-center">
                {label} <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
            </Button>

            {isOpen && (
                <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                        {options.length === 0 ? (
                            <div className="block px-4 py-2 text-sm text-gray-500">无数字字段</div>
                        ) : (
                            options.map(option => (
                                <button
                                    key={option}
                                    onClick={() => { onSelect(option); setIsOpen(false); }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    {option}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// 7. LoadingScreen
export function LoadingScreen({ message = "加载中..." }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <Loader className="w-8 h-8 text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}

// 8. Tabs
export function Tabs({ tabs, activeTab, onTabChange, className = '' }) {
  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                ${isActive
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <Icon
                className={`
                  mr-2 h-5 w-5
                  ${isActive
                    ? 'text-blue-500'
                    : 'text-gray-400 group-hover:text-gray-500'
                  }
                `}
              />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// 9. Toast Notification
const ToastContext = React.createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type };
    setToasts(prev => [...prev, toast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 min-w-[300px] max-w-[500px] animate-slide-down ${
              toast.type === 'error' 
                ? 'bg-red-100 border border-red-300 text-red-700' 
                : toast.type === 'success'
                ? 'bg-green-100 border border-green-300 text-green-700'
                : 'bg-blue-100 border border-blue-300 text-blue-700'
            }`}
          >
            {toast.type === 'error' && <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
            {toast.type === 'success' && <Check className="w-5 h-5 flex-shrink-0" />}
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    // 如果没有ToastProvider，使用简单的alert作为fallback
    return {
      showToast: (message, type) => {
        if (type === 'error') {
          alert(message);
        } else {
          console.log(`[${type}]`, message);
        }
      }
    };
  }
  return context;
}

// 10. Icons export
export { 
  User, 
  Lock, 
  LogOut, 
  FileText, 
  Folder, 
  Plus, 
  ChevronDown, 
  ChevronRight,
  ChevronLeft,
  Trash2,
  Download,
  Upload,
  Eye,
  Settings,
  Users,
  X,
  AlertTriangle,
  Database,
  RefreshCw,
  Check,
  UploadCloud,
  Box,
  Archive,
  Edit,
  Loader as Spinner
} from 'lucide-react';