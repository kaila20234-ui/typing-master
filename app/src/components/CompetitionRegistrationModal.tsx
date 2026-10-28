import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/api'

interface CompetitionRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  competitionId: string
  competitionName: string
  competitionType: 'race' | 'tournament' | 'daily-challenge' | 'squad-war'
  entryFee: number
  currency?: string
  onRegistrationSuccess?: (registrationId: string) => void
  onRegistrationError?: (error: string) => void
  userId?: string
  username: string
  squadId?: string  // Optional, required for squad-war type
}

type PaymentMethod = 'paystack' | 'stripe' | 'card'
type RegistrationStep = 'payment' | 'processing' | 'success' | 'error'

export function CompetitionRegistrationModal({
  isOpen,
  onClose,
  competitionId,
  competitionName,
  competitionType,
  entryFee,
  currency = 'USD',
  onRegistrationError,
  username,
}: CompetitionRegistrationModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paystack')
  const [step, setStep] = useState<RegistrationStep>('payment')
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [registrationId, setRegistrationId] = useState('')

  const handleRegister = async () => {
    if (!agreeToTerms) {
      setErrorMessage('You must agree to the terms and conditions')
      return
    }

    setStep('processing')
    setErrorMessage('')

    try {
      // Step 1: Initialize Paystack transaction
      const orderResult = await apiClient.createPaymentOrder(competitionId, entryFee)
      
      if (orderResult.error) {
        setErrorMessage(orderResult.error)
        setStep('error')
        if (onRegistrationError) {
          onRegistrationError(orderResult.error)
        }
        return
      }

      const orderData = orderResult.data as any
      const reference = orderData.orderId || orderData.reference
      const authorizationUrl = orderData.approvalLink || orderData.authorizationUrl

      // Step 2: Redirect to Paystack payment
      if (authorizationUrl) {
        // Store the reference for callback verification
        sessionStorage.setItem('paystack_reference', reference)
        sessionStorage.setItem('competition_id', competitionId)
        sessionStorage.setItem('entry_fee', entryFee.toString())
        
        // Redirect to Paystack
        window.location.href = authorizationUrl
      } else {
        setErrorMessage('Failed to generate payment URL')
        setStep('error')
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Registration failed'
      setErrorMessage(errorMsg)
      setStep('error')
      if (onRegistrationError) {
        onRegistrationError(errorMsg)
      }
    }
  }

  const handleClose = () => {
    if (step !== 'processing') {
      setStep('payment')
      setAgreeToTerms(false)
      setErrorMessage('')
      setRegistrationId('')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === 'payment' && (
          <>
            <DialogHeader className="pb-2">
              <DialogTitle className="text-lg">Register for Competition</DialogTitle>
              <DialogDescription className="text-xs">
                Join {competitionName} and compete with other players
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              {/* Competition Info */}
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{competitionName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 py-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Participant:</span>
                    <span className="font-medium text-xs">{username}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Entry Fee:</span>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 py-0 px-2 text-xs">
                      {currency} ${entryFee.toFixed(2)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Type:</span>
                    <span className="capitalize text-xs font-medium">{competitionType.replace('-', ' ')}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Payment Method</Label>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-700/50 cursor-pointer hover:bg-slate-800/30 transition-colors"
                    onClick={() => setPaymentMethod('paystack')}>
                    <input
                      type="radio"
                      id="paystack"
                      name="payment"
                      value="paystack"
                      checked={paymentMethod === 'paystack'}
                      onChange={() => setPaymentMethod('paystack')}
                      className="w-4 h-4"
                    />
                    <label htmlFor="paystack" className="flex-1 cursor-pointer">
                      <div className="text-sm font-medium">Paystack</div>
                      <div className="text-xs text-slate-400">Secure payment via Paystack</div>
                    </label>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-700/50 cursor-pointer hover:bg-slate-800/30 transition-colors"
                    onClick={() => setPaymentMethod('stripe')}>
                    <input
                      type="radio"
                      id="stripe"
                      name="payment"
                      value="stripe"
                      checked={paymentMethod === 'stripe'}
                      onChange={() => setPaymentMethod('stripe')}
                      className="w-4 h-4"
                    />
                    <label htmlFor="stripe" className="flex-1 cursor-pointer">
                      <div className="text-sm font-medium">Stripe</div>
                      <div className="text-xs text-slate-400">Credit/debit card</div>
                    </label>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-700/50 cursor-pointer hover:bg-slate-800/30 transition-colors"
                    onClick={() => setPaymentMethod('card')}>
                    <input
                      type="radio"
                      id="card"
                      name="payment"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                      className="w-4 h-4"
                    />
                    <label htmlFor="card" className="flex-1 cursor-pointer">
                      <div className="text-sm font-medium">Credit Card</div>
                      <div className="text-xs text-slate-400">Direct payment</div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-800/30 border border-slate-700/50">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5"
                />
                <label htmlFor="terms" className="text-xs cursor-pointer">
                  <span className="font-medium block">I agree to rules</span>
                  <div className="text-xs text-slate-400 mt-0.5 leading-tight">
                    Competitors in good standing • Non-refundable • Admin final
                  </div>
                </label>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="flex gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-red-400">{errorMessage}</div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 border-slate-600 text-slate-400 hover:text-white h-9 text-sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRegister}
                  disabled={!agreeToTerms}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 h-9 text-sm"
                >
                  Pay & Register
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-6">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
            <h3 className="text-base font-semibold mb-1">Processing Payment</h3>
            <p className="text-slate-400 text-center text-xs">
              Please wait...
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-6">
            <CheckCircle2 className="w-8 h-8 text-green-500 mb-3" />
            <h3 className="text-base font-semibold mb-1">Success!</h3>
            <p className="text-slate-400 text-center mb-1 text-xs">
              Registered for {competitionName}
            </p>
            <p className="text-xs text-slate-500">
              ID: {registrationId}
            </p>
            <p className="text-slate-400 text-center mt-2 text-xs">
              Redirecting...
            </p>
          </div>
        )}

        {step === 'error' && (
          <div className="flex flex-col items-center justify-center py-6">
            <AlertCircle className="w-8 h-8 text-red-500 mb-3" />
            <h3 className="text-base font-semibold mb-2 text-red-400">Failed</h3>
            <p className="text-slate-400 text-center mb-3 text-xs">
              {errorMessage || 'An error occurred'}
            </p>
            <Button
              onClick={handleClose}
              className="bg-blue-600 hover:bg-blue-700 h-9 text-sm"
            >
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
