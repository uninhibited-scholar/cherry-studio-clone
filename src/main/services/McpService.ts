import { eq, desc } from 'drizzle-orm'
import { experimental_createMCPClient } from 'ai'
import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio'
import { getDb } from '../data/db/DbService'
import { mcpServer } from '../data/db/schemas/mcp'
import type { McpServer, McpTool } from '@shared/data/types/mcp'
import { loggerService } from '@logger'
import { nanoid } from 'nanoid'

const logger = loggerService.withContext('McpService')

type MCPClient = Awaited<ReturnType<typeof experimental_createMCPClient>>

export class McpService {
  /** serverId → active MCP client */
  private clients = new Map<string, MCPClient>()

  // ── CRUD ─────────────────────────────────────────────────────────────────

  async list(): Promise<McpServer[]> {
    const db = getDb()
    const rows = await db.select().from(mcpServer).orderBy(desc(mcpServer.createdAt))
    return rows.map(rowToServer)
  }

  async upsert(data: Partial<McpServer> & { name: string }): Promise<McpServer> {
    const db = getDb()
    const now = Date.now()
    const id = data.id ?? nanoid()
    await db
      .insert(mcpServer)
      .values({
        id,
        name: data.name,
        type: data.type ?? 'stdio',
        command: data.command ?? null,
        url: data.url ?? null,
        envJson: data.envJson ?? null,
        enabled: data.enabled ?? true,
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: mcpServer.id,
        set: {
          name: data.name,
          type: data.type ?? 'stdio',
          command: data.command ?? null,
          url: data.url ?? null,
          envJson: data.envJson ?? null,
          enabled: data.enabled ?? true,
          updatedAt: now
        }
      })
    const rows = await db.select().from(mcpServer).where(eq(mcpServer.id, id))
    return rowToServer(rows[0])
  }

  async delete(id: string): Promise<void> {
    await this.disconnect(id)
    const db = getDb()
    await db.delete(mcpServer).where(eq(mcpServer.id, id))
  }

  // ── Connection ────────────────────────────────────────────────────────────

  async connect(serverId: string): Promise<void> {
    if (this.clients.has(serverId)) {
      logger.info(`MCP server already connected: ${serverId}`)
      return
    }

    const db = getDb()
    const rows = await db.select().from(mcpServer).where(eq(mcpServer.id, serverId))
    if (!rows[0]) throw new Error(`MCP server not found: ${serverId}`)
    const server = rowToServer(rows[0])

    logger.info(`Connecting to MCP server: ${server.name} (${server.type})`)

    let client: MCPClient

    if (server.type === 'stdio') {
      if (!server.command?.trim()) throw new Error('stdio server requires a command')
      const parts = server.command.trim().split(/\s+/)
      const envOverrides = server.envJson ? JSON.parse(server.envJson) : {}

      const transport = new Experimental_StdioMCPTransport({
        command: parts[0],
        args: parts.slice(1),
        env: { ...process.env, ...envOverrides } as Record<string, string>
      })
      client = await experimental_createMCPClient({ transport })
    } else {
      // SSE
      if (!server.url?.trim()) throw new Error('sse server requires a URL')
      client = await experimental_createMCPClient({
        transport: { type: 'sse', url: server.url }
      })
    }

    this.clients.set(serverId, client)
    logger.info(`MCP server connected: ${server.name}`)
  }

  async disconnect(serverId: string): Promise<void> {
    const client = this.clients.get(serverId)
    if (client) {
      try { await client.close() } catch { /* ignore */ }
      this.clients.delete(serverId)
      logger.info(`MCP server disconnected: ${serverId}`)
    }
  }

  isConnected(serverId: string): boolean {
    return this.clients.has(serverId)
  }

  // ── Tools ─────────────────────────────────────────────────────────────────

  async getTools(serverId: string): Promise<McpTool[]> {
    const client = this.clients.get(serverId)
    if (!client) return []

    const db = getDb()
    const rows = await db.select().from(mcpServer).where(eq(mcpServer.id, serverId))
    const serverName = rows[0]?.name ?? serverId

    const toolSet = await client.tools()
    return Object.entries(toolSet).map(([name, tool]) => ({
      serverId,
      serverName,
      name,
      description: (tool as { description?: string }).description ?? '',
      inputSchema: (tool as { parameters?: Record<string, unknown> }).parameters ?? {}
    }))
  }

  async getAllConnectedTools(): Promise<Record<string, unknown>> {
    const allTools: Record<string, unknown> = {}
    for (const [serverId, client] of this.clients.entries()) {
      try {
        const toolSet = await client.tools()
        Object.assign(allTools, toolSet)
      } catch (err) {
        logger.warn(`Failed to get tools from server ${serverId}: ${err}`)
      }
    }
    return allTools
  }

  async callTool(serverId: string, toolName: string, args: unknown): Promise<unknown> {
    const client = this.clients.get(serverId)
    if (!client) throw new Error(`MCP server not connected: ${serverId}`)

    logger.info(`Calling MCP tool: ${toolName} on ${serverId}`)
    const toolSet = await client.tools()
    const tool = (toolSet as Record<string, { execute?: (args: unknown) => Promise<unknown> }>)[toolName]
    if (!tool?.execute) throw new Error(`Tool not found: ${toolName}`)
    return tool.execute(args)
  }

  async disconnectAll(): Promise<void> {
    for (const id of this.clients.keys()) {
      await this.disconnect(id)
    }
  }
}

function rowToServer(row: typeof mcpServer.$inferSelect): McpServer {
  return {
    id: row.id,
    name: row.name,
    type: row.type as 'stdio' | 'sse',
    command: row.command ?? undefined,
    url: row.url ?? undefined,
    envJson: row.envJson ?? undefined,
    enabled: row.enabled,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}

export const mcpService = new McpService()
