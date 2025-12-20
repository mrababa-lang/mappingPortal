
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Sparkles, ChevronLeft, ChevronRight, ChevronDown, Search, Check, Info, FileX, Clock } from 'lucide-react';

// --- Skeleton Loader ---
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`}></div>
);

export const TableSkeleton: React.FC<{ rows?: number, cols?: number }> = ({ rows = 5, cols = 4 }) => (
  <div className="w-full space-y-4 p-4">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="flex gap-4">
        {[...Array(cols)].map((_, j) => (
          <Skeleton key={j} className="h-10 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export const CardSkeleton: React.FC = () => (
  <div className="p-6 bg-white rounded-xl border border-slate-200 space-y-4">
    <div className="flex justify-between">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-8 rounded-lg" />
    </div>
    <Skeleton className="h-8 w-16" />
    <Skeleton className="h-2 w-full" />
  </div>
);

// --- Highlight Text ---
export const HighlightText: React.FC<{ text: string; highlight: string }> = ({ text, highlight }) => {
  if (!highlight.trim()) return <span>{text}</span>;
  
  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <span>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <mark key={i} className="bg-rose-100 text-rose-900 rounded-sm px-0.5 font-semibold">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

// --- Card ---
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200/60 ${className}`} {...props}>
    {children}
  </div>
);

// --- Empty State ---
export const EmptyState: React.FC<{ 
  icon?: React.ElementType, 
  title: string, 
  description: string, 
  action?: React.ReactNode 
}> = ({ icon: Icon = FileX, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
    <div className="p-4 bg-white rounded-full shadow-sm mb-4">
      <Icon size={32} className="text-slate-400" />
    </div>
    <h3 className="text-base font-semibold text-slate-900">{title}</h3>
    <p className="text-sm text-slate-500 mt-2 max-w-sm mb-6 leading-relaxed">{description}</p>
    {action}
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

// --- Switch ---
export const Switch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }> = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => !disabled && onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
      checked ? 'bg-indigo-600' : 'bg-slate-200'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

// --- Info Tooltip ---
export const InfoTooltip: React.FC<{ text: React.ReactNode }> = ({ text }) => (
  <div className="group relative flex items-center justify-center cursor-help text-slate-400 hover:text-indigo-500 transition-colors">
    <Info size={18} />
    <div className="absolute top-full mt-2 right-0 w-max max-w-[200px] px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none text-center leading-relaxed">
      {text}
      <div className="absolute bottom-full right-1.5 border-4 border-transparent border-b-slate-800"></div>
    </div>
  </div>
);

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ label, error, className = '', ...props }, ref) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-baseline">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">{label}</label>
      {error && <span className="text-xs text-red-500 font-medium animate-in fade-in slide-in-from-right-1">{error}</span>}
    </div>
    <input 
      ref={ref}
      className={`w-full px-4 py-2.5 bg-slate-50 border rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 transition-all ${
        error 
          ? 'border-red-300 focus:ring-red-200 focus:border-red-500' 
          : 'border-slate-200 focus:ring-slash-red/20 focus:border-slash-red/50'
      } ${className}`}
      {...props}
    />
  </div>
));
Input.displayName = 'Input';

// --- TextArea ---
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}
export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(({ label, error, className = '', ...props }, ref) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-baseline">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">{label}</label>
      {error && <span className="text-xs text-red-500 font-medium animate-in fade-in slide-in-from-right-1">{error}</span>}
    </div>
    <textarea 
      ref={ref}
      className={`w-full px-4 py-2.5 bg-slate-50 border rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 transition-all min-h-[100px] ${
        error 
          ? 'border-red-300 focus:ring-red-200 focus:border-red-500' 
          : 'border-slate-200 focus:ring-slash-red/20 focus:border-slash-red/50'
      } ${className}`}
      {...props}
    />
  </div>
));
TextArea.displayName = 'TextArea';

