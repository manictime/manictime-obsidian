import {  Plugin, Notice } from 'obsidian';
import * as path from 'path';

export default class ManicTime extends Plugin {

	async onload() {
		
		serverManager.init();
		
		const statusBar = this.addStatusBarItem();
		statusBar.setText('ManicTime');
		statusBar.addEventListener('click', this.onClick);

		this.app.workspace.on('active-leaf-change', () => this.sendData());
		this.app.workspace.on('file-open' , () =>this.sendData());
		this.app.workspace.on('window-open', () =>this.sendData());
		this.app.workspace.on('window-close',() => this.sendData());
		
		this.registerInterval(window.setInterval(() => this.sendData(), 5 * 60 * 1000));
	}

	getMetadata() {
		const activeFile = this.app.workspace.getActiveFile();
		
		const adapter = this.app.vault.adapter as any;
		if (activeFile) {
			return {
				fileName: activeFile.name,
				filePath: path.join(adapter.basePath, activeFile.path)
			};
		}
	}

	onClick() {
		const tooltip = serverManager.getServerInfo();
		new Notice(tooltip);
	}

	sendData() {
		const data = this.getMetadata();
		if (!data) {
			return null;
		}

		let text = '';
		try {
			serverManager.send("Obsidian", "ManicTime/Files", data.filePath, data.fileName);
		} catch (error) {
			text = error;
		}
	}
}

const serverManager = (function () {
	const servers: { port: string | number; ws: any }[] = [];
	let lastMessage: string | null = null;

	function init() {
		refreshServers();
		setInterval(refreshServers, 60000);
	}

	function refreshServers() {
		console.log("refreshServers started");
		for (let index = 0; index < 10; index++) {
			refreshServer(42870 + index);
		}
	}

	function refreshServer(port: string | number) {
		const index = findIndex(port);
		if (index !== -1) {
			return;
		}
		
		const ws = new WebSocket("ws://127.0.0.1:" + port + "/manictime-document/");

		ws.onopen = function () {
			console.log(port, "connection opened: port:" + port);
			servers.push({
				port: port,
				ws: ws
			});

			if (lastMessage !== null) {
				ws.send(lastMessage);
			}
		};

		ws.onclose = function () {
			removePort(port);
		};

		ws.onerror = function (ex: any) {
			removePort(port);
		};
	}

	function findIndex(port: string | number) {
		return servers.findIndex(function (o) {
			return o.port === port;
		});
	}


	function removePort(port: string | number) {
		const index = findIndex(port);
		if (index > -1) {
			servers.splice(index, 1);
		}
	}

	function getServers() {
		return servers;
	}

	//processNames, title, url, isPrivate
	function send(processName: any, documentType: any, document: any, documentGroup: any) {
		const message = JSON.stringify({
			ProcessName: processName,
			DocumentType: documentType,
			Document: document,
			DocumentGroup: documentGroup
		});

		lastMessage = message;

		console.log(servers);
		for (let index = 0; index < servers.length; index++) {
			servers[index].ws.send(message);
			console.log("message sent", message);
		}
	}

	function getServerInfo() {
		let msg = '';
		if (servers.length <= 0) {
			msg = 'ManicTime client is not connected.';
		} else {
			let ports = '';
			for (let i = 0; i < servers.length; i++) {
				ports += (ports !== '' ? ', ' : '') + servers[i].port;
			}
			msg = 'ManicTime client is connected on port(s): ' + ports + '.';
		}
		return msg;
	}

	return {
		init: init,
		send: send,
		getServers: getServers,
		getServerInfo: getServerInfo
	};
})();
