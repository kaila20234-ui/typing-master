import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';

type CallbackStatus = 'verifying' | 'success' | 'failed' | 'error';

export function PaymentCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<CallbackStatus>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get payment reference from URL
        const reference = searchParams.get('reference');
        
        if (!reference) {
          setStatus('error');
          setMessage('No payment reference found');
          return;
        }

        // Get stored competition details from sessionStorage
        const storedCompetitionId = sessionStorage.getItem('competition_id');
        const storedEntryFee = sessionStorage.getItem('entry_fee');
        
        if (!storedCompetitionId) {
          setStatus('error');
          setMessage('Competition information not found. Please try again.');
          return;
        }

        // First, verify the payment with Paystack
        const verifyResult = await apiClient.confirmPayment(storedCompetitionId, reference);

        if (verifyResult.error) {
          setStatus('failed');
          setMessage(`Payment verification failed: ${verifyResult.error}`);
          return;
        }

        // Now confirm the payment (register user)
        const confirmResult = await apiClient.confirmPayment(
          storedCompetitionId,
          reference,
          parseFloat(storedEntryFee || '0')
        );

        if (confirmResult.error) {
          setStatus('failed');
          setMessage(`Registration failed: ${confirmResult.error}`);
          return;
        }

        setStatus('success');
        setMessage('Payment verified and registration complete!');

        // Clear sessionStorage
        sessionStorage.removeItem('competition_id');
        sessionStorage.removeItem('entry_fee');
        sessionStorage.removeItem('paystack_reference');

        // Redirect to app after 3 seconds
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'An error occurred during payment verification');
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {status === 'verifying' && (
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
            <h1 className="text-2xl font-bold text-white">Verifying Payment</h1>
            <p className="text-slate-400">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold text-green-400">Payment Successful!</h1>
            <p className="text-slate-300">{message}</p>
            <p className="text-sm text-slate-500">You will be redirected to the app shortly...</p>
          </div>
        )}

        {status === 'failed' && (
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto" />
            <h1 className="text-2xl font-bold text-yellow-400">Payment Verification Failed</h1>
            <p className="text-slate-300">{message}</p>
            <Button
              onClick={() => navigate('/', { replace: true })}
              className="mt-4 bg-blue-600 hover:bg-blue-700 w-full"
            >
              Return to Home
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold text-red-400">Error</h1>
            <p className="text-slate-300">{message}</p>
            <Button
              onClick={() => navigate('/', { replace: true })}
              className="mt-4 bg-blue-600 hover:bg-blue-700 w-full"
            >
              Return to Home
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
