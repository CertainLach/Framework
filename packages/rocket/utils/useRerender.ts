import { useState } from "..";

/**
 * Call the return value to force rerendering of the current component
 */
export default () => {
	let [dummy, setDummy] = useState(0);
	return () => {
		setDummy(dummy++);
	}
}
