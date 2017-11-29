export default function(err) {
	if (typeof err === "string") {
		return {
			message: err,
		};
	} else if (err.message || err.error) {
		return {
			message: err.message || err.error,
		};
	}
	return err;
}