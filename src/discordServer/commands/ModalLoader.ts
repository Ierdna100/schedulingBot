import fs from "fs";
import BaseModal from "./Modal.js";

export class ModalLoader {
    public static modals: BaseModal[] = [];

    public static async loadModals() {
        ModalLoader.modals = [];

        const modalFilenames = fs.readdirSync("./build/discordServer/commands/modals/");

        for (const modalFilename of modalFilenames) {
            let modal: { default: new () => BaseModal } = await import(`./modals/${modalFilename}`);
            ModalLoader.modals.push(new modal.default());
        }
    }

    public static getModalByCustomId(id: string): BaseModal | undefined {
        for (const modal of ModalLoader.modals) {
            if (modal.modalBuilder.data.custom_id == id) {
                return modal;
            }
        }

        return undefined;
    }
}
