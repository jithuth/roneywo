import React, { useState } from 'react';
import { RouterData, User, UnlockStep, WalletInfo } from '../types';
import { StepWizard } from './StepWizard';
import { RouterSelection } from './RouterSelection';
import { AuthForm } from './AuthForm';
import { PaymentDisplay } from './PaymentDisplay';
import { UploadConfirmation } from './UploadConfirmation';
import { Shield, Zap } from 'lucide-react';

interface Props {
  user: User;
  onUserLogin: (user: User) => void;
}

export const UnlockWizard: React.FC<Props> = ({ user, onUserLogin }) => {
  const [currentStep, setCurrentStep] = useState<UnlockStep>(UnlockStep.SELECTION);
  
  const [routerData, setRouterData] = useState<RouterData>({
    country: '',
    brand: '',
    model: '',
    imei: ''
  });
  
  const [selectedWallet, setSelectedWallet] = useState<WalletInfo | null>(null);

  const handleRouterDataUpdate = (data: RouterData) => setRouterData(data);
  const nextStep = () => setCurrentStep(prev => prev + 1);

  const handlePaymentSelect = (wallet: WalletInfo) => {
    setSelectedWallet(wallet);
    nextStep();
  }

  const handleCompletion = () => {
    setCurrentStep(UnlockStep.SUCCESS);
  };

  const handleLoginStep = (loggedInUser: User) => {
    onUserLogin(loggedInUser);
    nextStep();
  };

  if (currentStep === UnlockStep.SUCCESS) {
    return (
      <div className="max-w-lg w-full text-center space-y-6 animate-in zoom-in-95 duration-700 mt-10 mx-auto">
        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto ring-4 ring-green-500/20">
          <Shield className="text-green-500 w-12 h-12" />
        </div>
        <h1 className="text-4xl font-bold text-white">Request Received!</h1>
        <p className="text-slate-400 text-lg">
          We have received your payment proof and unlock request for the 
          <span className="text-white font-semibold"> {routerData.brand} {routerData.model}</span>.
        </p>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <p className="text-sm text-slate-300">
            A confirmation email will be sent to <span className="text-brand-400">{user.email}</span>.
            We will update you within the estimated time frame.
          </p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="text-slate-500 hover:text-white underline transition-colors"
        >
          Unlock another device
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Unlock Your Router</h1>
          <p className="text-slate-400 max-w-lg mx-auto">
            Freedom for your device. Compatible with all major global carriers and brands.
          </p>
        </div>

        <StepWizard currentStep={currentStep} />

        <div className="mt-8">
          {currentStep === UnlockStep.SELECTION && (
            <RouterSelection 
              data={routerData} 
              onUpdate={handleRouterDataUpdate} 
              onNext={nextStep}
            />
          )}
          
          {currentStep === UnlockStep.AUTH && (
            <AuthForm onLogin={handleLoginStep} />
          )}
          
          {currentStep === UnlockStep.PAYMENT && (
            <PaymentDisplay onNext={handlePaymentSelect} />
          )}
          
          {currentStep === UnlockStep.CONFIRMATION && (
            <UploadConfirmation 
                user={user}
                routerData={routerData}
                selectedWallet={selectedWallet}
                onComplete={handleCompletion} 
            />
          )}
        </div>
    </div>
  );
};