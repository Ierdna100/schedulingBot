import { BaseModal } from './baseModal.js';
import fs from 'fs';

class ModalLoader {
    public static modals: BaseModal[] = [];
    
    public async loadModals() {
        ModalLoader.modals = []

        const modalFilenames = fs.readdirSync('./build/commands/modals/');

        for (const modalFilename of modalFilenames) {
            let command: { default: new () => BaseModal } = await import(`./commands/${modalFilename}`);
            ModalLoader.modals.push(new command.default())
        }
    }
}

export {ModalLoader};
