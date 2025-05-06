export interface Position {
  x: number
  y: number
  timestamp: number
}

export interface Player {
  id: string
  color: string
  positions: Position[]
  transformed_leg_coordinates: [number, number]
  leg_coordinates: Position[]
}
