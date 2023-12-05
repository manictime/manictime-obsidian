

export class ServerManager {
    private servers: { port: string | number; ws: any }[] = [];
    private lastMessage: string | null = null;
    private timer: NodeJS.Timer | null = null;
    init() {
        this.refreshServers();
        this.timer = setInterval(() =>this.refreshServers(), 60000);
    }

    refreshServers() {
        console.log("refreshServers started");
        for (let index = 0; index < 10; index++) {
            this.refreshServer(42870 + index);
        }
    }

    refreshServer(port: string | number) {
        const index = this.findIndex(port);
        if (index !== -1) {
            return;
        }

        const ws = new WebSocket("ws://127.0.0.1:" + port + "/manictime-document/");

        ws.onopen = () => {
            console.log(port, "connection opened: port:" + port);
            this.servers.push({
                port: port,
                ws: ws
            });

            if (this.lastMessage !== null) {
                ws.send(this.lastMessage);
            }
        };

        ws.onclose = () => {
            this.removePort(port);
        };

        ws.onerror = (ex: any) => {
            this.removePort(port);
        };
    }

    findIndex(port: string | number) {
        return this.servers.findIndex(function (o) {
            return o.port === port;
        });
    }

    removePort(port: string | number) {
        const index = this.findIndex(port);
        if (index > -1) {
            this.servers.splice(index, 1);
        }
    }

    send(processName: any, documentType: any, document: any, documentGroup: any) {
        const message = JSON.stringify({
            ProcessName: processName,
            DocumentType: documentType,
            Document: document,
            DocumentGroup: documentGroup
        });

        this.lastMessage = message;

        console.log(this.servers);
        for (let index = 0; index < this.servers.length; index++) {
            this.servers[index].ws.send(message);
            console.log("message sent", message);
        }
    }

    getServerInfo() {
        let msg = '';
        if (this.servers.length <= 0) {
            msg = 'ManicTime client is not connected.';
        } else {
            let ports = '';
            for (let i = 0; i < this.servers.length; i++) {
                ports += (ports !== '' ? ', ' : '') + this.servers[i].port;
            }
            msg = 'ManicTime client is connected on port(s): ' + ports + '.';
        }
        return msg;
    }

    dispose() {
        if (this.timer != null) {
            clearInterval(this.timer)
        }
        this.servers = [];
        this.timer = null;
    }
}