'use client';

import { useState } from 'react';
import { Transaction } from '@/types/transactions';
import { formatCurrency } from '@/lib/utils';

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
  onRefund: (amount: number, reason?: string) => Promise<void>;
}

export function RefundModal({ isOpen, onClose, transaction, onRefund }: RefundModalProps) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const maxRefundAmount = transaction.amount - (transaction.refundedAmount || 0);
  const isFullRefund = parseFloat(amount) === maxRefundAmount / 100;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!amount) {
      newErrors.amount = 'Refund amount is required';
    } else {
      const amountCents = Math.round(parseFloat(amount) * 100);
      if (amountCents <= 0) {
        newErrors.amount = 'Refund amount must be greater than 0';
      } else if (amountCents > maxRefundAmount) {
        newErrors.amount = `Refund amount cannot exceed ${formatCurrency(maxRefundAmount, transaction.currency)}`;
      }
    }

    if (transaction.status !== 'completed') {
      newErrors.status = 'Only completed transactions can be refunded';
    }

    const transactionDate = new Date(transaction.createdAt);
    const daysDiff = Math.floor((Date.now() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 180) {
      newErrors.timeLimit = 'Transactions older than 180 days cannot be refunded';
    }

    if (reason && reason.length > 500) {
      newErrors.reason = 'Reason cannot exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const amountCents = Math.round(parseFloat(amount) * 100);
      await onRefund(amountCents, reason || undefined);
      onClose();
      setAmount('');
      setReason('');
      setErrors({});
    } catch (error) {
      setErrors({ submit: 'Failed to process refund. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(value)) {
      setAmount(value);
      if (errors.amount) {
        setErrors({ ...errors, amount: '' });
      }
    }
  };

  const setFullRefund = () => {
    setAmount((maxRefundAmount / 100).toFixed(2));
    if (errors.amount) {
      setErrors({ ...errors, amount: '' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Refund Transaction</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            type="button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Transaction ID</div>
          <div className="font-mono text-sm">{transaction.id}</div>
          
          <div className="mt-3 flex justify-between text-sm">
            <div>
              <div className="text-gray-600">Original Amount</div>
              <div className="font-medium">{formatCurrency(transaction.amount, transaction.currency)}</div>
            </div>
            <div>
              <div className="text-gray-600">Already Refunded</div>
              <div className="font-medium">{formatCurrency(transaction.refundedAmount || 0, transaction.currency)}</div>
            </div>
            <div>
              <div className="text-gray-600">Available to Refund</div>
              <div className="font-medium">{formatCurrency(maxRefundAmount, transaction.currency)}</div>
            </div>
          </div>
        </div>

        {Object.keys(errors).filter(key => !['amount', 'reason', 'submit'].includes(key)).length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            {Object.entries(errors)
              .filter(([key]) => !['amount', 'reason', 'submit'].includes(key))
              .map(([key, error]) => (
                <div key={key} className="text-sm text-red-700">{error}</div>
              ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Refund Amount ({transaction.currency})
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="amount"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.amount ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={setFullRefund}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
                disabled={isLoading}
              >
                Full Refund
              </button>
            </div>
            {errors.amount && (
              <div className="text-sm text-red-600 mt-1">{errors.amount}</div>
            )}
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
              Refund Reason (Optional)
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for refund..."
              rows={3}
              maxLength={500}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.reason ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isLoading}
            />
            {errors.reason && (
              <div className="text-sm text-red-600 mt-1">{errors.reason}</div>
            )}
            <div className="text-xs text-gray-500 mt-1">{reason.length}/500 characters</div>
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="text-sm text-red-700">{errors.submit}</div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : `Refund ${isFullRefund ? 'Full Amount' : formatCurrency(Math.round(parseFloat(amount || '0') * 100), transaction.currency)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}