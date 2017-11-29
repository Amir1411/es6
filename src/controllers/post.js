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

let postArray = [];
export class PostController extends BaseAPIController {
	
	/* Controller for User Create*/ 
	create = (req, res) => {
		let { access_token, post_caption } = req.body;
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
					if ( post_caption == undefined ) {
						post_caption = '';
					}

					let posted_by_id = result[0].user_id;
					let post_unique_id = generateRandomString();
					let post_id = md5(post_unique_id);
					let currentTime = new Date();
					let created_on = Math.round(currentTime.getTime() / 1000);

					let post_image = "";
					if ( req.file != undefined ) {
						post_image = req.file.filename;
					} 

					let sql = "INSERT INTO `post`(`post_id`, `posted_by_id`, `post_caption`, `post_image`, `created_on`) VALUES (?,?,?,?,?)";
					let value = [post_id, posted_by_id, post_caption, post_image, created_on];
					connection.query(sql, value, function (err, result) {
						if (err) {
							res.status(BAD_REQUEST_STATUS).json(serverError());
						} else { 
							let response = {
								status: SUCCESS_STATUS,
								flag: 1,
								response: SUCCESS_MESSAGE,
								message: SUCCESS_MESSAGE
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

	/* Controller for Get Post */ 
	get_post = (req, res) => {
		let { access_token } = req.body;
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
					let sql = "SELECT * FROM `post` ORDER BY `row_id` DESC";
					connection.query(sql, [], function(err, result) {
						if(err) {
							res.status(BAD_REQUEST_STATUS).json(serverError());
						} else if ( result.length > 0 ) {
							for (let i = 0; i < result.length; i++) {
								if ( result[i].post_image != "" ) {
									result[i].post_image = config.base_url+"/post/"+result[i].post_image;
								}
								result[i]["user_id"] = user_id;
								result[i]["user_access_token"] = access_token;
							}

							async.eachSeries(result, get_post_list_details, (err) => {
								let response = {
									status: SUCCESS_STATUS,
									flag: 1,
									response: postArray,
									message: SUCCESS_MESSAGE
								};
								res.status(SUCCESS_STATUS).json(response);
								postArray = [];
								return;
							});
							
						} else {
							let response = {
								status: SUCCESS_STATUS,
								flag: 1,
								response: {},
								message: SUCCESS_MESSAGE
							};
							res.status(SUCCESS_STATUS).json(response);
						}
					});
				}
			});
		} else {
			res.status(PARAMETER_MISSING_STATUS).json(parameterMissing(data.data));
		}
	};

	get_post_list_details = function(result, callback) {
		let user_id = result.user_id;
		let post_id = result.post_id;
		let posted_by_id = result.posted_by_id;

		let sql = "SELECT * FROM `user_details` WHERE `user_id`=?";
		connection.query(sql, [posted_by_id], function(err,userResult){
			if(err) {
				callback();
			} else {
				if ( userResult[0].user_thumbnail == '' ) {
					userResult[0].user_thumbnail = config.base_url+"/user/user_placeholder.jpeg";
				} else {
					userResult[0].user_thumbnail = config.base_url+"/user/"+userResult[0].user_thumbnail;
				}
				async.parallel([
					function(callback) {
		                get_commentList_with_posted_details(post_id,function(total_comment_list_result){
		                    callback(null,total_comment_list_result)
		                });
		            },
		            function(callback) {
		                get_comment_count(post_id,function(total_comment_count_result){
		                    callback(null,total_comment_count_result)
		                });
		            },
		            function(callback) {
		                get_like_count(post_id, user_id, function(total_like_count_result){
		                    callback(null,total_like_count_result)
		                });
		            },
		            function(callback) {
		                get_is_liked_by_me(post_id, user_id, function(is_liked_by_me_result){
		                    callback(null,is_liked_by_me_result)
		                });
		            }
				], function(err, results){
					result.post_comment = results[0];
					result.is_liked_by_me = results[3];
					result.post_like_count = results[2];
					result.post_comment_count = results[1];
					postArray.push({
						post_details: result, 
						user_details: userResult[0], 
						user_access_token: 
						result.user_access_token
					});
					callback();	
				});							
			}
		});
	};

	get_commentList_with_posted_details = ( post_id, callback ) => {
		let sql = "SELECT * FROM `post_comment` WHERE `post_id`=? ORDER BY `row_id` DESC LIMIT 2";
		connection.query(sql, [post_id], function(err,postCommentResult){
			if(err) {
				callback();
			} else {
				async.eachSeries(postCommentResult, get_commented_by_post_details, function (err) {
					callback(postCommentResult);
				});
			}
		});
	}

	get_commented_by_post_details = (postCommentResult, callback) => {
		let sql = "SELECT * FROM `user_details` WHERE `user_id`=?";
		connection.query(sql, [postCommentResult.post_commented_by_id], function(err, postCommentUserResult){
			if (err) {
				callback();
			} else {
				for (let i = 0; i < postCommentUserResult.length; i++) {
					postCommentUserResult[i]["user_password"] = "";
					if ( postCommentUserResult[i].user_thumbnail == '' ) {
						postCommentUserResult[i].user_thumbnail = config.base_url+"/user/user_placeholder.jpeg";
					} else if (postCommentUserResult[i].user_thumbnail != '') {
						postCommentUserResult[i].user_thumbnail = config.base_url+"/user/"+postCommentUserResult[i].user_thumbnail;
					}
				}
				postCommentResult.posted_details = postCommentUserResult[0];
				callback();
			}
		});
	}

	get_comment_count = ( post_id, callback) => {
		let sql = "SELECT * FROM `post_comment` WHERE `post_id`=?";
		connection.query(sql, [post_id], function(err,postCommentCountResult){
			if(err) {
				callback();
			} else {
				callback(postCommentCountResult.length);
			}
		});
	}

	get_like_count = (post_id, user_id, callback) => {
		let sql = "SELECT * FROM `post_like` WHERE `post_id`=? AND `post_like_by_id`!=?";
		connection.query(sql, [post_id, user_id], function(err,postLikeCountResult){
			if(err) {
				callback();
			} else {
				callback(postLikeCountResult.length);
			}
		});
	}

	get_is_liked_by_me = (post_id, user_id, callback) => {
		let sql = "SELECT * FROM `post_like` WHERE `post_like_by_id`=? AND `post_id`=?";
		connection.query(sql, [user_id, post_id], function(err,postLikeResult){
			if(err) {
				callback();
			} else {
				if ( postLikeResult.length == 0 ) {
					let is_liked_by_me = 0;
				} else {
					let is_liked_by_me = 1;
				}
				callback(is_liked_by_me);
			}
		});
	}
}

const controller = new PostController();
export default controller;