import { h, RocketElement } from "./h";

function neverRun() {
	// Typings test, all of following texts should be valid and correctly typed
	const myComponent = (props: {
		a: number,
		b: number,
		children: string[],
	}) => {
		return null as RocketElement;
	}
	const myComponentThatReceivesOnlyChildren = (props: { children: string[] }) => {
		return null as RocketElement;
	}

	const el1 = h(myComponent, { a: 3, b: 2, children: ['Test'] });
	const el2 = h(myComponent, { a: 3, b: 3 }, ['Test']);
	const el3 = h(myComponentThatReceivesOnlyChildren, ['Test'])
	const el4 = h([
		el1,
		el2
	]);
	const el5 = h.observed(() => h([
		el4,
		el2
	]));
}
