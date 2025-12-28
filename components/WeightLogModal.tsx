import React, { useState } from 'react';

interface WeightLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeight: number;
  onSave: (weight: number) => void;
}

const WeightLogModal: React.FC<WeightLogModalProps> = ({ isOpen, onClose, currentWeight, onSave }) => {
  const [weight, setWeight] = useState(currentWeight.toString());

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const weightNum = parseFloat(weight);
    if (!isNaN(weightNum) && weightNum > 0) {
      onSave(weightNum);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Log Today's Weight</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
              Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              min="20"
              max="300"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg"
              placeholder="Enter your weight"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
            >
              Save Weight
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WeightLogModal;
