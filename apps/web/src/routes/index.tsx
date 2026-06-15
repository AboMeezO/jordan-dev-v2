import {
  SignInButton,
  SignUpButton,
  useAuth,
  UserButton,
  useUser,
} from '@clerk/tanstack-react-start'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { CheckCircle2, ShieldCheck, Unlink } from 'lucide-react'

import { verificationResultSchema } from '../verification'

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>) => ({
    discordUserId:
      typeof search.discordUserId === 'string' ? search.discordUserId : '',
    guildId: typeof search.guildId === 'string' ? search.guildId : '',
  }),
  component: Home,
})

function Home() {
  const { discordUserId, guildId } = Route.useSearch()
  const { getToken, isSignedIn } = useAuth()
  const { user } = useUser()

  const verification = useMutation({
    mutationFn: async () => {
      const token = await getToken()

      if (!token) {
        throw new Error('Sign in before verification.')
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}/verification/complete`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ discordUserId, guildId }),
        },
      )

      if (!response.ok) {
        throw new Error('Verification could not be completed.')
      }

      const responseBody: unknown = await response.json()

      return verificationResultSchema.parse(responseBody)
    },
  })

  const canVerify = Boolean(isSignedIn && discordUserId && guildId)

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-[#171717]">
      <main className="mx-auto grid min-h-screen w-full max-w-5xl content-center gap-8 px-5 py-10 md:grid-cols-[1fr_380px] md:px-8">
        <section className="flex flex-col justify-center">
          <div className="mb-8 flex h-12 w-12 items-center justify-center border border-[#171717] bg-[#d7ff45]">
            <ShieldCheck aria-hidden="true" size={26} strokeWidth={1.8} />
          </div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#5f5a4e]">
            Jordan Devs member gate
          </p>
          <h1 className="max-w-2xl text-5xl font-black leading-[0.95] md:text-7xl">
            Verify once. Unlock the server.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#4b463d]">
            Sign in with Clerk, link the Discord join challenge, and the server
            can grant your member role.
          </p>
        </section>

        <section className="border border-[#171717] bg-white p-5 shadow-[8px_8px_0_#171717]">
          <div className="mb-6 flex items-center justify-between border-b border-[#d6d0c3] pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#756f62]">
                Account
              </p>
              <p className="mt-1 font-semibold">
                {user?.primaryEmailAddress?.emailAddress ?? 'Not signed in'}
              </p>
            </div>
            {isSignedIn ? <UserButton /> : null}
          </div>

          {isSignedIn ? (
            <div className="space-y-4">
              <VerificationRow label="Discord user" value={discordUserId} />
              <VerificationRow label="Guild" value={guildId} />
              <button
                className="mt-3 flex h-12 w-full items-center justify-center gap-2 bg-[#171717] px-4 font-bold text-white disabled:cursor-not-allowed disabled:bg-[#9b9487]"
                disabled={!canVerify || verification.isPending}
                onClick={() => verification.mutate()}
                type="button"
              >
                <CheckCircle2 aria-hidden="true" size={18} />
                {verification.isPending ? 'Verifying...' : 'Complete verification'}
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              <SignInButton mode="modal">
                <button className="h-12 bg-[#171717] px-4 font-bold text-white" type="button">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="h-12 border border-[#171717] px-4 font-bold" type="button">
                  Create account
                </button>
              </SignUpButton>
            </div>
          )}

          {!discordUserId || !guildId ? (
            <p className="mt-5 flex gap-2 text-sm leading-6 text-[#8a3c1f]">
              <Unlink aria-hidden="true" className="mt-1 shrink-0" size={16} />
              Open this page from the Discord verification link so the bot can
              attach the correct challenge.
            </p>
          ) : null}

          {verification.isError ? (
            <p className="mt-5 text-sm font-semibold text-[#a33220]">
              {verification.error.message}
            </p>
          ) : null}

          {verification.isSuccess ? (
            <p className="mt-5 text-sm font-semibold text-[#23703b]">
              Verification accepted. Role granting is the next backend step.
            </p>
          ) : null}
        </section>
      </main>
    </div>
  )
}

function VerificationRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#d6d0c3] p-3">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#756f62]">
        {label}
      </p>
      <p className="mt-1 break-all font-mono text-sm">{value || 'Missing'}</p>
    </div>
  )
}
