// ** NextJS Imports
import Link from "next/link"
import Image from "next/image"

// ** React Imports
import { useEffect, useState } from "react"

// ** Component Imports
import TeamInviteCard from "@/components/TeamInviteCard"

// ** Asset Imports
import logo from '../../../public/logo-icon-gradient.webp'

// ** Type Imports
import { InviteToken } from "@/models/InviteToken"

export default function AcceptInvitePage() {

    // State variables
    const [pageLoading, setPageLoading] = useState(true)
    const [invites, setInvites] = useState<InviteToken[] | []>([])

    // Load user's invites on initial mount
    useEffect(() => {
        const getMyInvites = async () => {
            const resp = await fetch('/api/users/invites', {
                method: 'GET'
            })
            const data = await resp.json()
            // @ts-ignore
            // TODO: Resolve Typescript "any" error
            setInvites(data.invites)
        }

        getMyInvites()
        setPageLoading(false)
    }, [])



    return (
        <main className='relative flex min-h-screen flex-col items-center justify-center p-24 bg-slate-300'>
            {
                pageLoading ? 'Loading...' : (
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

                            <div className="text-center">
                                <h1 className="text-3xl mb-2">Welcome to the Team!</h1>
                                {
                                    !invites?.length ?
                                        <p>You do not currently have any pending invites.</p> :
                                        <p>Approve or Reject your pending invites below.</p>
                                }
                            </div>

                            {
                                invites?.length > 0 && (
                                    <div className="mt-8">
                                        {invites.map((invite, i) => (
                                            <div
                                                key={i}
                                                className="mb-4 last:mb-0"
                                            >
                                                <TeamInviteCard
                                                    invite={invite}
                                                    setInvites={setInvites}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )
                            }

                            <p className="text-center text-sm mt-16">
                                Return to the{' '}
                                <Link
                                    href="/dashboard"
                                    className="inline-block text-cyan-600"
                                >Dashboard</Link>
                            </p>

                        </div>
                    </div>
                )
            }
        </main>
    )
}
