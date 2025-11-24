import React, { useState, useEffect } from 'react';
import { RouterData, TechnicalAnalysis } from '../types';
import { COUNTRIES, BRANDS } from '../constants';
import { analyzeRouterUnlock } from '../services/geminiService';
import { fetchCountries, fetchBrands } from '../services/supabaseService';
import { Globe, Cpu, Hash, Activity, Search } from 'lucide-react';

interface Props {
  data: RouterData;
  onUpdate: (data: RouterData) => void;
  onNext: () => void;
}

export const RouterSelection: React.FC<Props> = ({ data, onUpdate, onNext }) => {
  const [analysis, setAnalysis] = useState<TechnicalAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof RouterData, string>>>({});
  
  // Initialize as empty to allow the useEffect condition to trigger correctly
  const [countryList, setCountryList] = useState<string[]>([]);
  const [brandList, setBrandList] = useState<string[]>([]);

  useEffect(() => {
    const loadDropdownData = async () => {
      // Only fetch if the list is empty to prevent redundant calls
      if (countryList.length === 0) {
        const fetchedCountries = await fetchCountries();
        if (fetchedCountries && fetchedCountries.length > 0) {
          setCountryList(fetchedCountries);
        }
      }

      if (brandList.length === 0) {
        const fetchedBrands = await fetchBrands();
        if (fetchedBrands && fetchedBrands.length > 0) {
          setBrandList(fetchedBrands);
        }
      }
    };
    loadDropdownData();
  }, []); // Empty dependency array ensures this runs once on mount

  // Use constants as fallback while loading or if fetch failed/returned empty
  const displayCountries = countryList.length > 0 ? countryList : COUNTRIES;
  const displayBrands = brandList.length > 0 ? brandList : BRANDS;

  const validate = () => {
    const newErrors: Partial<Record<keyof RouterData, string>> = {};
    if (!data.country) newErrors.country = "Country is required";
    if (!data.brand) newErrors.brand = "Brand is required";
    if (!data.model) newErrors.model = "Model is required";
    if (!data.imei || data.imei.length < 15) newErrors.imei = "Valid 15-digit IMEI is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAnalysis = async () => {
    if (!validate()) return;
    
    setIsLoading(true);
    try {
      const result = await analyzeRouterUnlock(data);
      setAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof RouterData, value: string) => {
    onUpdate({ ...data, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 p-6 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Globe className="text-brand-400" />
          Router Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Country Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Origin Country</label>
            <div className="relative">
              <select 
                value={data.country}
                onChange={(e) => handleChange('country', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-500 focus:outline-none appearance-none"
              >
                <option value="">Select Country</option>
                {displayCountries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
            {errors.country && <p className="text-red-400 text-xs">{errors.country}</p>}
          </div>

          {/* Brand Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Brand</label>
            <div className="relative">
              <select 
                value={data.brand}
                onChange={(e) => handleChange('brand', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-500 focus:outline-none appearance-none"
              >
                <option value="">Select Brand</option>
                {displayBrands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
            {errors.brand && <p className="text-red-400 text-xs">{errors.brand}</p>}
          </div>

          {/* Model Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Model Number</label>
            <div className="relative">
              <Cpu className="absolute left-3 top-3.5 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="e.g. E5573s-320"
                value={data.model}
                onChange={(e) => handleChange('model', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 p-3 text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            {errors.model && <p className="text-red-400 text-xs">{errors.model}</p>}
          </div>

          {/* IMEI Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">IMEI Number (15 Digits)</label>
            <div className="relative">
              <Hash className="absolute left-3 top-3.5 text-slate-500" size={18} />
              <input 
                type="text" 
                maxLength={15}
                placeholder="123456789012345"
                value={data.imei}
                onChange={(e) => handleChange('imei', e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 p-3 text-white focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono"
              />
            </div>
            {errors.imei && <p className="text-red-400 text-xs">{errors.imei}</p>}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col md:flex-row gap-4">
          <button
            onClick={handleAnalysis}
            disabled={isLoading}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white p-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Search size={18} />
            )}
            Check Eligibility
          </button>
        </div>
      </div>

      {/* Analysis Result */}
      {analysis && (
        <div className="bg-gradient-to-br from-brand-900/50 to-purple-900/50 border border-brand-500/30 p-6 rounded-2xl animate-in zoom-in-95 duration-300">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="text-green-400" />
            Device Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
              <span className="text-slate-400 text-xs uppercase tracking-wider">Success Rate</span>
              <p className="text-2xl font-bold text-green-400">{analysis.successRate}</p>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
              <span className="text-slate-400 text-xs uppercase tracking-wider">Estimated Time</span>
              <p className="text-xl font-bold text-white">{analysis.estimatedTime}</p>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
              <span className="text-slate-400 text-xs uppercase tracking-wider">Difficulty</span>
              <p className={`text-xl font-bold ${
                  analysis.difficulty === 'Manual Review' 
                    ? 'text-yellow-400' 
                    : analysis.difficulty === 'Hard' || analysis.difficulty === 'Complex'
                        ? 'text-red-400'
                        : 'text-brand-300'
              }`}>
                {analysis.difficulty}
              </p>
            </div>
          </div>
          <p className="text-slate-300 text-sm italic border-l-2 border-brand-500 pl-4">
            "{analysis.message}"
          </p>
          
          <button
            onClick={onNext}
            className="w-full mt-6 bg-brand-600 hover:bg-brand-500 text-white p-4 rounded-xl font-bold text-lg shadow-lg shadow-brand-500/20 transition-all transform hover:scale-[1.01]"
          >
            Proceed to Unlock
          </button>
        </div>
      )}
    </div>
  );
};
