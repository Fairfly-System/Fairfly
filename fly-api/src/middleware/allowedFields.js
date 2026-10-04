/**
 * Middleware to check if the request body contains only allowed fields.
 * @param {Array} allowedFields - An array of allowed field names.
 * @returns {Function} - A middleware function that checks the request body.
 */
const allowedFields = (allowedFieldsList) => {
    return (req, res, next) => {
        const requestFields = Object.keys(req.body || {});
        const invalidFields = requestFields.filter(field => !allowedFieldsList.includes(field));
        if (invalidFields.length > 0) {
            console.warn(`[allowedFields] Blocked request to ${req.originalUrl}. Unexpected fields: ${invalidFields.join(', ')}`);
            return res.status(400).json({ 
                error: `Bad Request: Invalid fields in request body (${invalidFields.join(', ')})`,
                invalidFields
            });
        }
        next();
    };
};

module.exports = { allowedFields };