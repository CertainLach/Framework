import {$} from '@meteor-it/dom';

//Mouse utils
let mouse = {
	x: 0,
	y: 0
};
window.onmousemove = (e) => {
	mouse.x = e.clientX;
	mouse.y = e.clientY - 40;
};

//...
$.hasPlugins=true;

// Applicable
$.fade = (element, prop, to, by, postfix) => new Promise((res, rej) => {
	requestAnimationFrame(() => {
		let cur = element.style[prop];
		if (!cur) {
			let setTo = to + postfix;
			element.style[prop] = setTo;
			if (element.style[prop] !== setTo) {
				return rej(new Error('Property is immutable!'));
			}
			return res();
		}
		cur = +cur.replace(postfix, '');
		if (cur === to) return res();
		if (cur < to) {
			cur = Math.min(cur + by, to);
		} else {
			cur = Math.max(cur - by, to);
		}
		let setTo = cur + postfix;
		element.style[prop] = setTo;
		if (element.style[prop] !== setTo) {
			return rej(new Error('Property is immutable!'));
		}
		if (cur === to) return res();
		$.fade(element, prop, to, by, postfix).then(res);
	});
});
$.clone = (element) => document.importNode(element.content || element, true);
$.pos = (element) => ({
	left: element.offsetLeft,
	top: element.offsetTop
});
$.mkdrag = (element, dir, onmove, onstart, onend) => {
	if (!dir)dir = 0;
	let interval;
	onmove();
	element.onmouseup = () => {
		if (onend) {
			onend();
		}
		if (interval) { clearInterval(interval); }
	};
	element.onmousedown = () => {
		if (onstart) {
			onstart();
		}
		interval = setInterval(() => {
			if (dir === 0 || dir === 2) {
				element.style.left = mouse.x + 'px';
			}
			if (dir === 0 || dir === 1) {
				element.style.top = mouse.y + 'px';
			}
			if (onmove) {
				onmove();
			}
		}, 1);
	};
};
$.dims = (element) => element.getBoundingClientRect();
$.template = (selector, data) => {
	let el = $(selector);
	let value = el.content;
	for (let key in data) {
		if (data.hasOwnProperty(key)) {
			let placeholder = `{{${key}}`;
			value = value.split(placeholder).join(data[key]);
		}
	}
	return document.importNode(value, true);
};
$.mouse = mouse;
$.doc = document;
$.body = document.body;
