import post from "../controllers/post";
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
    app.route("/post/create_post").post(multer({ storage: STORAGE('post') }).single('post_image'), post.create);

    /* Route for create */
    app.route("/post/get_post").post(post.get_post);

    /* Route for post details */
    // app.route("/post/get_post_details").post(post.get_post_details);

    /* Route for post upload image */
    // app.route("/post/upload_post_thumbnail").post(multer({ storage: STORAGE('post') }).single('post_thumbnail'), post.upload_post_thumbnail);

    /* Route for update post details */
    // app.route("/post/update_profile").post(post.update_profile);

    return app;
};