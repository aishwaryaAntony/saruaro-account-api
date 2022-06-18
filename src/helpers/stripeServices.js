import { STRIPE_SECRET_KEY, CLIENT_DOMAIN } from "./constants";
const stripe = require("stripe")(STRIPE_SECRET_KEY);

module.exports = {
    /**
     * creates a payment session for donor supervisor
     * @function
     */
      createSessionForPayment: (data, isLoggedIn) => {
          return new Promise(async (resolve, reject) => {
              try {
                // console.log(`Data ==> ${JSON.stringify(data)}`);
                  let success_url = `${CLIENT_DOMAIN}payment-status?success=true&session_id={CHECKOUT_SESSION_ID}`;
                  let cancel_url = `${CLIENT_DOMAIN}payment-status?canceled=true&session_id={CHECKOUT_SESSION_ID}`;

                  if(isLoggedIn === true){
                    success_url = `${CLIENT_DOMAIN}customer/payment-status?success=true&session_id={CHECKOUT_SESSION_ID}`;
                    cancel_url = `${CLIENT_DOMAIN}customer/payment-status?canceled=true&session_id={CHECKOUT_SESSION_ID}`;
                  }

                  let lineItems = [];

                  for(let testType of data){
                    let item = {};
                    let priceObj = {};
                    let productObj = {};

                    productObj.name = testType.name;

                    priceObj.currency = 'usd';
                    priceObj.product_data = productObj;
                    priceObj.unit_amount = (parseFloat(testType.price) * 100);

                    item.price_data = priceObj;
                    item.quantity = 1;
                    lineItems.push(item);
                  }

                  // console.log(`lineItems ==> ${JSON.stringify(lineItems)}`);
  
                  const session = await stripe.checkout.sessions.create({
                      payment_method_types: ['card'],
                      // line_items: [
                      //   {
                      //     price_data: {
                      //       currency: 'usd',
                      //       product_data: {
                      //         name: 'Credit Points',
                      //         // images: ['https://i.imgur.com/EHyR2nP.png'],
                      //       },
                      //       unit_amount: (parseFloat(data.price_per_credit) * 100),
                      //     },
                      //     quantity: parseInt(data.credits),
                      //   },
                      // ],
                      line_items: lineItems,
                      mode: 'payment',
                      success_url: `${success_url}`,
                      cancel_url: `${cancel_url}`,
                  });
  
                  // console.log(`session ==> ${JSON.stringify(session)}`);
                  resolve(session);
              } catch (error) {
                  reject(error);
              }
          });
      }
    }