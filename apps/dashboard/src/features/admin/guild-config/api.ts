import type { GuildConfig } from '@jordan-devs/shared'
import { guildConfigResponseSchema } from '@jordan-devs/shared'

import { apiRequest } from '#/lib/api'

export async function fetchGuildConfig(
  token: string,
  guildId: string,
): Promise<GuildConfig> {
  const response = await apiRequest(
    `/guild-configs/dashboard/${guildId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
    guildConfigResponseSchema,
  )

  return response.data
}

export async function upsertGuildConfig(
  token: string,
  data: GuildConfig,
): Promise<GuildConfig> {
  const response = await apiRequest(
    '/guild-configs/dashboard/upsert',
    {
      body: data,
      headers: { Authorization: `Bearer ${token}` },
      method: 'POST',
    },
    guildConfigResponseSchema,
  )

  return response.data
}
