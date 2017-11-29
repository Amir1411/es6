var FCM = require('fcm-node');

module.exports = {
    push_notification: function(serverKey, token, payload, notify, callback) {
        var fcm = new FCM(serverKey);
        var message = {
            to: token,
            collapse_key: 'your_collapse_key',
            notification: notify,
            data: payload,
        };
        fcm.send(message, function(err, response) {
            if (err) {
                callback('error', err);
            } else {
                callback('success', response)
            }
        });
    }
};