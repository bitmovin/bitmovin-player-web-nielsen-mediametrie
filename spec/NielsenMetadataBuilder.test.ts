import { NielsenMetadata, NielsenMetadataBuilder } from '../src/ts/NielsenMetadataBuilder';
import { Ad, LinearAd, VastAdData, PlayerAPI } from 'bitmovin-player';

describe('NielsenMetadataBuilder', () => {
  let playerMock: jest.Mocked<PlayerAPI>;

  beforeEach(() => {
    playerMock = {
      getSource: jest.fn().mockReturnValue({ title: 'Test Title', hls: 'test.m3u8' }),
      isLive: jest.fn().mockReturnValue(false),
      getDuration: jest.fn().mockReturnValue(120),
    } as any;
  });

  it('should build a valid metadata object from a player instance', () => {
    const builder = new NielsenMetadataBuilder({ subbrand: 'test-brand' });
    const metadata = builder
      .withAssetId('asset-123')
      .withContent(playerMock)
      .build();

    expect(metadata).toEqual({
      type: 'content',
      assetId: 'asset-123',
      program: 'test.m3u8',
      title: 'Test Title',
      length: 120,
      islive: 'n',
      subbrand: 'test-brand',
    });
  });

  it('should build a valid metadata object from a player instance', () => {
    const builder = new NielsenMetadataBuilder({ subbrand: 'test-brand' });
    const metadata = builder
      .withAssetId('asset-123')
      .withContent(playerMock)
      .build();

    expect(metadata).toEqual({
      type: 'content',
      assetId: 'asset-123',
      program: 'test.m3u8',
      title: 'Test Title',
      length: 120,
      islive: 'n',
      subbrand: 'test-brand',
    });
  });

  it('should prioritize values on constructor over player state', () => {
    const builder = new NielsenMetadataBuilder({ subbrand: 'test-brand', title: 'My Title', program: 'My Program' });
    const metadata = builder
      .withAssetId('asset-123')
      .withContent(playerMock)
      .build();

    expect(metadata).toEqual({
      type: 'content',
      assetId: 'asset-123',
      program: 'My Program',
      title: 'My Title',
      length: 120,
      islive: 'n',
      subbrand: 'test-brand',
    });
  });

  describe('should build', () => {
    const validBaseMetadata: NielsenMetadata = {
      type: 'content',
      assetId: 'asset-123',
      program: 'test.m3u8',
      title: 'Test Title',
      length: 120,
      islive: 'n',
      subbrand: 'test-brand',
    }
    it('withIsLive method', () => {
      const metadata = new NielsenMetadataBuilder({ assetId: 'asset-123', subbrand: 'test-brand' })
        .withContent(playerMock)
        .withIsLive('y')
        .build();
      expect(metadata).toEqual({
        ...validBaseMetadata, islive: 'y',
      });
    });
    
    it('withLength method', () => {
      const metadata = new NielsenMetadataBuilder({ assetId: 'asset-123', subbrand: 'test-brand' })
        .withContent(playerMock)
        .withLength(99)
        .build();
      expect(metadata).toEqual({
        ...validBaseMetadata, length: 99,
      });
    });

    it('withType method', () => {
      const metadata = new NielsenMetadataBuilder({ assetId: 'asset-123', subbrand: 'test-brand' })
        .withContent(playerMock)
        .withType('Custom')
        .build();
      expect(metadata).toEqual({
        ...validBaseMetadata, type: 'Custom',
      });
    });

    it('withProgram method', () => {
      const metadata = new NielsenMetadataBuilder({ assetId: 'asset-123', subbrand: 'test-brand' })
        .withContent(playerMock)
        .withProgram('Custom Program')
        .build();
      expect(metadata).toEqual({
        ...validBaseMetadata, program: 'Custom Program',
      });
    });

    it('withTitle method', () => {
      const metadata = new NielsenMetadataBuilder({ assetId: 'asset-123', subbrand: 'test-brand' })
        .withContent(playerMock)
        .withTitle('Custom Title')
        .build();
      expect(metadata).toEqual({
        ...validBaseMetadata, title: 'Custom Title',
      });
    });

    it('withCliMD method', () => {
      const metadata = new NielsenMetadataBuilder({ assetId: 'asset-123', subbrand: 'test-brand' })
        .withContent(playerMock)
        .withCliMD('VOD')
        .build();
      expect(metadata).toEqual({
        ...validBaseMetadata, cli_md: 'VOD',
      });
    });

    it('withCliCH method', () => {
      const metadata = new NielsenMetadataBuilder({ assetId: 'asset-123', subbrand: 'test-brand' })
        .withContent(playerMock)
        .withCliCH('Channel 1')
        .build();
      expect(metadata).toEqual({
        ...validBaseMetadata, cli_ch: 'Channel 1',
      });
    });
  });

  it('should build a valid metadata object from an Ad', () => {
    const builder = new NielsenMetadataBuilder({ subbrand: 'test-brand' });
    const ad: Ad = {
        width: 640,
        height: 360,
        isLinear: false,
        id: 'ad-123',
        mediaFileUrl: 'ad.mp4',
    }
    const metadata = builder
      .withAd(ad)
      .withLength(30)
      .build();

    expect(metadata).toEqual({
      type: 'ad',
      assetId: 'ad-123',
      program: 'ad.mp4',
      title: 'ad.mp4',
      length: 30,
      islive: 'n',
      subbrand: 'test-brand',
    });
  });

  it('should build a valid metadata object from a Linear Ad', () => {
    const builder = new NielsenMetadataBuilder({ subbrand: 'test-brand' });
    const ad: LinearAd = {
        width: 640,
        height: 360,
        isLinear: true,
        id: 'ad-123',
        mediaFileUrl: 'ad.mp4',
        duration: 30,
    }
    const metadata = builder
      .withAd(ad)
      .build();

    expect(metadata).toEqual({
      type: 'ad',
      assetId: 'ad-123',
      program: 'ad.mp4',
      title: 'ad.mp4',
      length: 30,
      islive: 'n',
      subbrand: 'test-brand',
    });
  });

  it('should build a valid metadata object from a VAST Ad', () => {
    const builder = new NielsenMetadataBuilder({ subbrand: 'test-brand' });
    const ad: Ad = {
        width: 640,
        height: 360,
        isLinear: false,
        id: 'ad-123',
        mediaFileUrl: 'ad.mp4',
        data: {
          adTitle: 'Ad Title',
          adDescription: 'Ad Description',
        } as VastAdData,
    }
    const metadata = builder
      .withAd(ad)
      .withLength(30)
      .build();

    expect(metadata).toEqual({
      type: 'ad',
      assetId: 'ad-123',
      program: 'Ad Description',
      title: 'Ad Title',
      length: 30,
      islive: 'n',
      subbrand: 'test-brand',
    });
  });

  describe('build validation for missing required keys', () => {
    it('should throw an error if assetId is missing', () => {
      const builder = new NielsenMetadataBuilder({ subbrand: 'test-brand' }).withContent(playerMock);
      expect(() => builder.build()).toThrow("Failed to build Nielsen metadata: Missing required field 'assetId'.");
    });

    it('should throw an error if program is missing', () => {
      playerMock.getSource.mockReturnValue({});
      const builder = new NielsenMetadataBuilder({ subbrand: 'test-brand' })
        .withAssetId('asset-123')
        .withContent(playerMock);
      expect(() => builder.build()).toThrow("Failed to build Nielsen metadata: Missing required field 'program'.");
    });

    it('should throw an error if title is missing', () => {
      playerMock.getSource.mockReturnValue({ hls: 'test.m3u8' });
      const builder = new NielsenMetadataBuilder({ subbrand: 'test-brand' })
        .withAssetId('asset-123')
        .withContent(playerMock);
      expect(() => builder.build()).toThrow("Failed to build Nielsen metadata: Missing required field 'title'.");
    });

    it('should throw an error if length is missing', () => {
      const builder = new NielsenMetadataBuilder({ subbrand: 'test-brand' }).withType('content').withAssetId('asset-123');
      // To isolate the 'length' check, we manually set other required properties
      (builder as any).metadata.program = 'test-program';
      (builder as any).metadata.title = 'test-title';
      (builder as any).metadata.islive = 'n';
      expect(() => builder.build()).toThrow("Failed to build Nielsen metadata: Missing required field 'length'.");
    });

    it('should throw an error if isLive is missing', () => {
      const builder = new NielsenMetadataBuilder({ subbrand: 'test-brand' })
        .withType('content')
        .withAssetId('asset-123')
        .withLength(120);
      // To isolate the 'isLive' check, we manually set other required properties
      (builder as any).metadata.program = 'test-program';
      (builder as any).metadata.title = 'test-title';
      expect(() => builder.build()).toThrow("Failed to build Nielsen metadata: Missing required field 'islive'.");
    });

    it('should throw an error if subbrand is missing', () => {
      const builder = new NielsenMetadataBuilder().withAssetId('asset-123').withContent(playerMock);
      expect(() => builder.build()).toThrow("Failed to build Nielsen metadata: Missing required field 'subbrand'.");
    });
  });

  describe('build with size check', () => {
    // metadata example for 2022 bytes
    const validBaseMetadata = {
        subbrand: "test-subbrand",
        type: "content",
        assetId: "test-asset",
        program: "test-program",
        title: 'a'.repeat(1920),
        length: 120,
        islive: "n" as "n",
      }

    it('should build successfully if metadata is within size limits', () => {
      
      const metadata = new NielsenMetadataBuilder(validBaseMetadata).build();
      expect(metadata).toBeDefined();
    });

    it('should trim optional fields in priority order to fit within size limits', () => {
      const metadata = new NielsenMetadataBuilder(validBaseMetadata)
        .withCustomField('nol_p0', "this is ok")
        .withCustomField('nol_p5', "this field sets us over the size limit").build();

      expect(metadata).toBeDefined();
      expect((metadata as any).nol_p5).toBeUndefined();
      expect((metadata as any).nol_p0).toBe("this is ok");
    });

    it('should throw an error if metadata is too large even after trimming all optional fields', () => {
      const veryLargeValue = 'a'.repeat(2048);
      const builder = new NielsenMetadataBuilder({
        ...validBaseMetadata,
        program: veryLargeValue,
      })

      expect(() => builder.build()).toThrow('Failed to build metadata: Required fields exceed 2048 bytes');
    });

    it('should warn and skip custom fields with invalid characters', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const builder = new NielsenMetadataBuilder({ subbrand: 'test-brand' })
        .withCustomField('nol_p0', 'invalid|value')
        .withCustomField('nol_p1', 'another~invalid~value')
        .withCustomField('nol_p2', 'this one is valid');

      const metadata = builder
        .withAssetId('asset-123')
        .withContent(playerMock)
        .build();

      expect(consoleWarnSpy).toHaveBeenCalledWith("Nielsen custom field 'nol_p0' contains invalid characters. Skipping.");
      expect(consoleWarnSpy).toHaveBeenCalledWith("Nielsen custom field 'nol_p1' contains invalid characters. Skipping.");
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);

      expect((metadata as any).nol_p0).toBeUndefined();
      expect((metadata as any).nol_p1).toBeUndefined();
      expect((metadata as any).nol_p2).toBe('this one is valid');

      consoleWarnSpy.mockRestore();
    });

    it('should use fallback for getByteSize when TextEncoder is not available', () => {
      jest.mock('util', () => ({
        TextEncoder: undefined as unknown as typeof TextEncoder
      }));
      // Re-require after modifying global
      jest.resetModules();
      const { NielsenMetadataBuilder } = require('../src/ts/NielsenMetadataBuilder');

      const validBaseMetadata = {
        subbrand: "test-subbrand",
        type: "content",
        assetId: "test-asset",
        program: "test-program",
        title: 'a'.repeat(1920),
        length: 120,
        islive: "n" as "n",
      };

      const metadata1 = new NielsenMetadataBuilder(validBaseMetadata)
        .withCustomField('nol_p0', 'small')
        .build();
      expect(metadata1).toBeDefined();
      expect((metadata1 as any).nol_p0).toBe('small');

      const metadata2 = new NielsenMetadataBuilder(validBaseMetadata)
        .withCustomField('nol_p0', 'a'.repeat(30))
        .build();
      expect(metadata2).toBeDefined();
      expect((metadata2 as any).nol_p0).toBeUndefined();

      // also check result for different size characters
      const metadataBuilder = new NielsenMetadataBuilder()
      expect(metadataBuilder.getByteSize('ñ€😀')).toBe(9)
    });
  });
});
