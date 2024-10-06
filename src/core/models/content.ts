import { parse } from "node-html-parser";
import {serialize, unserialize} from "../utils/serializer.js";

export type ContentType = string;
export class ContentModel<METADATA = unknown> {
  constructor(
    public params: {
      type?: ContentType,
      body?: string,
      metadata?: METADATA,
    },
  ) {
  }

  static empty<T>(type: ContentType) {
    return new ContentModel<T>({
      type,
    })
  }

  static fromHtml(bodyHtml: string) {
    const root = parse(bodyHtml);

    const body = root.innerText;

    const type = root.querySelector('#type')?.getAttribute('value')
    const metadataRaw = root.querySelector('#metadata')?.getAttribute('value');

    let metadata;
    try {
      if (metadataRaw) {
        metadata = unserialize(metadataRaw);
      }

    } catch (error) {
      console.warn('Unable to parse metadata', metadataRaw, error);
    }


    return new ContentModel({
      type,
      body: body ?? bodyHtml,
      metadata,
    })
  }


  toDatabase(): string {
    const data = [
      `${this.params.body ?? ''}`,
      `<input type="hidden" id="metadata" value='${serialize(this.params.metadata)}'/>`,
      `<input type="hidden" id="type" value='${this.params.type}'/>`,
    ]

    return data.join('\n');

  }

  setMetadata(metadata: METADATA) {
    this.params.metadata = metadata;
  }
}