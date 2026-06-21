import { createFileRoute } from '@tanstack/react-router'

async function loadMcpHandler() {
  const specifier = '../server/mcp/index'
  return import(specifier)
}

export const Route = createFileRoute('/mcp')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handlePost } = await loadMcpHandler()

        return handlePost(request)
      },
    },
  },
})
