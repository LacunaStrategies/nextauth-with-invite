import { ObjectId } from "mongodb"

export interface InviteToken {
    _id?: ObjectId | string
    expires: Date | string
    team: string
    invitedByUserName: string
    invitedByUserId: ObjectId | string | null
    invitedUserName: string
    invitedUserId?: ObjectId | string
}