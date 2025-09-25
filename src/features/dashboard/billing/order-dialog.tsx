import { l } from '@/lib/clients/logger/logger'
import { createOrderPaymentIntentAction } from '@/server/billing/billing-actions'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/ui/primitives/dialog'
import { Elements, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useAction } from 'next-safe-action/hooks'
import { useState } from 'react'
import { toast } from 'sonner'

interface OrderDialogProps {
  trigger: React.ReactNode
}

export default function OrderDialog({ trigger }: OrderDialogProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  const { execute: createOrderPaymentIntent, isPending } = useAction(
    createOrderPaymentIntentAction,
    {
      onSuccess: (result) => {
        setClientSecret(result.data?.clientSecret ?? null)
        l.info({
          key: 'order_dialog:use_action_success',
          context: {
            result,
          },
        })
      },
      onError: ({ error }) => {
        l.error({
          key: 'order_dialog_use_action_error',
          error,
        })
        toast.error(
          error.serverError || 'Failed to create order payment intent.'
        )
      },
    }
  )

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>+</DialogTitle>
        </DialogHeader>
      </DialogContent>
      {/* stripe checkout form using @stripe/react-stripe-js */}
      {/* assumes you have clientSecret from backend and Stripe public key in env */}
      {clientSecret && (
        <Elements
          stripe={loadStripe(process.env.NEXT_PUBLIC_STRIPE_PK!)}
          options={{ clientSecret: clientSecret }}
        >
          <EmbeddedCheckout />
        </Elements>
      )}
    </Dialog>
  )
}
