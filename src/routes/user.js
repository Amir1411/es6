import user from "../controllers/user";
import multer from 'multer';
import mkdirp from "mkdirp";
import path from "path";


// image path for uploading image
const STORAGE = (uploadPath = '') => {
	// console.log(uploadPath);
    return multer.diskStorage({
        destination: function(req, file, callback) {
            let dest = `src/uploads/${uploadPath}`;
            mkdirp.sync(dest);
            callback(null, dest);
        },
        filename: function(req, file, callback) {
            var fileUniquename = Date.now();
            callback(null, fileUniquename + path.extname(file.originalname));
        }
    });
}


export default (app) => {

    /* Route for login */
    app.route("/user/login").post(user.login);

    /* Route for create */
    app.route("/user/userCreate").post(user.create);

    /* Route for user details */
    app.route("/user/get_user_details").post(user.get_user_details);

    /* Route for user upload image */
    app.route("/user/upload_user_thumbnail").post(multer({ storage: STORAGE('user') }).single('user_thumbnail'), user.upload_user_thumbnail);

    /* Route for update user details */
    app.route("/user/update_profile").post(user.update_profile);

    return app;
};