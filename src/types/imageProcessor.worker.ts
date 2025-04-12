// // imageProcessor.worker.ts
// self.onmessage = function(e) {
//     const { imageData } = e.data;
//     const data = new Uint8ClampedArray(imageData.data);
//     const width = imageData.width;
//     const height = imageData.height;
  
//     // Enhanced edge detection with color region detection
//     const processedData = enhancedColorRegionDetection(data, width, height);
  
//     self.postMessage({ processedData }, [processedData.buffer]);
//   };
  
//   function enhancedColorRegionDetection(data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
//     const output = new Uint8ClampedArray(data.length);
//     const colorRegions: {[key: string]: boolean} = {};
//     const edgeThreshold = 50;
//     const colorSimilarityThreshold = 30;
  
//     // First pass: detect edges and significant color changes
//     for (let y = 1; y < height - 1; y++) {
//       for (let x = 1; x < width - 1; x++) {
//         const i = (y * width + x) * 4;
//         const nextI = (y * width + (x + 1)) * 4;
//         const belowI = ((y + 1) * width + x) * 4;
  
//         // Calculate color difference with neighboring pixels
//         const colorDiffRight = Math.sqrt(
//           Math.pow(data[i] - data[nextI], 2) +
//           Math.pow(data[i+1] - data[nextI+1], 2) +
//           Math.pow(data[i+2] - data[nextI+2], 2)
//         );
        
//         const colorDiffBelow = Math.sqrt(
//           Math.pow(data[i] - data[belowI], 2) +
//           Math.pow(data[i+1] - data[belowI+1], 2) +
//           Math.pow(data[i+2] - data[belowI+2], 2)
//         );
  
//         // Mark as edge if color difference is significant
//         if (colorDiffRight > edgeThreshold || colorDiffBelow > edgeThreshold) {
//           output[i] = output[i+1] = output[i+2] = 0; // Black for edges
//         } else {
//           output[i] = output[i+1] = output[i+2] = 255; // White for non-edges
//         }
//         output[i+3] = 255; // Alpha channel
  
//         // Track color regions
//         const colorKey = getColorKey(data, i, colorSimilarityThreshold);
//         colorRegions[colorKey] = true;
//       }
//     }
  
//     return output;
//   }
  
//   function getColorKey(data: Uint8ClampedArray, index: number, threshold: number): string {
//     // Group similar colors together
//     const r = Math.round(data[index] / threshold) * threshold;
//     const g = Math.round(data[index+1] / threshold) * threshold;
//     const b = Math.round(data[index+2] / threshold) * threshold;
//     return `${r},${g},${b}`;
//   }