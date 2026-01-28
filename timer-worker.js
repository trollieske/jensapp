// timer-worker.js
// Web Worker for reliable timer intervals in background tabs

let timerInterval = null;

self.onmessage = function(e) {
    if (e.data === 'start') {
        if (!timerInterval) {
            // Run every second
            timerInterval = setInterval(() => {
                self.postMessage('tick');
            }, 1000);
        }
    } else if (e.data === 'stop') {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }
};