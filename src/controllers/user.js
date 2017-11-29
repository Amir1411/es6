import BaseAPIController from "./BaseAPIController";
import md5 from 'MD5';
import { successResult, verifyData, encodePassword, encodeEmail, serverError, mergeArray, countryCode, generateRandomString, validate, parameterMissing, createUniqueId } from "../modules/generic";
import { PARAMETER_MISSING_STATUS, BAD_REQUEST_STATUS, ALREADY_EXIST, SUCCESS_STATUS, INVALID_CREDENTIAL, INVALID_ACCESS_TOKEN } from '../constant/status';
import { USERNAME_EXIST, SUCCESS_MESSAGE, INVALID_ACCESS_TOKEN_MESSAGE, INVALID_MOBILE, INVALID_PASSWORD, INVALID_ARRAY, INVALID_PASSWORD_MESSAGE, INVALID_LOGIN_TYPE, INVALID_LOGIN_MESSAGE, USER_EXIST, LOGIN_SUCCESSFULLY_MESSAGE, MOBILE_NUMBER_MESSAGE, OTP_MATCHED, INVALID_VERIFICATION_CODE, USER_LOGOUT_MESSAGE, PASSWORD_CHANGE_MESSAGE, INVALID_EMAIL, OTP_SENT, VERIFICATION_MESSAGE } from '../constant/message';
import { connection } from "../modules/connection";
import { authenticateAccessToken } from "../modules/commonFunction";
import async from "async";
import _ from "lodash";
import config from '../../config';

export class UserController extends BaseAPIController {

	/* Controller for User Login  */
	login = (req, res) => {
		let { user_email, user_password } = req.body;
		let data = validate({ user_email, user_password });
		
		if (data.status) {
			data = data.data;
			let encrypted_pass = md5(user_password);
			data.user_password = encrypted_pass;
			data.user_email =user_email
			let sql = "SELECT * FROM `user_details` WHERE `user_email`=? LIMIT 1";
			connection.query(sql, [user_email], function(err, result_check) {
				if (err) {
					res.status(BAD_REQUEST_STATUS).json(serverError());
				} else {
					if (result_check.length == 0) {
						let response = {
							"status": INVALID_CREDENTIAL,
							"flag": 1,
							"response": {},
							"message": INVALID_EMAIL              
						};
						res.status(INVALID_CREDENTIAL).json(response);
					} else {
						if (result_check[0].user_password != data.user_password) {
							let response = {
								"status": INVALID_CREDENTIAL,
								"flag": 2,
								"response": {},
								"message": INVALID_PASSWORD
							};
							res.status(INVALID_CREDENTIAL).json(response);
						} else {
							result_check[0]["user_password"] = "";
							let response = {
								"status": SUCCESS_STATUS,
								"flag": 1,
								"message": LOGIN_SUCCESSFULLY_MESSAGE,
								"response": result_check[0]
							};
							res.status(SUCCESS_STATUS).json(response);
						}
					}
				}
			});
		} else {
			res.status(PARAMETER_MISSING_STATUS).json(parameterMissing(data.data));
		}
	}

	/* Controller for User Create*/ 
	create = (req, res) => {
		let {user_name, user_email, user_password} = req.body;

		let data = validate({ user_name, user_email, user_password });
		if (data.status) {
			let sql = "SELECT * FROM `user_details` WHERE user_email=? LIMIT 1";
			connection.query(sql, [user_email], function(err, response) {
				if (err) {
					res.status(BAD_REQUEST_STATUS).json(serverError());
				}  else if ( response.length > 0 ) {
					let message_response = "Email Id is already exist";
					let response = {
						status: ALREADY_EXIST,
						flag: 1,
						response: {},
						message: message_response
					};
					res.status(ALREADY_EXIST).json(response);        
				} else {

					let user_id = generateRandomString();
					let user_unique_id = md5(user_id);
					let access_token = md5(generateRandomString());
					let hash = md5(user_password);
					let currentTime = new Date();
					let created_on = Math.round(currentTime.getTime() / 1000);
					
					let sql = "INSERT INTO `user_details`(`user_id`, `access_token`, `user_name`, `user_email`, `user_password`, `created_on`) VALUES (?,?,?,?,?,?)";
					let value = [user_unique_id, access_token, user_name, user_email, hash, created_on];
					connection.query(sql, value, function (err, result) {
						if (err) {
							res.status(BAD_REQUEST_STATUS).json(serverError());
						} else {
							let response = {
								status: SUCCESS_STATUS,
								flag: 1,
								response: {
									"user_id": user_unique_id,
									"access_token": access_token,
									"user_name": user_name,
									"user_email": user_email,
									"created_on": created_on
								},
								message: "Succefully created account"
							};
							res.status(SUCCESS_STATUS).json(response); 
						}
					});
				}
			});
		} else {
			res.status(PARAMETER_MISSING_STATUS).json(parameterMissing(data.data));
		}
	}

