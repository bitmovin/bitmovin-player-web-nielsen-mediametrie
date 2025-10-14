import { Ad, LinearAd, PlayerAPI, VastAdData } from 'bitmovin-player';
import { v4 as uuidv4 } from 'uuid';

const LIVE_STREAM_LENGTH_SECONDS = 86400;
const MAX_BYTES = 2048; // Maximum size for metadata query string
const OPTIONAL_FIELDS_PRIORITY = [
  // Reverse priority order
  'nol_p19',
  'nol_p18',
  'nol_p17',
  'nol_p16',
  'nol_p15',
  'nol_p14',
  'nol_p13',
  'nol_p12',
  'nol_p11',
  'nol_p10',
  'nol_p9',
  'nol_p8',
  'nol_p7',
  'nol_p6',
  'nol_p5',
  'nol_p4',
  'nol_p3',
  'nol_p2',
  'nol_p1',
  'nol_p0',
  'cli_cn',
  'cli_ch',
  'cli_md',
];

// As listed here: https://engineeringportal.nielsen.com/wiki/France_SDK_Metadata#Content_Metadata
// Metadata structure required from the user by Nielsen SDK
export type NielsenUserProvidedContentMetadata = {
  assetId: string;
  subbrand: string;
  // Marked as optional here, although required they don't necessarily need to be provided by user
  program?: string;
  title?: string;
  // Optional user provided metadata
  cli_md?: 'LIVE' | 'TIMESHIFTING' | 'TVOD' | 'VOD' | 'SVOD' | 'AOD';
  cli_ch?: string;
  nol_p0?: string;
  nol_p1?: string;
  nol_p2?: string;
  nol_p3?: string;
  nol_p4?: string;
  nol_p5?: string;
  nol_p6?: string;
  nol_p7?: string;
  nol_p8?: string;
  nol_p9?: string;
  nol_p10?: string;
  nol_p11?: string;
  nol_p12?: string;
  nol_p13?: string;
  nol_p14?: string;
  nol_p15?: string;
  nol_p16?: string;
  nol_p17?: string;
  nol_p18?: string;
  nol_p19?: string;
};

export interface NielsenMetadata extends NielsenUserProvidedContentMetadata {
  // Required fields
  type: string;
  length: number;
  islive: 'y' | 'n';
}

export class NielsenMetadataBuilder {
  // Partial<NielsenMetadata> allows it to be incomplete during construction.
  private metadata: Partial<NielsenMetadata>;

  constructor(defaults: Partial<NielsenMetadata> = {}) {
    this.metadata = { ...defaults };
  }

  /*
   * Default method for building content metadata
   */
  withContent(player: PlayerAPI): this {
    const source = player.getSource();

    this.metadata.type = 'content';

    if (!this.metadata.title) {
      if (source?.title) {
        this.metadata.title = source.title;
      }
    }

    if (!this.metadata.program) {
      if (source?.dash) {
        this.metadata.program = source.dash;
      } else if (source?.hls) {
        this.metadata.program = source.hls;
      } else if (source?.title) {
        this.metadata.program = this.metadata.title;
      }
    }

    this.metadata.length = player.isLive() ? LIVE_STREAM_LENGTH_SECONDS : player.getDuration();
    this.metadata.islive = player.isLive() ? 'y' : 'n';

    return this;
  }

  /*
   * Default method for building ad metadata
   */
  withAd(ad: Ad): this {
    this.metadata.type = 'ad';
    this.metadata.assetId = ad.id ?? uuidv4();

    const linearAd = ad as LinearAd;
    if (linearAd.duration) {
      this.metadata.length = linearAd.duration;
    }

    const data = ad.data as VastAdData | undefined;
    const fallbackTitle = ad.mediaFileUrl ?? 'Untitled Ad';
    const fallbackProgram = ad.mediaFileUrl ?? 'Unknown Program';

    this.metadata.title = data?.adTitle ?? fallbackTitle;
    this.metadata.program = data?.adDescription ?? fallbackProgram;

    this.metadata.islive = 'n';
    return this;
  }

  withAssetId(assetId: string): this {
    this.metadata.assetId = assetId;
    return this;
  }

  withType(type: string): this {
    this.metadata.type = type;
    return this;
  }

  withIsLive(islive: 'y' | 'n'): this {
    this.metadata.islive = islive;
    return this;
  }

  withLength(length: number): this {
    this.metadata.length = length;
    return this;
  }

  withProgram(program: string): this {
    this.metadata.program = program;
    return this;
  }

  withTitle(title: string): this {
    this.metadata.title = title;
    return this;
  }

  withCliMD(cli_md: 'LIVE' | 'TIMESHIFTING' | 'TVOD' | 'VOD' | 'SVOD' | 'AOD'): this {
    this.metadata.cli_md = cli_md;
    return this;
  }

  withCliCH(cli_ch: string): this {
    this.metadata.cli_ch = cli_ch;
    return this;
  }

  withCustomField(key: `nol_p${number}`, value: string): this {
    if (value.includes('|') || value.includes('~')) {
      console.warn(`Nielsen custom field '${key}' contains invalid characters. Skipping.`);
      return this;
    }
    (this.metadata as any)[key] = value;
    return this;
  }

  /*
   * Builds the final Nielsen metadata object.
   */
  build(): NielsenMetadata {
    const requiredKeys: (keyof NielsenMetadata)[] = [
      'type',
      'assetId',
      'program',
      'title',
      'length',
      'islive',
      'subbrand',
    ];

    for (const key of requiredKeys) {
      if (this.metadata[key] === undefined || this.metadata[key] === null) {
        throw new Error(`Failed to build Nielsen metadata: Missing required field '${key}'.`);
      }
    }

    // Size check
    const data = { ...this.metadata };

    let query = this.serializeMetadata(data);
    let size = this.getByteSize(query);

    if (size <= MAX_BYTES) return data as NielsenMetadata;

    // Try trimming optional fields
    for (const key of OPTIONAL_FIELDS_PRIORITY) {
      delete (data as Record<string, any>)[key];
      query = this.serializeMetadata(data);
      size = this.getByteSize(query);
      if (size <= MAX_BYTES) return data as NielsenMetadata;
    }

    // If we reach here, we can't fit the metadata within the size limit
    throw new Error(`Failed to build metadata: Required fields exceed ${MAX_BYTES} bytes`);
  }

  private serializeMetadata(metadata: Record<string, any>): string {
    const entries = Object.entries(metadata)
      .filter(([_, v]) => v !== undefined && v !== null)
      .sort(([a], [b]) => a.localeCompare(b)) // consistent order
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);

    return entries.join('&');
  }

  private getByteSize(str: string): number {
    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(str).length;
    }

    // Fallback for older environments without TextEncoder
    let byteLength = 0;
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (code < 0x80) {
        byteLength += 1;
      } else if (code < 0x800) {
        byteLength += 2;
      } else if (code < 0xd800 || code >= 0xe000) {
        byteLength += 3;
      } else {
        byteLength += 4;
        i++;
      }
    }
    return byteLength;
  }
}
