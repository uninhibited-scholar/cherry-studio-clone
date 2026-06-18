export type McpServerType = 'stdio' | 'sse'

export type McpServer = {
  id: string
  name: string
  type: McpServerType
  /** For stdio: the shell command (e.g. "npx -y @modelcontextprotocol/server-filesystem /tmp") */
  command?: string
  /** For sse: the endpoint URL */
  url?: string
  /** JSON-encoded env vars to pass to stdio process */
  envJson?: string
  enabled: boolean
  createdAt: number
  updatedAt: number
}

export type McpTool = {
  serverId: string
  serverName: string
  name: string
  description: string
  inputSchema: Record<string, unknown>
}
