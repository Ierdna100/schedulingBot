import { flatten } from "discord.js";
import fs from "fs";

export class Logger {
    private static detailLookup = {
        cl: "\u001b[0m", // clear
        bk: "\u001b[30m", // black
        rd: "\u001b[31m", // red
        gr: "\u001b[32m", // green
        yl: "\u001b[33m", // yellow
        bl: "\u001b[34m", // blue
        mg: "\u001b[35m", // magenta
        cy: "\u001b[36m", // cyan
        wt: "\u001b[37m", // white
        df: "\u001b[39m", // default
        BK: "\u001b[40m", // background black
        RD: "\u001b[41m", // background red
        GR: "\u001b[42m", // background green
        YL: "\u001b[43m", // background yellow
        BL: "\u001b[44m", // background blue
        MG: "\u001b[45m", // background magenta
        CY: "\u001b[46m", // background cyan
        WT: "\u001b[47m", // background white
        DF: "\u001b[49m", // background default
        "&": "&", // literal "&"
        _: "\u001b[4m", // underline
        "~": "\u001b[9m", // strike-through
        "/": "\u001b[3m", // italics
        "*": "\u001b[2m" // bold
    };

    public name;

    constructor(name?: string) {
        if (name != undefined) {
            this.name = `[${name}] `;
        } else {
            this.name = "";
        }
    }

    public info(data: string): void {
        const baseString = this.logTime() + this.name;
        this.logToFile(baseString + this.parseDetails(data, true));
        console.log(baseString + this.parseDetails(data, false) + Logger.detailLookup.cl);
    }

    public trace(data: string): void {
        const baseString = this.logTime() + this.name;
        this.logToFile(baseString + this.parseDetails(data, true));
        console.trace(Logger.detailLookup.yl + baseString + this.parseDetails(data, false) + Logger.detailLookup.cl);
    }

    public error(data: Error): void {
        const baseString = this.logTime() + this.name + data.message;
        this.logToFile(baseString);
        console.error(Logger.detailLookup.rd + baseString + Logger.detailLookup.cl);
    }

    public warn(data: string): void {
        const baseString = this.logTime() + this.name;
        this.logToFile(baseString + this.parseDetails(data, true));
        console.warn(Logger.detailLookup.yl + this.name + this.logTime() + this.parseDetails(data, false) + Logger.detailLookup.cl);
    }

    private logToFile(data: string) {
        const filenameDate = new Date();
        filenameDate.setHours(0, 0, 0, 0);
        // prettier-ignore
        const filename = `${filenameDate.getFullYear().toString().padStart(2, "0")}-${(filenameDate.getMonth() + 1).toString().padStart(2, "0")}-${filenameDate.getDate().toString().padStart(2, "0")}.log`;
        fs.appendFileSync(`./logs/${filename}`, data + "\n");
    }

    private logTime(): string {
        const date = new Date();
        return (
            "[" +
            date.getHours().toString().padStart(2, "0") +
            ":" +
            date.getMinutes().toString().padStart(2, "0") +
            ":" +
            date.getSeconds().toString().padStart(2, "0") +
            "." +
            date.getMilliseconds().toString().padStart(3, "0") +
            "] "
        );
    }

    private parseDetails(data: string, removeDetails: boolean): string {
        let output = "";
        let continueAmount = 0;
        for (let i = 0; i < data.length; i++) {
            if (continueAmount != 0) {
                continueAmount--;
                continue;
            }
            const char = data[i];

            if (char == "&") {
                if (i == data.length - 1) {
                    console.log(Logger.detailLookup.RD + Logger.detailLookup.wt + "Console detail had no specifier!" + Logger.detailLookup.cl);
                    return data;
                }

                continueAmount++;
                switch (data[i + 1]) {
                    case "&":
                        output += removeDetails ? "" : Logger.detailLookup["&"];
                        continue;
                    case "_":
                        output += removeDetails ? "" : Logger.detailLookup["_"];
                        continue;
                    case "~":
                        output += removeDetails ? "" : Logger.detailLookup["~"];
                        continue;
                    case "/":
                        output += removeDetails ? "" : Logger.detailLookup["/"];
                        continue;
                    case "*":
                        output += removeDetails ? "" : Logger.detailLookup["*"];
                        continue;
                }

                if (i == data.length - 2) {
                    console.log(Logger.detailLookup.RD + Logger.detailLookup.wt + "Console detail had no specifier!" + Logger.detailLookup.cl);
                    return data;
                }

                continueAmount++;
                const parsedDetail = Logger.detailLookup[(data[i + 1] + data[i + 2]) as keyof typeof Logger.detailLookup] as string | undefined;
                if (parsedDetail == undefined) {
                    // prettier-ignore
                    console.log(Logger.detailLookup.RD + Logger.detailLookup.wt + `Parsed detail for specifier "${data[i + 1] + data[i + 2]}" was invalid!` + Logger.detailLookup.cl);
                    return data;
                }

                output += removeDetails ? "" : parsedDetail;
                continue;
            }

            output += char;
        }

        return output;
    }
}
