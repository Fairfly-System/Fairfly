const {timer} = require('./timer');

function performanceProfiler(routeName, ...handlers) {

    // Wrap each handler with the timer middleware to profile its performance
    return handlers.map(handler => timer(new Date().toISOString().split("T")[1].replace("Z", "") + ' - ' + routeName + ' - ' + (handler.name || 'Anonymous Handler'), handler));

}

module.exports = {performanceProfiler};