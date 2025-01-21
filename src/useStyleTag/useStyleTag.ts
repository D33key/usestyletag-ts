import { useCallback, useEffect, useRef, useState } from 'react';

export interface ConfigurableDocument {
	document?: Document;
}

export interface UseStyleTagOptions extends ConfigurableDocument {
	media?: string;
	immediate?: boolean;
	manual?: boolean;
	id?: string;
	onLoad?: () => void;
	onUnLoad?: () => void;
	deleteStyleOnUnmount?: boolean;
}

export interface UseStyleTagReturn {
	id: string;
	css: string;
	load: () => void;
	unload: () => void;
	isLoaded: boolean;
	updateCss: (value: string) => void;
}

function useStyleTag(
	css: string,
	options: UseStyleTagOptions = {},
): UseStyleTagReturn {
	const {
		media,
		immediate = true,
		manual = false,
		id = `head-style-id-${Math.random().toString(36).substring(2)}`,
		document = window.document,
		onLoad,
		onUnLoad,
		deleteStyleOnUnmount = true,
	} = options;

	const styleRef = useRef<HTMLStyleElement | null>(null);
	const [changableCss, setChangableCss] = useState(css);
	const [isLoaded, setIsLoaded] = useState(false);

	const load = useCallback(() => {
		if (!isLoaded && !styleRef.current && document?.head) {
			const styleElement =
				(document.getElementById(id) as HTMLStyleElement) ??
				document.createElement('style');
			if (!styleElement.isConnected) {
				styleElement.id = id;

				if (media) {
					styleElement.media = media;
				}

				document.head.appendChild(styleElement);
			}

			styleElement.textContent = changableCss;
			styleRef.current = styleElement;

			onLoad?.();

			setIsLoaded(true);
		}
	}, [isLoaded, changableCss]);

	const unload = useCallback(() => {
		if (isLoaded || styleRef.current) {
			document.head.removeChild(styleRef.current!);
			styleRef.current = null;

			onUnLoad?.();

			setIsLoaded(false);
		}
	}, [isLoaded]);

	useEffect(() => {
		if (immediate && !manual) {
			load();
		}

		return () => {
			if (deleteStyleOnUnmount) unload();
		};
	}, [immediate, manual]);

	useEffect(() => {
		if (isLoaded && styleRef.current) {
			styleRef.current.textContent = changableCss;
		}
	}, [changableCss]);

	return {
		id,
		css: changableCss,
		updateCss: (value: string) => setChangableCss(value),
		load,
		unload,
		isLoaded,
	};
}

export default useStyleTag;
