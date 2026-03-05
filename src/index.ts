import Elysia, { type ElysiaConfig } from "elysia";

export function barista<BasePath extends string = "">(
	config?: ElysiaConfig<BasePath>,
) {
	return new Elysia(config);
}
