import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog';
import { Button } from './button';
import { Alert, AlertDescription } from './alert';
import { Spinner } from './spinner';
import { apiClient } from '@/lib/api';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  competition: {
    _id: string;
    title: string;
    entryFee?: number;
  };
  onSuccess?: () => void;
}

export function RegistrationModal({
  isOpen,
  onClose,
  competition,
  onSuccess,
}: RegistrationModalProps) {
  const [stage, setStage] = useState<'ready' | 'processing' | 'awaiting-approval' | 'confirming' | 'success' | 'error'>('ready');
  const [error, setError] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');
  const [entryFee, setEntryFee] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (stage === 'success') {
      const timer = setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [stage, onSuccess, onClose]);

  // Check for Paystack payment return (reference in URL) and handle as needed
  useEffect(() => {
    if (isOpen && orderId && stage === 'awaiting-approval') {
      // Note: In a production system, you would check URL parameters
      // from Paystack redirect and handle the return appropriately
      console.log('Awaiting Paystack payment confirmation, reference:', orderId);
    }
  }, [isOpen, orderId, stage]);

  const handleGetEntryFee = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.getCompetitionEntryFee(competition._id);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.data?.entryFee) {
        setEntryFee(response.data.entryFee);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch entry fee');
      setStage('error');
    } finally {
      setLoading(false);
    }
  };

  const handleStartPayment = async () => {
    try {
      setStage('processing');
      setError('');

      if (!entryFee) {
        throw new Error('Entry fee not loaded');
      }

      const response = await apiClient.createPaymentOrder(competition._id, entryFee);

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.data?.orderId || !response.data?.approvalLink) {
        throw new Error('Failed to create payment order');
      }

      setOrderId(response.data.orderId);
      setStage('awaiting-approval');

      // Redirect to PayPal approval
      window.location.href = response.data.approvalLink;
    } catch (err: any) {
      setError(err.message || 'Failed to create payment order');
      setStage('error');
    }
  };

  const handleRetry = () => {
    setStage('ready');
    setError('');
    setOrderId('');
    setEntryFee(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Register for Competition</DialogTitle>
          <DialogDescription>{competition.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Ready Stage */}
          {stage === 'ready' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  Entry Fee:{' '}
                  {entryFee !== null ? (
                    <span className="text-lg font-bold">${entryFee.toFixed(2)}</span>
                  ) : (
                    <Button
                      variant="link"
                      className="p-0 h-auto font-bold text-blue-600"
                      onClick={handleGetEntryFee}
                      disabled={loading}
                    >
                      {loading ? <Spinner className="w-4 h-4 inline mr-2" /> : ''}
                      Load Entry Fee
                    </Button>
                  )}
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800">
                  <strong>Prize Distribution:</strong> 50% to 1st place, 30% to 2nd, 20% to 3rd
                </p>
              </div>

              <Button
                className="w-full"
                onClick={handleStartPayment}
                disabled={entryFee === null || loading}
              >
                {loading ? <Spinner className="w-4 h-4 mr-2" /> : ''}
                Pay with PayPal
              </Button>
            </div>
          )}

          {/* Processing Stage */}
          {stage === 'processing' && (
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <Spinner className="w-8 h-8" />
              <p className="text-sm font-medium">Creating payment order...</p>
            </div>
          )}

          {/* Awaiting Approval Stage */}
          {stage === 'awaiting-approval' && (
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <Spinner className="w-8 h-8" />
              <p className="text-sm font-medium">Redirecting to PayPal...</p>
              <p className="text-xs text-gray-500">
                You will be redirected to PayPal to complete payment
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Confirming Stage */}
          {stage === 'confirming' && (
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <Spinner className="w-8 h-8" />
              <p className="text-sm font-medium">Confirming payment...</p>
            </div>
          )}

          {/* Success Stage */}
          {stage === 'success' && (
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <CheckCircle className="w-12 h-12 text-green-600" />
              <p className="text-sm font-medium text-green-700">Registration Successful!</p>
              <p className="text-xs text-gray-600 text-center">
                You are now registered for {competition.title}
              </p>
            </div>
          )}

          {/* Error Stage */}
          {stage === 'error' && (
            <div className="space-y-4">
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleRetry}
                >
                  Try Again
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={onClose}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
