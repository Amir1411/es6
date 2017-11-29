import { connection } from "./connection";

const authenticateAccessToken = (userAccessToken, callback) => {

	var sql = "SELECT * FROM `user_details` WHERE `access_token`=? LIMIT 1";
	connection.query(sql, [userAccessToken], function(err, result) {
		if (result.length > 0) {
			return callback(result);
		} else {
			return callback(0);
		}
	});
};

module.exports = { authenticateAccessToken };