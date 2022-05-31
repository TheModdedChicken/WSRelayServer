import { WebSocketServer, WebSocket } from "ws"
import express from 'express'
import http from 'http'
import { Snowflake } from "nodejs-snowflake"
import url from "url"

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

interface WSLink {
	id: string
	client: WebSocket
	server: WebSocket
}

let WSLinks: WSLink[] = []

wss.on('connection', function connection(ws, req) {
	if (!req.url) return ws.close();
  const { query: { socket } } = url.parse(req.url, true);
	if (!socket) return ws.close();

	var link: WSLink = {
		id: `${new Snowflake().getUniqueID()}`,
		client: ws,
		server: new WebSocket(socket as string)
	}

	link.server.on('open', () => {
		link.server.on('message', (data) => {
			const curLink: WSLink | undefined = WSLinks.find(l => l.id === link.id)
			if (!curLink || !curLink.client) return ws.close();
			curLink.client.send(data.toString(), (err) => { 
				if (err) ws.send(JSON.stringify({ wsrs_error: "client:received_error" })) 
			})
		})
	})

	link.server.on('close', () => {
		const curLinkIndex = WSLinks.findIndex(l => l.id === link.id)
		if (curLinkIndex === -1) return;

		WSLinks.splice(curLinkIndex, 1)[0].client.close()
	})

	link.client.on('message', (data) => {
		const curLink: WSLink | undefined = WSLinks.find(l => l.id === link.id)
		if (!curLink || !curLink.server) return ws.close();
		curLink.server.send(data.toString(), (err) => { 
			if (err) ws.send(JSON.stringify({ wsrs_error: "client:received_error" })) 
		})
	})

	link.client.on('close', () => {
		const curLinkIndex = WSLinks.findIndex(l => l.id === link.id)
		if (curLinkIndex === -1) return;

		WSLinks.splice(curLinkIndex, 1)[0].server.close()
	})

	WSLinks.push(link)
});

app.all('/ping', (req, res) => {
	res.send("Pong!")
})

server.listen(8080, () => console.log("Listening on port 8080"))