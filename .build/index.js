var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};
var import_ws = __toModule(require("ws"));
var import_nodejs_snowflake = __toModule(require("nodejs-snowflake"));
var import_url = __toModule(require("url"));
const wss = new import_ws.WebSocketServer({ port: 8080 });
let WSLinks = [];
wss.on("connection", function connection(ws, req) {
  if (!req.url)
    return ws.close();
  const { query: { socket } } = import_url.default.parse(req.url, true);
  if (!socket)
    return ws.close();
  var link = {
    id: `${new import_nodejs_snowflake.Snowflake().getUniqueID()}`,
    client: ws,
    server: new import_ws.WebSocket(socket)
  };
  link.server.on("open", () => {
    link.server.on("message", (data) => {
      const curLink = WSLinks.find((l) => l.id === link.id);
      if (!curLink || !curLink.client)
        return ws.close();
      curLink.client.send(data, (err) => {
        if (err)
          ws.send(JSON.stringify({ wsrs_error: "client:received_error" }));
      });
    });
  });
  link.server.on("close", () => {
    const curLinkIndex = WSLinks.findIndex((l) => l.id === link.id);
    if (curLinkIndex === -1)
      return;
    WSLinks.splice(curLinkIndex, 1)[0].client.close();
  });
  link.client.on("message", (data) => {
    const curLink = WSLinks.find((l) => l.id === link.id);
    if (!curLink || !curLink.server)
      return ws.close();
    curLink.server.send(data, (err) => {
      if (err)
        ws.send(JSON.stringify({ wsrs_error: "client:received_error" }));
    });
  });
  link.client.on("close", () => {
    const curLinkIndex = WSLinks.findIndex((l) => l.id === link.id);
    if (curLinkIndex === -1)
      return;
    WSLinks.splice(curLinkIndex, 1)[0].server.close();
  });
  WSLinks.push(link);
});
//# sourceMappingURL=index.js.map