	/* Controller for User Details  */
	get_user_details = (req, res) => {
		let { access_token, user_id } = req.body;
		let data = validate({ access_token, user_id });
		// console.log(data);
		if (data.status) {
			authenticateAccessToken(access_token, function(result) {
				console.log(result);
				if (result == 0) {
					let response = {
						status: INVALID_ACCESS_TOKEN,
						flag: 1,
						response: {},
						message: INVALID_ACCESS_TOKEN_MESSAGE    
					};
					res.status(INVALID_ACCESS_TOKEN).json(response);
					return; 
				} else {
					let check_sql = "SELECT * FROM `user_details` WHERE `user_id`=?";
					connection.query(check_sql, [user_id], function(err, result_check) {
						if (err) {
							res.status(BAD_REQUEST_STATUS).json(serverError());
						} else {
							if ( result_check.length > 0 ) {
								result_check[0].user_password = "";
								if ( result_check[0].user_thumbnail == '' ) {
									result_check[0].user_thumbnail = config.base_url+"/user/user_placeholder.jpeg";
								} else {
									result_check[0].user_thumbnail = config.base_url+"/user/"+result_check[0].user_thumbnail;
								}
								
								let response = {
									"status": SUCCESS_STATUS,
									"flag": 1,
									"message": SUCCESS_MESSAGE,
									"response": result_check[0]
								};
								res.status(SUCCESS_STATUS).json(response);
								return;
							} else {
								let response = {
									"status": SUCCESS_STATUS,
									"flag": 2,
									"response": {},
									"message": "No User Found."
								};
								res.status(SUCCESS_STATUS).json(response);
								return;
							}
						}
					});
				}
			});
		} else {
			res.status(PARAMETER_MISSING_STATUS).json(parameterMissing(data.data));
		}
	}

	/* Upload User Image*/ 
	upload_user_thumbnail = (req, res) => {
		let { access_token } = req.body;
		console.log(req.file);
		// console.log(req.files);
		let data = validate({ access_token });
		if (data.status) {
			authenticateAccessToken(access_token, function(result) {
				if (result == 0) {
					let response = {
						status: INVALID_ACCESS_TOKEN,
						flag: 1,
						response: {},
						message: INVALID_ACCESS_TOKEN_MESSAGE    
					};
					res.status(INVALID_ACCESS_TOKEN).json(response);
					return;
				} else {
					let user_id = result[0].user_id;
					
					let user_thumbnail = "";
					if ( req.file != undefined ) {
						user_thumbnail = req.file.filename;
					} 
					// console.log(user_thumbnail);

					let update = "UPDATE `user_details` SET `user_thumbnail`=? WHERE `user_id`=?";
					connection.query(update, [user_thumbnail, user_id], function(err, result){
						console.log(err);
						if (err) {
							res.status(BAD_REQUEST_STATUS).json(serverError());
						} else {
							console.log(user_thumbnail);
							console.log(req.file.filename);
							let user_thumbnails = config.base_url+'/user/'+req.file.filename;
							let response = {
								"status": SUCCESS_STATUS,
								"flag": 1,
								"message": SUCCESS_MESSAGE,
								"response": user_thumbnails
							};
							res.status(SUCCESS_STATUS).json(response);
							return;
						}
					});
				}
			});
		} else {
			res.status(PARAMETER_MISSING_STATUS).json(parameterMissing(data.data));
		}
	}

	/*Update User Profile*/ 
	update_profile = (req, res) => {
		let { access_token, user_name, work_position, user_description, user_address } = req.body;

		let data = validate({ access_token, user_name});
		if (data.status) {
			authenticateAccessToken(access_token, function(result) {
				if (result == 0) {
					let response = {
						status: INVALID_ACCESS_TOKEN,
						flag: 1,
						response: {},
						message: INVALID_ACCESS_TOKEN_MESSAGE   
					};
					res.status(INVALID_ACCESS_TOKEN).json(response);
					return;
				} else {
					let user_id = result[0].user_id;

					let update_sql = "UPDATE `user_details` SET `user_name`=?, `work_position`=?, `description`=?, `address`=? WHERE `user_id`=?";
					connection.query(update_sql, [user_name, work_position, user_description, user_address, user_id], function(err, result){
						console.log(err);
						if (err) {
							res.status(BAD_REQUEST_STATUS).json(serverError());
						} else {
							let user_query = "SELECT * FROM `user_details` WHERE `user_id`=?";
							connection.query(user_query,[user_id], function(err, userResult){
								if(err) {
									res.status(BAD_REQUEST_STATUS).json(serverError());
								} else {
									userResult[0].user_password = '';
									let response = {
										"status": SUCCESS_STATUS,
										"flag": 1,
										"message": SUCCESS_MESSAGE,
										"response": userResult[0]
									};
									res.status(SUCCESS_STATUS).json(response);
									return;
								}
							});
						}
					});
				}
			});
		} else {
			res.status(PARAMETER_MISSING_STATUS).json(parameterMissing(data.data));
		}
	}
}
const controller = new UserController();
export default controller;