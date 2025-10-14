/**
 * Responsible for sending out Nielsen tracking events.
 */
export class NielsenMeasurementsTracker {
  constructor(private instanceName: string) {}

  private get sdkInstance(): any {
    const sdkInstance = (window as any).NOLBUNDLE?.[this.instanceName];
    if (!sdkInstance) {
      throw new Error(`Nielsen SDK instance "${this.instanceName}" is not initialized.`);
    }
    return sdkInstance;
  }

  public loadMetadata(contentMetadataObject: any): void {
    console.debug('Loading metadata:', contentMetadataObject);
    this.sdkInstance?.ggPM?.('loadMetadata', contentMetadataObject);
  }

  public setPlayHeadPosition(playhead: number): void {
    console.debug('Setting playhead position:', playhead);
    this.sdkInstance?.ggPM?.('setPlayheadPosition', playhead);
  }

  public stopTracking(playhead: number): void {
    console.debug('Stopping tracking at playhead:', playhead);
    this.sdkInstance?.ggPM?.('stop', playhead);
  }

  public endTracking(playhead: number): void {
    console.debug('Ending tracking at playhead:', playhead);
    this.sdkInstance?.ggPM?.('end', playhead);
  }
}
