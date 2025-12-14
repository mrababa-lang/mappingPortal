import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Sparkles, ChevronLeft, ChevronRight, ChevronDown, Search, Check } from 'lucide-react';

// --- Card ---
export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200/60 ${className}`}>
    {children}
  </div>
);

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'ai';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, variant = 'primary', isLoading, className = '', ...props 
}) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 justify-center disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-900/10 active:scale-95",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-95",
    danger: "bg-white text-red-600 border border-red-100 hover:bg-red-50 hover:border-red-200 active:scale-95",
    ghost: "text-slate-500 hover:text-slate-800 hover:bg-slate-100",
    ai: "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-md shadow-indigo-500/20 active:scale-95"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} disabled={isLoading} {...props}>
      {isLoading && <Loader2 size={16} className="animate-spin" />}
      {!isLoading && variant === 'ai' && <Sparkles size={16} />}
      {children}
    </button>
  );
};

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ label, className = '', ...props }, ref) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">{label}</label>
    <input 
      ref={ref}
      className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slash-red/20 focus:border-slash-red/50 transition-all ${className}`}
      {...props}
    />
  </div>
));
Input.displayName = 'Input';

// --- TextArea ---
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}
export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(({ label, className = '', ...props }, ref) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">{label}</label>
    <textarea 
      ref={ref}
      className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slash-red/20 focus:border-slash-red/50 transition-all min-h-[100px] ${className}`}
      {...props}
    />
  </div>
));
TextArea.displayName = 'TextArea';

// --- Select ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ label, options, className = '', ...props }, ref) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">{label}</label>
    <div className="relative">
      <select 
        ref={ref}
        className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slash-red/20 focus:border-slash-red/50 transition-all appearance-none ${className}`}
        {...props}
      >
        <option value="" disabled>Select an option</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
        <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
      </div>
    </div>
  </div>
));
Select.displayName = 'Select';

// --- Searchable Select (Combobox) ---
interface SearchableSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({ 
  label, value, onChange, options, placeholder = "Select...", disabled, className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const selectedOption = options.find(opt => opt.value === value);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // Sync search term with value when closed, but clear when opened to search
  useEffect(() => {
    if (!isOpen && selectedOption) {
      setSearchTerm(selectedOption.label);
    } else if (!isOpen && !selectedOption) {
      setSearchTerm('');
    }
  }, [isOpen, selectedOption]);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`space-y-1.5 ${className}`} ref={wrapperRef}>
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">{label}</label>
      <div className="relative">
        <div 
          className={`flex items-center w-full bg-slate-50 border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-slash-red/20 focus-within:border-slash-red/50 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Search size={16} className="ml-3 text-slate-400 shrink-0" />
          <input
            type="text"
            className="w-full px-3 py-2.5 bg-transparent border-none focus:outline-none text-slate-900 text-sm placeholder:text-slate-400"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              setIsOpen(true);
              setSearchTerm(''); // Clear on focus to show all options
            }}
            disabled={disabled}
          />
          <div className="mr-3 text-slate-400 cursor-pointer" onClick={() => !disabled && setIsOpen(!isOpen)}>
            <ChevronDown size={16} />
          </div>
        </div>

        {/* Dropdown */}
        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
            {filteredOptions.length > 0 ? (
              <ul className="py-1">
                {filteredOptions.map((opt) => (
                  <li 
                    key={opt.value}
                    className={`px-4 py-2 text-sm cursor-pointer flex items-center justify-between group hover:bg-slate-50 ${opt.value === value ? 'bg-slate-50 text-slate-900 font-medium' : 'text-slate-600'}`}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearchTerm(opt.label);
                    }}
                  >
                    {opt.label}
                    {opt.value === value && <Check size={14} className="text-emerald-500" />}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-3 text-sm text-slate-400 text-center">
                No matching results
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


// --- Modal ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <h3 className="font-bold text-lg text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Table ---
export const TableHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <thead className="bg-slate-50 border-b border-slate-200">
    <tr>{children}</tr>
  </thead>
);

export const TableRow: React.FC<{ children: React.ReactNode; onClick?: () => void }> = ({ children, onClick }) => (
  <tr 
    onClick={onClick}
    className="border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-0 cursor-pointer"
  >
    {children}
  </tr>
);

export const TableHead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
    {children}
  </th>
);

export const TableCell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
    {children}
  </td>
);

// --- Pagination ---
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange, totalItems }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
       <span className="text-xs text-slate-500">
         Showing page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span> (<span className="font-medium">{totalItems}</span> items)
       </span>
       <div className="flex gap-2">
         <Button 
            variant="secondary" 
            className="px-2 h-8 text-xs" 
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
         >
           <ChevronLeft size={14} /> Previous
         </Button>
         <Button 
            variant="secondary" 
            className="px-2 h-8 text-xs"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
         >
           Next <ChevronRight size={14} />
         </Button>
       </div>
    </div>
  );
};