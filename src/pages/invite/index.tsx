// ** NextAuth Imports
import { signIn } from "next-auth/react"

// ** NextJS Imports
import Link from "next/link"
import Image from "next/image"

// ** React Imports
import { useState } from 'react'

// ** Asset Imports
import logo from '../../../public/logo-icon-gradient.webp'

export default function Invite() {

    // State Variables
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)

    /**
     * * Handle Send Invite
     * @dev handler for more control over the send invite user experience
     * @param e formEvent
     */
    const handleSendInvite = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        // Generate invite token
        const inviteResp = await fetch('/api/users/invites', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email })
        })
        const inviteRespJson = await inviteResp.json()
        if (!inviteRespJson.ok) {
            alert(inviteRespJson.message)
            setLoading(false)
            return
        }
        console.log(inviteRespJson)

        // Send NextAuth email invite request
        const resp = await signIn(
            'emailInvite',
            {
                email,
                callbackUrl: `/view-invites`,
                redirect: false
            }
        )

        // Add custom event handlers based on response received
        if (resp?.error) {
            alert(resp.error)
        } else if (!resp?.ok) {
            alert('An unknown error occurred!')
        } else {
            setEmail('')
            alert(`Email invite to ${email} sent successfully!`)
        }

        setLoading(false)
    }

    return (
        <main className='relative flex min-h-screen flex-col items-center justify-center p-24 bg-slate-300'>
            <div className="bg-white p-20 shadow-black shadow-sm rounded-sm">
                {/* Logo */}
                <div className="w-full max-w-[8rem] mb-8 mx-auto">
                    <Image
                        src={logo}
                        alt="Lacuna Strategies Logo"
                    />
                </div>

                {/* Form */}
                <div className="w-full max-w-sm">
                    <h1 className="text-3xl mb-6 text-center">Invite User</h1>
                    <form onSubmit={handleSendInvite}>

                        <div className="relative">
                            <label
                                htmlFor="email"
                                className="bg-white absolute -top-2 left-2 text-xs px-1 font-medium"
                            >
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                autoComplete='email'
                                placeholder="email@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full border border-neutral-400 placeholder:text-neutral-400 py-2.5 px-5 rounded-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="block w-full py-2.5 px-5 mt-4 bg-cyan-600 text-white text-center rounded-sm"
                        >
                            {loading ? 'Please Wait...' : 'Send Invite'}
                        </button>
                        <p className="text-center text-sm mt-4">
                            Return to the{' '}
                            <Link
                                href="/dashboard"
                                className="inline-block text-cyan-600"
                            >Dashboard</Link>
                        </p>
                    </form>
                </div>
            </div>
        </main>
    )
}
