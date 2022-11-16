
type PartialRecord<K extends keyof any, T> = {
	[P in K]?: T;
}

const defaultOptions = {
	width: (option: string) => option.startsWith("w-"),
	height: (option: string) => option.startsWith("h-"),
	top: (option: string) => option.startsWith("top-"),
	left: (option: string) => option.startsWith("left-"),
	right: (option: string) => option.startsWith("right-"),
	bottom: (option: string) => option.startsWith("bottom-"),
	position: (option: string) => option.startsWith("position-"),
	pointer_events: (option: string) => option.startsWith("pointer-events-"),
}

type DefaultOption = PartialRecord<keyof typeof defaultOptions, string>;

export default function applyDefaults(className: string | undefined, defaults: DefaultOption): string
{
	const classOptions: string[] = className?.split(" ") ?? [];
	// @ts-ignore
	const defaultPairs = Object.entries(defaults).map(([key, value]) => [value, defaultOptions[key]]);

	let flags: boolean[] = [];
	for (let i = 0; i < defaultPairs.length; i++)
	{
		flags.push(false);
	}

	for (let i = 0; i < classOptions.length; i++)
	{
		for (let j = 0; j < defaultPairs.length; j++)
		{
			if (defaultPairs[j][1](classOptions[i]))
			{
				flags[j] = true;
			}
		}
	}

	for (let i = 0; i < defaultPairs.length; i++)
	{
		if (!flags[i])
		{
			classOptions.push(defaultPairs[i][0]);
		}
	}

	return classOptions.join(" ");
}