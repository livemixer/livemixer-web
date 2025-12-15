/**
 * Canvas 捕获工具
 * 用于从 Canvas 元素创建 MediaStream
 */
export class CanvasCaptureService {
  private stream: MediaStream | null = null

  /**
   * 从 Canvas 元素捕获媒体流
   * @param canvas Canvas 元素
   * @param fps 帧率 (默认 30)
   * @returns MediaStream
   */
  captureStream(canvas: HTMLCanvasElement, fps = 30): MediaStream {
    // 使用 Canvas API 捕获流
    const stream = canvas.captureStream(fps)

    if (!stream) {
      throw new Error('无法从 Canvas 捕获媒体流')
    }

    this.stream = stream
    return stream
  }

  /**
   * 停止捕获
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
   * 获取当前流
   */
  getStream(): MediaStream | null {
    return this.stream
  }
}

// 导出单例实例
export const canvasCaptureService = new CanvasCaptureService()