// --- Select ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ label, options, error, className = '', ...props }, ref) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-baseline">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">{label}</label>
      {error && <span className="text-xs text-red-500 font-medium animate-in fade-in slide-in-from-right-1">{error}</span>}
    </div>
    <div className="relative">
      <select 
        ref={ref}
        className={`w-full px-4 py-2.5 bg-slate-50 border rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 transition-all appearance-none ${
          error 
            ? 'border-red-300 focus:ring-red-200 focus:border-red-500' 
            : 'border-slate-200 focus:ring-slash-red/20 focus:border-slash-red/50'
        } ${className}`}
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
  error?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({ 
  label, value, onChange, options, placeholder = "Select...", disabled, className = '', error 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const clickedInsideInput = wrapperRef.current && wrapperRef.current.contains(target);
      const clickedInsideDropdown = dropdownRef.current && dropdownRef.current.contains(target);
      if (!clickedInsideInput && !clickedInsideDropdown) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef, dropdownRef]);

  useEffect(() => {
    const handleScroll = () => { if (isOpen) setIsOpen(false); };
    if (isOpen) window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen && selectedOption) setSearchTerm(selectedOption.label);
    else if (!isOpen && !selectedOption) setSearchTerm('');
  }, [isOpen, selectedOption]);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`space-y-1.5 ${className}`} ref={wrapperRef}>
      <div className="flex justify-between items-baseline">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">{label}</label>
        {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
      </div>
      <div className="relative">
        <div 
          className={`flex items-center w-full bg-slate-50 border rounded-lg transition-all ${
            error 
              ? 'border-red-300 focus-within:ring-red-200 focus-within:border-red-500' 
              : 'border-slate-200 focus-within:ring-2 focus-within:ring-slash-red/20 focus-within:border-slash-red/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Search size={16} className={`ml-3 shrink-0 ${error ? 'text-red-300' : 'text-slate-400'}`} />
          <input
            type="text"
            className="w-full px-3 py-2.5 bg-transparent border-none focus:outline-none text-slate-900 text-sm placeholder:text-slate-400"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true); }}
            onFocus={() => { setIsOpen(true); setSearchTerm(''); }}
            disabled={disabled}
          />
          <div className="mr-3 text-slate-400 cursor-pointer" onClick={() => !disabled && setIsOpen(!isOpen)}>
            <ChevronDown size={16} />
          </div>
        </div>
        {isOpen && !disabled && createPortal(
          <div 
            ref={dropdownRef}
            className="fixed z-[9999] bg-white border border-slate-200 rounded-lg shadow-xl overflow-y-auto animate-in fade-in zoom-in-95 duration-100"
            style={{ top: coords.top, left: coords.left, width: coords.width, maxHeight: '240px' }}
          >
            {filteredOptions.length > 0 ? (
              <ul className="py-1">
                {filteredOptions.map((opt) => (
                  <li 
                    key={opt.value}
                    className={`px-4 py-2 text-sm cursor-pointer flex items-center justify-between group hover:bg-slate-50 ${opt.value === value ? 'bg-slate-50 text-slate-900 font-medium' : 'text-slate-600'}`}
                    onClick={() => { onChange(opt.value); setIsOpen(false); setSearchTerm(opt.label); }}
                  >
                    {opt.label}
                    {opt.value === value && <Check size={14} className="text-emerald-500" />}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-3 text-sm text-slate-400 text-center">No matching results</div>
            )}
          </div>, document.body
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
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <h3 className="font-bold text-lg text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[85vh]">{children}</div>
        {footer && <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
};

// --- Table ---
export const TableHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <thead className={`bg-slate-50 border-b border-slate-200 sticky top-0 z-10 ${className}`}>
    <tr>{children}</tr>
  </thead>
);

export const TableRow: React.FC<{ children: React.ReactNode; onClick?: () => void; className?: string }> = ({ children, onClick, className = '' }) => (
  <tr onClick={onClick} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-0 cursor-pointer ${className}`}>{children}</tr>
);

export const TableHead: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <th className={`px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider ${className}`}>{children}</th>
);

export const TableCell: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <td className={`px-6 py-4 text-sm text-slate-600 whitespace-nowrap ${className}`}>{children}</td>
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
         <Button variant="secondary" className="px-2 h-8 text-xs" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
           <ChevronLeft size={14} /> Previous
         </Button>
         <Button variant="secondary" className="px-2 h-8 text-xs" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
           Next <ChevronRight size={14} />
         </Button>
       </div>
    </div>
  );
};
