
import Stripe from "stripe";
import Transaction from "../models/Transaction.js";
import User from "../models/user.js";

export const stripeWebhooks = async (request,response) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const sig = request.headers["stripe-signature"]

    let event


    try {
        event = stripe.webhooks.constructEvent(request.body,sig,process.env.STRIPE_WEBHOOK_SECRET)
    } catch (error) {
        return response.status(400).send(`Webhook Error : ${error.message}`)
    }

    try {
        switch (event.type) {
            case "payment_intent.succeeded":{
                const paymentIntent = event.data.object
                const sessionList = await stripe.checkout.sessions.list({
                    payment_intent: paymentIntent.id,
                })
                const session = sessionList.data[0]
                const {transactionId,appId} = session.metadata

                if(appId === 'quickgpt'){
                    const transaction = await Transaction.findOne({_id:
                    transactionId,isPaid:false})

                    await User.updateOne({_id:transaction.userId},{$inc:
                    {credits:transaction.credits}})

                    transaction.isPaid = true
                    await transaction.save()
                }
                else{
                    return response.json({received:true,message:"Ignored event:Invalid app"})
                }
                break;
            }
                
            default:
                console.log("Unhandled event type:", event.type)
                break;
        }
        response.json({received:true})
    } catch (error) {
        console.error("Webhook processing error:", error)
        response.status(500).send("Internal Server Error")
    }
}




STRIPE_PUBLISHABLE_KEY =  pk_test_51S95XXRH0DT69vgcW3K3nDKNuchH7FscUf1hyJcTtTRo1FsaG8gw2twES16HbFjoe3XNG6KoxX6457d6rBz2Zb2v00eRc3UesK
STRIPE_SECRET_KEY = sk_test_51S95XXRH0DT69vgcPW0Bk2JiRj8jUjdOI25KglWIZLnqrN8V07ze8acA4EMouCo0jEeF5SxMWUCvaxGQp7IJ1oho00ti9FPcgT
STRIPE_WEBHOOK_SECRET = whsec_D3LQfaaQgCuGj4qXWmBilv15sTcoiV9c