/**
 * Video Frame Extractor
 * Extracts frames from a video file at regular intervals using HTML5 Canvas API.
 * Includes basic scene-change detection to skip duplicate/transition frames.
 */

export interface ExtractedFrame {
  index: number;
  timestamp: number;
  dataUrl: string; // base64 image data URL
}

export interface ExtractionProgress {
  phase: 'loading' | 'extracting' | 'done';
  currentFrame: number;
  totalFrames: number;
  message: string;
}

/**
 * Extracts frames from a video file at specified intervals.
 * @param file - The video file (mp4, mov, webm)
 * @param intervalSeconds - How often to capture a frame (default: 1.5s)
 * @param onProgress - Callback for progress updates
 * @returns Array of extracted frames as base64 data URLs
 */
export async function extractFramesFromVideo(
  file: File,
  intervalSeconds: number = 0.7,
  onProgress?: (progress: ExtractionProgress) => void
): Promise<ExtractedFrame[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('No se pudo crear el contexto de canvas'));
      return;
    }

    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;

    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    video.addEventListener('error', () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Error al cargar el video. Verifica que el formato sea compatible (.mp4, .mov, .webm)'));
    });

    video.addEventListener('loadedmetadata', async () => {
      const duration = video.duration;
      const totalFrames = Math.floor(duration / intervalSeconds);

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      onProgress?.({
        phase: 'loading',
        currentFrame: 0,
        totalFrames,
        message: `Video cargado: ${Math.round(duration)}s, ${totalFrames} fotogramas a extraer...`,
      });

      const frames: ExtractedFrame[] = [];
      let prevImageData: ImageData | null = null;

      for (let i = 0; i < totalFrames; i++) {
        const timestamp = i * intervalSeconds;

        try {
          await seekTo(video, timestamp);

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          // Scene change detection: skip if frame is too similar to previous
          if (prevImageData && !isSignificantChange(prevImageData, currentImageData, 0.015)) {
            onProgress?.({
              phase: 'extracting',
              currentFrame: i + 1,
              totalFrames,
              message: `Fotograma ${i + 1}/${totalFrames} - saltado (pantalla similar)`,
            });
            continue;
          }

          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          frames.push({ index: frames.length, timestamp, dataUrl });
          prevImageData = currentImageData;

          onProgress?.({
            phase: 'extracting',
            currentFrame: i + 1,
            totalFrames,
            message: `Fotograma ${i + 1}/${totalFrames} extraído ✓`,
          });
        } catch (err) {
          console.warn(`Error extrayendo fotograma en t=${timestamp}s:`, err);
        }
      }

      URL.revokeObjectURL(objectUrl);

      onProgress?.({
        phase: 'done',
        currentFrame: totalFrames,
        totalFrames,
        message: `¡${frames.length} fotogramas únicos extraídos de ${totalFrames} totales!`,
      });

      resolve(frames);
    });
  });
}

/**
 * Seeks a video element to a specific time and waits for it to be ready.
 */
function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    if (Math.abs(video.currentTime - time) < 0.01) {
      resolve();
      return;
    }

    const timeoutId = setTimeout(() => {
      video.removeEventListener('seeked', onSeeked);
      resolve();
    }, 1500);

    const onSeeked = () => {
      clearTimeout(timeoutId);
      video.removeEventListener('seeked', onSeeked);
      resolve();
    };

    video.addEventListener('seeked', onSeeked);
    video.currentTime = time;
  });
}

/**
 * Compares two ImageData objects to determine if there's a significant visual change.
 * Uses a sampled pixel comparison for performance.
 * @param prev - Previous frame ImageData
 * @param current - Current frame ImageData  
 * @param threshold - Percentage of pixels that must differ (0.0 - 1.0)
 * @returns true if the frames are significantly different
 */
function isSignificantChange(
  prev: ImageData,
  current: ImageData,
  threshold: number
): boolean {
  const data1 = prev.data;
  const data2 = current.data;
  const totalPixels = data1.length / 4;

  // Sample every 50th pixel for performance
  const sampleStep = 50;
  let diffCount = 0;
  let sampledCount = 0;

  for (let i = 0; i < totalPixels; i += sampleStep) {
    const offset = i * 4;
    const rDiff = Math.abs(data1[offset] - data2[offset]);
    const gDiff = Math.abs(data1[offset + 1] - data2[offset + 1]);
    const bDiff = Math.abs(data1[offset + 2] - data2[offset + 2]);

    // A pixel is "different" if the combined color difference exceeds 60
    if (rDiff + gDiff + bDiff > 60) {
      diffCount++;
    }
    sampledCount++;
  }

  const changeRatio = diffCount / sampledCount;
  return changeRatio > threshold;
}
