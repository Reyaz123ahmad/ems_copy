import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateCompany } from '../../hooks/useCompany.js';
import { usePlans } from '../../hooks/useSubscription.js';
import { StepWizard } from '../../components/shared/StepWizard.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Building2, ArrowLeft, Check, Sparkles } from 'lucide-react';

export function CreateCompanyPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Selected Plan state
  const [selectedPlanId, setSelectedPlanId] = useState('');

  // Step 1 Form Data
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    email: '',
    phone: '',
    address: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPhone: ''
  });

  const { data: plans = [], isLoading: isLoadingPlans } = usePlans();
  const createCompanyMutation = useCreateCompany();

  // Auto-select first plan when loaded if not selected yet
  useEffect(() => {
    if (plans && plans.length > 0 && !selectedPlanId) {
      const defaultPlan = plans.find(p => p.name?.toUpperCase().includes('PRO') || p.name?.toUpperCase().includes('TRIAL')) || plans[0];
      setSelectedPlanId(defaultPlan.id);
    }
  }, [plans, selectedPlanId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStep1Next = () => {
    setErrorMsg('');
    if (!formData.name || !formData.domain || !formData.email || !formData.adminFirstName || !formData.adminLastName || !formData.adminEmail) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    setCurrentStep(2);
  };

  const handleCreateCompany = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await createCompanyMutation.mutateAsync({
        companyData: {
          name: formData.name,
          domain: formData.domain.toLowerCase().trim(),
          email: formData.email.toLowerCase().trim(),
          phone: formData.phone || undefined,
          address: formData.address || undefined
        },
        adminData: {
          firstName: formData.adminFirstName,
          lastName: formData.adminLastName,
          email: formData.adminEmail.toLowerCase().trim(),
          phone: formData.adminPhone || undefined
        },
        planId: selectedPlanId || undefined
      });

      setSuccessMsg('Company and Administrator account provisioned successfully! Redirecting...');
      setTimeout(() => {
        navigate('/companies');
      }, 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Company creation failed.');
    }
  };

  const steps = [
    {
      id: 'company-info',
      title: 'Company & Admin Details',
      description: 'Organization setup and master admin info'
    },
    {
      id: 'plan-selection',
      title: 'Subscription Tier',
      description: 'Choose plan and finalize provisioning'
    }
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Create New Organization</h1>
          <p className="text-sm text-slate-400 mt-1">
            Provision a new company tenant with default headquarters, department, shifts, and administrator.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/companies')}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Companies
        </Button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-red-400 hover:text-red-300">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-emerald-300">✕</button>
        </div>
      )}

      <StepWizard
        steps={steps}
        currentStep={currentStep}
        onNext={handleStep1Next}
        onBack={() => setCurrentStep(1)}
        onSubmit={handleCreateCompany}
        isSubmitting={createCompanyMutation.isPending}
        nextLabel="Continue to Plan Selection"
        submitLabel="Provision Company & Admin"
        canGoNext={
          Boolean(
            formData.name &&
            formData.domain &&
            formData.email &&
            formData.adminFirstName &&
            formData.adminLastName &&
            formData.adminEmail
          )
        }
      >
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Company Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Company Name *</label>
                  <Input
                    name="name"
                    placeholder="Acme Corporation"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Company Domain *</label>
                  <Input
                    name="domain"
                    placeholder="acme.com"
                    value={formData.domain}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Official Company Email *</label>
                  <Input
                    type="email"
                    name="email"
                    placeholder="contact@acme.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phone Number</label>
                  <Input
                    name="phone"
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Registered Address</label>
                  <Input
                    name="address"
                    placeholder="Tower B, Cyber City, Gurgaon, HR"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Primary Administrator Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Admin First Name *</label>
                  <Input
                    name="adminFirstName"
                    placeholder="John"
                    value={formData.adminFirstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Admin Last Name *</label>
                  <Input
                    name="adminLastName"
                    placeholder="Doe"
                    value={formData.adminLastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Admin Email *</label>
                  <Input
                    type="email"
                    name="adminEmail"
                    placeholder="admin@acme.com"
                    value={formData.adminEmail}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Admin Phone</label>
                  <Input
                    name="adminPhone"
                    placeholder="+91 9876543211"
                    value={formData.adminPhone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-slate-200 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Select Subscription Plan
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Choose the initial tier for this tenant. You can upgrade or modify limits at any time from Subscription settings.
              </p>

              {isLoadingPlans ? (
                <div className="py-12 text-center text-slate-400">Loading available plans...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {plans.map((plan) => {
                    const isSelected = selectedPlanId === plan.id;
                    const isPro = plan.name?.toUpperCase().includes('PRO') || plan.name?.toUpperCase().includes('ENTERPRISE');
                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`cursor-pointer rounded-2xl p-5 border transition-all relative flex flex-col justify-between ${
                          isSelected
                            ? 'bg-blue-600/15 border-blue-500 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/30'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                        }`}
                      >
                        {isPro && (
                          <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500 text-white flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Popular
                          </span>
                        )}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-white text-base">{plan.name}</h3>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                              isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-600'
                            }`}>
                              {isSelected && <Check className="w-3 h-3" />}
                            </div>
                          </div>
                          <p className="text-xs text-slate-400 mb-4">{plan.description || 'Full employee management toolkit'}</p>
                          <div className="text-xl font-bold text-white mb-4">
                            ₹{plan.price || 0}
                            <span className="text-xs font-normal text-slate-400"> / month</span>
                          </div>

                          <ul className="space-y-2 text-xs text-slate-300">
                            <li className="flex items-center gap-2">
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              Up to {plan.maxEmployees || 'Unlimited'} Employees
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              Up to {plan.maxBranches || 'Unlimited'} Branches
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              Attendance & Shift Scheduling
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              Payroll & Automated Reports
                            </li>
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-300 space-y-1">
              <div className="font-semibold text-white">Summary Review:</div>
              <div>Tenant: <span className="text-white font-medium">{formData.name}</span> ({formData.domain})</div>
              <div>Master Admin: <span className="text-white font-medium">{formData.adminFirstName} {formData.adminLastName}</span> ({formData.adminEmail})</div>
            </div>
          </div>
        )}
      </StepWizard>
    </div>
  );
}

export default CreateCompanyPage;
