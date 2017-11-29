// import twilio from 'twilio';
// import config from "../../config.json";

// const sendMessageTwilio = (body, to) => {
//     return new Promise((resolve, reject) => {
//         var client = new twilio(config.twilio_accountSid, config.twilio_authToken);
//         client.messages.create({
//             body: body,
//             to: to, // Text this number
//             from: config.twilio_number // From a valid Twilio number
//         }, (err, message) => {
//             if (err) {
//                 resolve(err)
//             } else {
//                 resolve(message.sid)
//             }
//         })
//     })
// };

// export default {
//     sendMessageTwilio
// };