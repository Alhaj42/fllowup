import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Phase {
  id: string;
  name: string;
  startDate: string;
  duration: number;
  status: string;
}

interface TeamAssignmentFormProps {
  projectId: string;
  teamMember: TeamMember;
  phases: Phase[];
  currentAllocation: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function TeamAssignmentForm({
  projectId,
  teamMember,
  phases,
  currentAllocation,
  onSuccess,
  onCancel,
}: TeamAssignmentFormProps) {
  const [phaseId, setPhaseId] = useState('');
  const [role, setRole] = useState<string>('TEAM_MEMBER');
  const [workingPercentage, setWorkingPercentage] = useState<number>(10);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [overrideAllocation, setOverrideAllocation] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [warning, setWarning] = useState<string>('');

  useEffect(() => {
    // Set default start date to today
    if (!startDate) {
      setStartDate(new Date().toISOString().split('T')[0]);
    }
  }, []);

  useEffect(() => {
    // Calculate total allocation with new value
    const totalAllocation = currentAllocation + workingPercentage;
    const isOverallocated = totalAllocation > 100;

    if (isOverallocated && !overrideAllocation) {
      setWarning(`Warning: Team member will be over-allocated (${totalAllocation}%). Current: ${currentAllocation}%`);
    } else {
      setWarning('');
    }
  }, [workingPercentage, currentAllocation, overrideAllocation]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!phaseId) {
      newErrors.phase = 'Phase is required';
    }
    if (!role) {
      newErrors.role = 'Role is required';
    }
    if (!workingPercentage || workingPercentage < 0 || workingPercentage > 100) {
      newErrors.workingPercentage = 'Allocation must be between 0 and 100';
    }
    if (!startDate) {
      newErrors.startDate = 'Start date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Check over-allocation
    const totalAllocation = currentAllocation + workingPercentage;
    if (totalAllocation > 100 && !overrideAllocation) {
      setWarning(`Team member allocation would exceed 100% (${totalAllocation}%). Current: ${currentAllocation}%`);
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('');
    setErrors({});

    try {
      const payload = {
        phaseId,
        teamMemberId: teamMember.id,
        role,
        workingPercentage,
        startDate,
        endDate: endDate || null,
      };

      await api.post('/assignments', payload);
      setSuccessMessage('Assignment created successfully!');
      setIsSubmitting(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      setIsSubmitting(false);

      if (error.response?.status === 409) {
        setErrors({ submit: error.response.data?.error || 'Team member is already assigned to this phase' });
      } else if (error.response?.status === 404) {
        setErrors({ submit: error.response.data?.error || 'Phase or user not found' });
      } else if (error.response?.status === 400) {
        setErrors({ submit: error.response.data?.error || 'Invalid allocation' });
      } else {
        setErrors({ submit: 'Failed to create assignment. Please try again.' });
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Assign Team Member
        </h2>
        <p className="text-gray-600">
          {teamMember.name} ({teamMember.email})
        </p>
      </div>

      {/* Current Allocation Display */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-gray-700">
            Current Allocation: {currentAllocation}%
          </span>
          <span className={`text-lg font-bold ${currentAllocation > 90 ? 'text-red-600' : currentAllocation > 70 ? 'text-yellow-600' : 'text-green-600'}`}>
            {currentAllocation > 90 ? '⚠️' : currentAllocation > 70 ? '⚡' : '✓'}
          </span>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Warning Message */}
      {warning && (
        <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg">
          <div className="flex items-start">
            <span className="mr-2 text-xl">⚠️</span>
            <div>
              <p className="font-semibold">Over-Allocation Warning</p>
              <p className="text-sm">{warning}</p>

              {/* Override Checkbox */}
              {currentAllocation + workingPercentage > 100 && (
                <label className="flex items-center mt-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={overrideAllocation}
                    onChange={(e) => setOverrideAllocation(e.target.checked)}
                    className="mr-2 w-4 h-4 text-red-600 rounded focus:ring-red-500"
                  />
                  <span className="text-sm font-medium">
                    Override allocation limit (Manager approval required)
                  </span>
                </label>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Phase Selection */}
        <div>
          <label htmlFor="phase" className="block text-sm font-medium text-gray-700">
            Phase *
          </label>
          <select
            id="phase"
            value={phaseId}
            onChange={(e) => setPhaseId(e.target.value)}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 ${
              errors.phase ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
          >
            <option value="">Select a phase</option>
            {phases.map((phase) => (
              <option key={phase.id} value={phase.id}>
                {phase.name} ({new Date(phase.startDate).toLocaleDateString()})
              </option>
            ))}
          </select>
          {errors.phase && (
            <p className="mt-1 text-sm text-red-600">{errors.phase}</p>
          )}
        </div>

        {/* Role Selection */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
            Role *
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 ${
              errors.role ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
          >
            <option value="TEAM_MEMBER">Team Member</option>
            <option value="TEAM_LEADER">Team Leader</option>
          </select>
          {errors.role && (
            <p className="mt-1 text-sm text-red-600">{errors.role}</p>
          )}
        </div>

        {/* Allocation Percentage */}
        <div>
          <label htmlFor="workingPercentage" className="block text-sm font-medium text-gray-700">
            Allocation (%) *
          </label>
          <input
            type="number"
            id="workingPercentage"
            min="0"
            max="100"
            value={workingPercentage}
            onChange={(e) => setWorkingPercentage(parseInt(e.target.value))}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 ${
              errors.workingPercentage ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
            placeholder="Enter allocation percentage (0-100)"
          />
          {errors.workingPercentage && (
            <p className="mt-1 text-sm text-red-600">{errors.workingPercentage}</p>
          )}

          {/* Allocation Progress Bar */}
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  currentAllocation + workingPercentage <= 70 ? 'bg-green-600' :
                  currentAllocation + workingPercentage <= 90 ? 'bg-yellow-500' : 'bg-red-600'
                }`}
                style={{ width: `${currentAllocation + workingPercentage}%` }}
              />
            </div>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span>0%</span>
              <span className={`font-bold ${currentAllocation + workingPercentage > 100 ? 'text-red-600' : 'text-gray-700'}`}>
                {currentAllocation + workingPercentage}% (Total)
              </span>
            </div>
          </div>
        </div>

        {/* Start Date */}
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
            Start Date *
          </label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 ${
              errors.startDate ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
          />
          {errors.startDate && (
            <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
          )}
        </div>

        {/* End Date (Optional) */}
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Leave empty for open-ended"
          />
          {endDate && startDate && new Date(endDate) < new Date(startDate) && (
            <p className="mt-1 text-sm text-red-600">End date must be after start date</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting || (currentAllocation + workingPercentage > 100 && !overrideAllocation)}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8 8 0 018 8 0 01-8 8 0 014 0l4-4m0 0l-4 4"></path>
                </svg>
                Assigning...
              </span>
            ) : 'Assign'}
          </button>
        </div>

        {/* General Submit Error */}
        {errors.submit && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{errors.submit}</p>
          </div>
        )}
      </form>
    </div>
  );
}
