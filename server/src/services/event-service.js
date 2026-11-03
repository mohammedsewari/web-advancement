// One process keeps its own public availability subscribers; no private data is sent.
const clients = new Set();

export function connect(req, res) {
    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no'
    });
    res.flushHeaders();
    res.write('retry: 3000\nevent: ready\ndata: {}\n\n');
    clients.add(res);
    // Comments keep idle connections alive without creating application events.
    const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 20000);
    res.on('close', () => {
        clearInterval(heartbeat);
        clients.delete(res);
    });
}

export function notifyAvailability() {
    for (const client of clients) {
        // Slow clients reconnect and fetch current data instead of buffering forever.
        if (!client.write('event: availability\ndata: {}\n\n')) client.destroy();
    }
}
