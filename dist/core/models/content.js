import { parse } from "node-html-parser";
import { serialize, unserialize } from "../utils/serializer.js";
export class ContentModel {
    constructor(params) {
        this.params = params;
    }
    static empty(type) {
        return new ContentModel({
            type,
        });
    }
    static fromHtml(bodyHtml) {
        const root = parse(bodyHtml);
        const body = root.innerText;
        const type = root.querySelector('#type')?.getAttribute('value');
        const metadataRaw = root.querySelector('#metadata')?.getAttribute('value');
        let metadata;
        try {
            if (metadataRaw) {
                metadata = unserialize(metadataRaw);
            }
        }
        catch (error) {
            console.warn('Unable to parse metadata', metadataRaw, error);
        }
        return new ContentModel({
            type,
            body: body ?? bodyHtml,
            metadata,
        });
    }
    toDatabase() {
        const data = [
            `${this.params.body ?? ''}`,
            `<input type="hidden" id="metadata" value='${serialize(this.params.metadata)}'/>`,
            `<input type="hidden" id="type" value='${this.params.type}'/>`,
        ];
        return data.join('\n');
    }
    setMetadata(metadata) {
        this.params.metadata = metadata;
    }
}
