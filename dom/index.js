/**
 * Created by f6cf on 14.12.2016.
 */

const STATIC_FUNCS = ['doc', 'body', 'template', 'mouse'];
let warned=false;

function _$ (el, inel = document, all = false) {
	if(!warned){
		console.log('Plugins are not installed. Require @ufr/domPlugins once to fix that error');
		warned=true;
	}
	if (typeof el === 'number') {
		throw new Error('Number passed as selector!');
	} else if (typeof el === 'string') {
		const elname = el.substr(1);
		let els;
		switch (el[0]) {
		case '#':
			return _$(document.getElementById(elname));
		case '.':
			els = [].slice.call(inel.getElementsByClassName(elname));
			console.log(els);
			return all ? els.map((el) => _$(el, null, null)) : _$(els[0], null, null);
		case '=':
			els = [].slice.call(inel.getElementsByTagName(elname));
			return all ? els.map((el) => _$(el, null, null)) : _$(els[0], null, null);
		case '&':
			els = [].slice.call(document.getElementsByName(elname));
			return all ? els.map((el) => _$(el, null, null)) : _$(els[0], null, null);
		case '$':
			els = inel[all ? 'querySelectorAll' : 'querySelector'](elname);
                // noinspection UnnecessaryLocalVariableJS
			let retval = all ? [...els].map((el) => _$(el, null, null)) : _$(els, null, null);
			return retval;
		default:
			throw new Error('Error in call to _$!');
		}
	} else if (el instanceof HTMLElement) {
		if (el._$) {
			return el;
		}
		el._$ = 1;
		el.$ = (tf) => {
			return _$(tf, el, false);
		};
		el.$$ = (tf) => {
			return _$(tf, el, true);
		};
		for (let func in $) {
			if ($.hasOwnProperty(func) && !~STATIC_FUNCS.indexOf(func)) { el[func] = (...args) => $[func](el, ...args); }
		}
		return el;
	} else if (typeof el === 'undefined') {
		return null;
	} else if (el === null) {
		return null;
	}
}

/**
 * Wrap element in ZHTMLElement
 * Or get element by zselector
 */
export function $ (el) {
	return _$(el, document, false);
}
/**
 * Wrap element in ZHTMLElement
 * Or get elements by zselector
 */
export function $$ (el) {
	return _$(el, document, true);
}
