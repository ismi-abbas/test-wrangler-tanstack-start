import { createContext } from "@test-app/api/context";
import { appRouter } from "@test-app/api/routers/index";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { RPCHandler } from "@orpc/server/fetch";
import { onError } from "@orpc/server";
import { createFileRoute } from "@tanstack/react-router";

const rpcHandler = new RPCHandler(appRouter, {
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});

const apiHandler = new OpenAPIHandler(appRouter, {
	plugins: [
		new OpenAPIReferencePlugin({
			schemaConverters: [new ZodToJsonSchemaConverter()],
		}),
	],
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});

async function handle({ request }: { request: Request }) {
	const rpcResult = await rpcHandler.handle(request, {
		prefix: "/api/rpc",
		context: await createContext({ req: request }),
	});
	if (rpcResult.response) return rpcResult.response;

	const apiResult = await apiHandler.handle(request, {
		prefix: "/api/rpc/api-reference",
		context: await createContext({ req: request }),
	});
	if (apiResult.response) return apiResult.response;

	return new Response("Not found", { status: 404 });
}

export const Route = createFileRoute("/api/rpc/$")({
	server: {
		handlers: {
			HEAD: handle,
			GET: handle,
			POST: handle,
			PUT: handle,
			PATCH: handle,
			DELETE: handle,
		},
	},
});
