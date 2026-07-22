const { performance } = require('perf_hooks');  

function timer(name, fn) {

    return async function(req, res, next) {

        //Start the timer
        const start = performance.now();

        try {
            //Execute the function (Controller or Middleware)
            await fn(req, res, next);
        } catch (error) {
            console.error(`Error in ${name}:`, error);
            return res.status(500).json({ error: 'Internal Server Error' });
        } finally {
            // Calculate the duration and log it
            const end = performance.now();
            const duration = end - start;
            console.log(`  ↳ ${name}: ${(end - start).toFixed(2)}ms from: ${req.ip || req.user?.uid || 'unknown source'}`);
        }

    }

}

module.exports = {timer};