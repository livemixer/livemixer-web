/**
 * Canvas capture utility
 * Creates a MediaStream from a Canvas element
 */
export class CanvasCaptureService {
  private stream: MediaStream | null = null

  /**
   * Capture a media stream from a Canvas element
   * @param canvas Canvas element
   * @param fps Frame rate (default 30)
   * @returns MediaStream
   */
  captureStream(canvas: HTMLCanvasElement, fps = 30): MediaStream {
    // Use Canvas API to capture the stream
    const stream = canvas.captureStream(fps)

    if (!stream) {
      throw new Error('Failed to capture media stream from Canvas')
    }

    this.stream = stream
    return stream
  }

  /**
   * Stop capture
   */
  stopCapture(): void {
    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        track.stop()
      }
      this.stream = null
    }
  }

  /**
   * Get current stream
   */
  getStream(): MediaStream | null {
    return this.stream
  }
}

// Export singleton instance
export const canvasCaptureService = new CanvasCaptureService()
