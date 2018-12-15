import { useState } from "..";

export default () => {
	let [dummy, setDummy] = useState(0);
	return () => {
		setDummy(dummy++);
	}
}
