import Elysia, { type ElysiaConfig } from "elysia";

export function Barista<BasePath extends string = "">(
	config?: ElysiaConfig<BasePath>,
) {
	return new Elysia(config);
}
