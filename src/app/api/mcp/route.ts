import { NextResponse } from 'next/server';
import { mcpServer, MCP_SERVER_INFO, JsonRpcRequest } from '../../../lib/mcp/mcpServer';

/**
 * Model Context Protocol (MCP) HTTP / JSON-RPC 2.0 Endpoint
 */
export async function POST(request: Request) {
  try {
    const body: JsonRpcRequest = await request.json();
    const response = await mcpServer.handleRequest(body);
    return NextResponse.json(response);
  } catch (err: any) {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: `Parse error: ${err.message}` }
      },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ACTIVE',
    serverInfo: MCP_SERVER_INFO,
    description: 'DBC Agentic AI IDE — Model Context Protocol (MCP) Server',
    transport: 'HTTP JSON-RPC 2.0 / SSE',
    endpoint: '/api/mcp',
    toolsEndpoint: 'Send { jsonrpc: "2.0", method: "tools/list", id: 1 } via POST',
    resourcesEndpoint: 'Send { jsonrpc: "2.0", method: "resources/list", id: 1 } via POST'
  });
}
