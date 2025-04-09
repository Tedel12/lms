import { Webhook } from "svix";
import User from "../models/User.js";

//API controller function to manage clerk user with database

export const clerkWebhooks = async (req, res) =>{
    try {
        const whook =  new Webhook(process.env.CLERK_WEBHOOK_SECRET)

        await whook.verify(JSON.stringify(req.body), {
            "svix-id": req.header["svix-id"],
            "svix-timestramp": req.header["svix-timestramp"],
            "svix-signature": req.header["svix-signature"],
        })
        
        const {data, type} = req.body

        switch(type) {
            case 'user.created': {
                const userData = {
                    _id: data.id,
                    email: data.email_address[0].email_address,
                    name: data.first_name + " " + data.last_name,
                    imageUrl: data.imageUrl,
                }
                await User.create(userData)
                res.json({})
                break;
            }

            case 'user.updated': {
                const userData = {
                    email: data.email_address[0].email_address,
                    name: data.first_name + " " + data.last_name,
                    imageUrl: data.imageUrl,
                }
                await User.findByIdAndUpdate(data.id, userData)
                res.json({})
                break;
            }
            
            case 'user.deleted' : {
                await User.findByIdAndDelete(data.id)
                res.json({})
                break;
            }

            default:
                break;
        }

    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}