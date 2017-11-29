import errorHandler from "../lib/util";

export default class BaseAPIController {

    handleErrorResponse(res, err, next) {
        res.status(400).send(errorHandler(err));
    }

    handleSuccessResponse(res, next) {
        res.json({
            status: "SUCCESS"
        });
    }
}