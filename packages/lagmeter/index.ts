const STANDARD_HIGHWATER = 70;
const STANDARD_INTERVAL = 500;

// A dampening factor.  When determining average calls per second or
// current lag, we weight the current value against the previous value 2:1
// to smooth spikes.
const AVG_DECAY_FACTOR = 3;

let lastTime = new Date().valueOf()
let now;
let lag;
let highWater = STANDARD_HIGHWATER;
let interval = STANDARD_INTERVAL;
export let currentLag = 0;

const checkInterval = setInterval(() => {
	now = new Date().valueOf();
	lag = now - lastTime;
	lag = (lag < interval) ? 0 : lag - interval;
	currentLag = (lag + (currentLag * (AVG_DECAY_FACTOR - 1))) / AVG_DECAY_FACTOR;
	lastTime = now;
}, interval);

if ('unref' in checkInterval) {
	// Don't keep process open just for this timer.
	checkInterval.unref();
}

export function toobusy() {
	// If current lag is < 2x the highwater mark, we don't always call it 'too busy'. E.g. with a 50ms lag
	// and a 40ms highWater (1.25x highWater), 25% of the time we will block. With 80ms lag and a 40ms highWater,
	// we will always block.
	const pctToBlock = (currentLag - highWater) / highWater;
	return Math.random() < pctToBlock;
};

function shutdown() {
	clearInterval(checkInterval);
};
