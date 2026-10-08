import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateEmployee, useRoles } from '../../hooks/useEmployee.js';
import { useShifts } from '../../hooks/useShifts.js';
import { useAuthStore } from '../../store/auth.store.js';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { UserPlus, ArrowLeft } from 'lucide-react';

export function CreateEmployeePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { data: shiftsData } = useShifts();
  const shifts = Array.isArray(shiftsData)
    ? shiftsData
    : Array.isArray(shiftsData?.shifts)
    ? shiftsData.shifts
    : Array.isArray(shiftsData?.data?.shifts)
    ? shiftsData.data.shifts
    : Array.isArray(shiftsData?.data)
    ? shiftsData.data
    : [];

  const { data: rolesData } = useRoles();
  const rawRoles = Array.isArray(rolesData)
    ? rolesData
    : Array.isArray(rolesData?.data)
    ? rolesData.data
    : [];

  const userRoles = Array.isArray(user?.roles)
    ? user.roles
    : user?.role
    ? [user.role]
    : ['EMPLOYEE'];
  const isSuper = userRoles.includes('SUPER_ADMIN');
  const isCompanyAdmin = userRoles.includes('COMPANY_ADMIN');
  const isHRAdmin = userRoles.includes('HR_ADMIN');
  const isHRManager = userRoles.includes('HR_MANAGER');

  const allowedRoleNames = isSuper || isCompanyAdmin
    ? ['HR_ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE']
    : isHRAdmin
    ? ['HR_MANAGER', 'MANAGER', 'EMPLOYEE']
    : isHRManager
    ? ['EMPLOYEE']
    : ['EMPLOYEE'];

  const allowedRoles = rawRoles.filter((r) => allowedRoleNames.includes(r.name));

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: 'Engineering',
    employmentType: 'FULL_TIME',
    shiftId: '',
    roleId: '',
    employeeCode: '',
    joiningDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (allowedRoles.length > 0 && !formData.roleId) {
      const defaultRole = allowedRoles.find((r) => r.name === 'EMPLOYEE') || allowedRoles[0];
      if (defaultRole) {
        setFormData((prev) => ({ ...prev, roleId: defaultRole.id }));
      }
    }
  }, [allowedRoles, formData.roleId]);

  const createEmployeeMutation = useCreateEmployee();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.firstName || !formData.lastName || !formData.email) {
      setErrorMsg('Please fill in all required fields (First Name, Last Name, Email).');
      return;
    }

    try {
      const payload = {
        employeeData: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email.toLowerCase().trim(),
          phone: formData.phone || undefined,
          employmentType: formData.employmentType,
          shiftId: formData.shiftId || undefined,
          roleId: formData.roleId || undefined,
          employeeCode: formData.employeeCode || undefined,
          joiningDate: formData.joiningDate
        }
      };

      await createEmployeeMutation.mutateAsync(payload);
      setSuccessMsg('Employee created successfully! Redirecting...');
      setTimeout(() => {
        navigate('/employees');
      }, 1200);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to create employee.');
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Onboard New Employee</h1>
          <p className="text-sm text-slate-400 mt-1">
            Add an employee to your organization with direct portal access and leave quotas.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/employees')}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Employees
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

      <form onSubmit={handleCreateEmployee} className="space-y-6 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Personal Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">First Name *</label>
              <Input
                name="firstName"
                placeholder="Alice"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Last Name *</label>
              <Input
                name="lastName"
                placeholder="Smith"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address *</label>
              <Input
                type="email"
                name="email"
                placeholder="alice.smith@example.com"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phone Number</label>
              <Input
                type="tel"
                name="phone"
                placeholder="+91 9876543210"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800">
          <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Employment & System Role
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">System Access Role *</label>
              <select
                name="roleId"
                value={formData.roleId}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                required
              >
                {allowedRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.displayName || r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Shift Assignment</label>
              <select
                name="shiftId"
                value={formData.shiftId}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="">Default Company Shift</option>
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.startTime} - {s.endTime})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Employment Type</label>
              <select
                name="employmentType"
                value={formData.employmentType}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="FULL_TIME">Full-time</option>
                <option value="PART_TIME">Part-time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERN">Intern</option>
                <option value="CONSULTANT">Consultant</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Joining Date</label>
              <Input
                type="date"
                name="joiningDate"
                value={formData.joiningDate}
                onChange={handleInputChange}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Custom Employee Code (Optional)</label>
              <Input
                name="employeeCode"
                placeholder="Auto-generated if left blank (e.g. EMP-0042)"
                value={formData.employeeCode}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={() => navigate('/employees')}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={createEmployeeMutation.isPending}
            disabled={!formData.firstName || !formData.lastName || !formData.email}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Create Employee
          </Button>
        </div>
      </form>
    </div>
  );
}

export default CreateEmployeePage;
