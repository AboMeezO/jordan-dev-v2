import { createFileRoute } from '@tanstack/react-router'

async function loadMcpHandler() {
  return import('../server/mcp/index')
}

async function authorizeRequest(request: Request): Promise<void> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Response('Unauthorized', { status: 401 })
  }
}

export const Route = createFileRoute('/mcp')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        await authorizeRequest(request)

        const { handlePost } = await loadMcpHandler()

        return handlePost(request)
      },
    },
  },
})
