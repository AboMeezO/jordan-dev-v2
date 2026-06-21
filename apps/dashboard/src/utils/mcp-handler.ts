import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js'

export async function handleMcpRequest(
  request: Request,
  server: McpServer,
): Promise<Response> {
  let transports: ReturnType<typeof InMemoryTransport.createLinkedPair> | null =
    null

  try {
    const jsonRpcRequest = (await request.json()) as JSONRPCMessage

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
      await Promise.allSettled(
        transports.map((transport) => transport.close()),
      )
    }
  }
}
