// ** React Imports
import { Dispatch, SetStateAction, useState } from "react"

// ** Type Imports
import { InviteToken } from "@/models/InviteToken"

interface Props {
    invite: InviteToken
    setInvites: Dispatch<SetStateAction<InviteToken[]>>
}

const TeamInviteCard = ({ invite, setInvites }: Props) => {

    // State variables
    const [cardLoading, setCardLoading] = useState(false)

    /**
     * * Handle Invite Response
     * @dev Accepts or rejects invite
     * @note PUT action updates user record and deletes invite_token record
     * @note DELETE action deletes invite_token record without updating user record
     * @param inviteId _id value of associated invite_token document
     * @param action API method to call, indicating which actions to complete 
     */
    const handleInviteResponse = async (inviteId: string, action: 'PUT' | 'DELETE') => {
        setCardLoading(true)

        try {
            // Update and/or Delete documents via /users/invites API endpoint
            const resp = await fetch(`/api/users/invites?inviteId=${inviteId}`, {
                method: action,
            })
            const respJson = await resp.json()

            // If everything went ok, update the invites state variable to no longer include
            // the deleted invite_token document
            if (respJson.ok) {
                setInvites(prev => (
                    prev.filter(invite => invite._id !== inviteId)
                ))
            } else {
                console.error(respJson)
            }

            // Provide user notification of action response
            alert(respJson.message)
        } catch (error) {
            // Log and alert any unexpected errors
            console.error(error)
            alert('An unexpected error occurred')
        }

        setCardLoading(false)
    }

    return (
        <div className="bg-cyan-900 text-white p-4">
            {
                cardLoading ? (
                    <div className="py-10 text-center">
                        Processing...
                    </div>
                ) : (
                    <ul className="mb-4 leading-loose">
                        <li>Team: {invite.team}</li>
                        <li>Invite From: {invite.invitedByUserName}</li>
                        <li>Invite Expires: {new Date(invite.expires).toLocaleDateString('en-us', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</li>
                    </ul>
                )
            }

            <div className="flex justify-around">
                <button
                    disabled={cardLoading}
                    onClick={() => handleInviteResponse(String(invite._id), "PUT")}
                    className="inline-block py-2.5 px-5 bg-cyan-600 w-1/3 text-white rounded-sm disabled:bg-opacity-30 disabled:text-neutral-500"
                >Accept</button>
                <button
                    disabled={cardLoading}
                    onClick={() => handleInviteResponse(String(invite._id), "DELETE")}
                    className="inline-block py-2.5 px-5 bg-neutral-400 w-1/3 text-white rounded-sm disabled:bg-opacity-30 disabled:text-neutral-500"
                >Reject</button>
            </div>
        </div>
    )
}

export default TeamInviteCard