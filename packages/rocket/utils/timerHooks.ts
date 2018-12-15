import { useEffect } from "..";

export const useTimeout = (cb: () => void, ms: number) => {
	useEffect(() => {
		const timeout = setTimeout(cb, ms);
		return () => clearTimeout(timeout);
	});
}
export const useInterval = (cb: () => void, ms: number) => {
	useEffect(() => {
		const timeout = setInterval(cb, ms);
		return () => clearInterval(timeout);
	});
}
