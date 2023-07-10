// ** NextAuth Imports
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/pages/api/auth/[...nextauth]"

// ** MongoDB Imports
import clientPromise from '@/lib/mongodb/client'
import { ObjectId } from "mongodb"

// ** Type Imports
import { NextApiRequest, NextApiResponse } from "next"
import { InviteToken } from "@/models/InviteToken"
import { User } from "next-auth"

const database = process.env.MONGODB_DB

export default async function inviteHandler(req: NextApiRequest, res: NextApiResponse) {

    // Set request variables
    const { method } = req
    const { email } = req.body
    const { inviteId } = req.query

    console.log('email =>', email)
    console.log('inviteId =>', inviteId)

    // Get user's active session
    const session = await getServerSession(req, res, authOptions)

    // If no session exists, return an error response and appropriate message
    if (!session)
        return res.status(401).json({ ok: false, message: 'Valid session not found.' })

    // Connect to MongoDB
    const client = await clientPromise
    const db = client.db(database)

    switch (method) {
        case 'GET':
            try {
                // Query all invites associated with session user's email address
                // TODO: Resolve TS error
                const invites = await db.collection<InviteToken>('invite_tokens').find({ invitedUserName: session.user.email }).toArray()
                res.status(200).json({ ok: true, invites, message: 'Success!' })
            } catch (error) {
                return res.status(500).json({ ok: false, message: 'An unexpected error occurred', error })
            }
            break

        case 'POST':

            // Reject request if session user's email matches the email being invited
            if (session.user?.email === email)
                return res.status(400).json({ ok: false, message: 'You can not invite yourself to a team!' })

            // Reject request if email is invalid
            if (!email || email === '')
                return res.status(400).json({ ok: false, message: 'An email address is required to send an invite!' })

            try {
                // Set expiration date
                const expirationDate = new Date()
                expirationDate.setDate(expirationDate.getDate() + 7)

                // Insert a new document into the invite_tokens collection
                const insert = await db.collection<InviteToken>('invite_tokens').insertOne({
                    expires: expirationDate,
                    team: session.user?.email || '',
                    invitedByUserName: session.user?.email || '',
                    invitedByUserId: new ObjectId(session.user.id),
                    invitedUserName: email,
                })

                // If insert acknowledgement is false, something went wrong; return error message and insert response data
                if (!insert.acknowledged)
                    return res.status(500).json({ ok: false, message: 'An error occurred during insert', insert })

                // No errors encountered, return success message and insert response data
                res.status(200).json({ ok: true, message: 'Invite posted successfully', insert })

            } catch (error) {
                return res.status(500).json({ ok: false, error })
            }

            break

        case "DELETE":

            if (!inviteId || inviteId === '')
                return res.status(400).json({ ok: false, message: 'Invalid invite token ID' })

            try {
                // TODO: Resolve TS Error
                const deleteInvite = await db.collection<InviteToken>('invite_tokens').deleteOne({ _id: new ObjectId(inviteId), invitedUserName: session.user.email })
                if (!deleteInvite)
                    return res.status(400).json({ ok: false, message: 'Invite token not found' })

                res.status(200).json({ ok: true, message: 'Invite token deleted successfully.' })
            } catch (error) {
                return res.status(500).json({ ok: false, message: 'An unexpected error occurred', error })
            }

            break

        case "PUT":

            // Reject request if no inviteId value is received
            if (!inviteId || inviteId === '')
                return res.status(400).json({ ok: false, message: 'Invalid invite token ID' })

            try {
                // TODO: Resolve TS Error
                const deleteInvite = await db.collection<InviteToken>('invite_tokens').findOneAndDelete({ _id: new ObjectId(inviteId), invitedUserName: session.user.email })

                // Error response handler for invite token not found
                if (!deleteInvite || !deleteInvite.ok)
                    return res.status(400).json({ ok: false, message: 'Invite token not found' })

                // Update user record with values from accepted invite
                const updateUser = await db.collection<User>('users').updateOne(
                    { email: session.user?.email },
                    {
                        $push: {
                            teams: deleteInvite.value?.team
                        }
                    }
                )

                // Error response handler for no document found
                if (!updateUser.matchedCount)
                    return res.status(400).json({ ok: false, message: 'User record not found', data: updateUser })

                // Error response handler for failed document update
                if (!updateUser.modifiedCount)
                    return res.status(500).json({ ok: false, message: 'User record failed to update', data: updateUser })

                // Success response
                res.status(200).json({ ok: true, message: 'Invite token successfully accepted.' })
            } catch (error) {
                return res.status(500).json({ ok: false, message: 'An unexpected error occurred', error })
            }

            break

        default:
            res.setHeader('Allow', ['POST', 'PUT', 'DELETE'])
            res.status(405).end(`Method ${method} Not Allowed`)
    }
}