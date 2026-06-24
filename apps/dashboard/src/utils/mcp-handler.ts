import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
/* eslint-disable react-doctor/zod-v4-no-deprecated-schema-apis --
   Zod 3 project; migration to Zod 4 is a separate task. */
import z from 'zod'

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js'

const jsonRpcRequestSchema = z
  .object({
    jsonrpc: z.literal('2.0'),
    id: z.union([z.string(), z.number(), z.null()]).optional(),
    method: z.string(),
    params: z.unknown().optional(),
  })
  .strict()

export async function handleMcpRequest(
  request: Request,
  server: McpServer,
): Promise<Response> {
  let transports: ReturnType<typeof InMemoryTransport.createLinkedPair> | null =
    null

  try {
    const raw = await request.json()
    const parsed = jsonRpcRequestSchema.parse(raw)
    const jsonRpcRequest = parsed as JSONRPCMessage

    transports = InMemoryTransport.createLinkedPair()
    const [clientTransport, serverTransport] = transports

    const responsePromise = new Promise<JSONRPCMessage>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('MCP request timed out'))
      }, 5000)

      clientTransport.onmessage = (message: JSONRPCMessage) => {
        clearTimeout(timeout)
        resolve(message)
      }
    })

    /* eslint-disable react-doctor/async-parallel --
       Each step depends on the previous one; they cannot be parallelized. */
    await server.connect(serverTransport)

    await clientTransport.start()
    await serverTransport.start()

    await clientTransport.send(jsonRpcRequest)

    const responseData = await responsePromise

    return Response.json(responseData, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('MCP handler error:', error)

    // Return a JSON-RPC error response
    return Response.json(
      {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
          data: error instanceof Error ? error.message : String(error),
        },
        id: null,
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
  } finally {
    if (transports) {
      await Promise.allSettled(transports.map((transport) => transport.close()))
    }
  }
}
