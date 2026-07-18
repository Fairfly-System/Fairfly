/**
 * Middleware to check if the request body contains only allowed fields.
 * @param {Array} allowedFields - An array of allowed field names.
 * @returns {Function} - A middleware function that checks the request body.
 */
const allowedFields = (allowedFields) => {

    return (req, res, next) => {

        //Get the keys of the request body
        const requestFields = Object.keys(req.body);
        //Check if all request fields are allowed
        if(!requestFields.every(field => allowedFields.includes(field))) {
            return res.status(400).json({ error: 'Bad Request: Invalid fields in request body' });
        }
        //If all fields are allowed, proceed to the next middleware or route handler
        next();
    }

}

module.exports = {allowedFields};