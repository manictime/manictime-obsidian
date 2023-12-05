import {  Plugin, Notice } from 'obsidian';
import * as path from 'path';

import { ServerManager } from './serverManager';

export default class ManicTime extends Plugin {
	serverManager: ServerManager;

	async onload() {
		this.serverManager = new ServerManager();
		this.serverManager.init();
		
		const statusBar = this.addStatusBarItem();
		statusBar.setText('ManicTime');
		statusBar.addEventListener('click', () => this.onClick());
	
		this.registerEvent(this.app.workspace.on('active-leaf-change', () => this.sendData()));
		this.registerEvent(this.app.workspace.on('file-open' , () =>this.sendData()));
		this.registerEvent(this.app.workspace.on('window-open', () =>this.sendData()));
		this.registerEvent(this.app.workspace.on('window-close',() => this.sendData()));
		
		this.registerInterval(window.setInterval(() => this.sendData(),  30 * 1000));
	}

	async onunload() {
		this.serverManager.dispose();
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
		const tooltip = this.serverManager.getServerInfo();
		new Notice(tooltip);
	}

	sendData() {
		const data = this.getMetadata();
		if (!data) {
			return null;
		}

		let text = '';
		try {
			this.serverManager.send("Obsidian", "ManicTime/Files", data.filePath, data.fileName);
		} catch (error) {
			text = error;
		}
	}
}
