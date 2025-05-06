export interface Point {
  x: number
  y: number
}

export const convertCoordinates = (point: Point): Point => {
  const courtWidth = 900
  const courtHeight = 400
  const courtX = 150
  const courtY = 100

  const originalWidth = 2
  const originalHeight = 1

  // Calculate scale factors
  const scaleX = courtWidth / originalWidth
  const scaleY = courtHeight / originalHeight

  // Convert coordinates
  const convertedX = courtX + point.x * scaleX
  const convertedY = courtY + point.y * scaleY

  return {
    x: Math.round(convertedY),
    y: Math.round(convertedX),
  }
}

// Example usage:
// const sourcePoint = { x: 0.5, y: 1 }; // Center of 1x2 court
// const canvasPoint = convertCoordinates(sourcePoint);
// Result: { x: 600, y: 300 } // Center of the court
