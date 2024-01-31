const express = require('express')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const router = express.Router()
const joi = require('joi')
// const BaseUrl = 'http://localhost:9000'
const BaseUrl = 'http://payment-env.eba-vufb2uha.us-east-1.elasticbeanstalk.com'
router.post('/create-checkout-session', async (req, res) => {
    const value = joi.object({
        lookup_key: joi.string().required(),
    }).validate(req.body)
    if (value.error) {
        console.log('type error ' + value.error.message)
        return res.status(400).json({ success: false, error: value.error.message })
    }

    const { lookup_key } = req.body;
    let plan;

    try {
        const price = await stripe.prices.retrieve(lookup_key);
        const planData = await stripe.plans.retrieve(price.id);
        plan = planData;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],

            subscription_data: {
                items: [{
                    plan: plan.id,
                }],
            },
            success_url: `${BaseUrl}/success`,

            cancel_url: `${BaseUrl}/cancel`
        });

        res.json({ sessionId: session.id });

    } catch (err) {
        console.log("Error " + err.message)
        return res.status(500).json({ success: false, error: err.message });
    }

});


router.get('/success', async (req, res) => {
    try {

        res.json({
            success: true, message: "Payment Successful",
        })
    } catch (err) {
        console.log("Error " + err.message)
        return res.status(500).json({ success: false, error: err.message });
    }
})

router.get('/cancel', (req, res) => {
    res.json({ success: false, message: "Payment Cancelled" })
})


module.exports = router

