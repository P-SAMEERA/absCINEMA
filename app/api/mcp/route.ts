import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

const SERVER_PATH = path.join(process.cwd(), 'mcp-server', 'index.mjs');

/**
 * Spawn the MCP server as a child process, send a single tools/call request,
 * and return the response. We re-spawn for each request for simplicity;
 * a production app would keep a persistent process.
 */
async function callMcpServer(tool: string, args: Record<string, unknown>): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [SERVER_PATH], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false,
    });

    let buffer = '';
    let initialized = false;
    const initId = 1;
    const callId = 2;

    const sendMsg = (obj: unknown) => {
      child.stdin.write(JSON.stringify(obj) + '\n');
    };

    // Step 1: send initialize
    sendMsg({
      jsonrpc: '2.0',
      id: initId,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'abscinema-next', version: '1.0.0' },
      },
    });

    child.stdout.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const msg = JSON.parse(trimmed);

          if (!initialized && msg.id === initId) {
            initialized = true;
            // Send initialized notification
            sendMsg({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} });
            // Now call the tool
            sendMsg({
              jsonrpc: '2.0',
              id: callId,
              method: 'tools/call',
              params: { name: tool, arguments: args },
            });
          } else if (msg.id === callId) {
            child.kill();
            if (msg.error) {
              reject(new Error(msg.error.message || JSON.stringify(msg.error)));
            } else {
              const content = msg.result?.content?.[0]?.text;
              try {
                resolve(content ? JSON.parse(content) : msg.result);
              } catch {
                resolve(content || msg.result);
              }
            }
          }
        } catch {
          // ignore malformed lines
        }
      }
    });

    child.stderr.on('data', (chunk: Buffer) => {
      // MCP server stderr — log but don't fail
      console.error('[MCP stderr]', chunk.toString());
    });

    child.on('error', (e) => reject(new Error(`Failed to spawn MCP server: ${e.message}`)));

    // Timeout after 15 seconds
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error('MCP server timeout'));
    }, 15000);

    child.on('close', () => clearTimeout(timeout));
  });
}

export async function POST(req: NextRequest) {
  try {
    const { tool, args } = await req.json();

    if (!tool || typeof tool !== 'string') {
      return NextResponse.json({ error: 'Missing tool name' }, { status: 400 });
    }

    const result = await callMcpServer(tool, args || {});
    return NextResponse.json({ result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
