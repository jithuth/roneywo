import React from 'react';
import { UnlockStep } from '../types';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';

interface StepWizardProps {
  currentStep: UnlockStep;
}

const steps = [
  { id: UnlockStep.SELECTION, label: "Device Info" },
  { id: UnlockStep.AUTH, label: "Account" },
  { id: UnlockStep.PAYMENT, label: "Payment" },
  { id: UnlockStep.CONFIRMATION, label: "Verification" },
];

export const StepWizard: React.FC<StepWizardProps> = ({ currentStep }) => {
  return (
    <div className="w-full max-w-4xl mx-auto mb-8 px-4">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-slate-800 -z-10 rounded-full"></div>
        
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <div key={step.id} className="flex flex-col items-center gap-2 bg-slate-900 px-2">
              <div 
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                  ${isCompleted ? 'bg-green-500 border-green-500 text-white' : ''}
                  ${isCurrent ? 'bg-brand-600 border-brand-500 text-white shadow-[0_0_15px_rgba(14,165,233,0.5)]' : ''}
                  ${!isCompleted && !isCurrent ? 'bg-slate-800 border-slate-700 text-slate-500' : ''}
                `}
              >
                {isCompleted ? (
                  <CheckCircle size={20} />
                ) : (
                  <span className="font-bold text-sm">{step.id}</span>
                )}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${isCurrent ? 'text-brand-400' : 'text-slate-500'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};