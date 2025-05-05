import { create } from 'zustand'

interface Position {
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

interface PlayerState {
  players: Record<string, Player>
  selectedPlayerId: string | null
  updatePlayerPosition: (
    id: string,
    {
      x,
      y,
      leg_coordinates,
    }: { x: number; y: number; leg_coordinates: [number, number] }
  ) => void
  selectPlayer: (id: string | null) => void
  clearHistory: () => void
}

const usePlayerStore = create<PlayerState>((set) => ({
  players: {},
  selectedPlayerId: null,

  updatePlayerPosition: (id, { x, y, leg_coordinates }) =>
    set((state) => {
      const timestamp = Date.now()
      const players = { ...state.players }

      if (!players[id]) {
        players[id] = {
          id,
          color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
          positions: [],
          transformed_leg_coordinates: [x, y],
          leg_coordinates: [
            { x: leg_coordinates[0], y: leg_coordinates[1], timestamp },
          ],
        }
      }

      players[id].positions.push({ x, y, timestamp })
      players[id].leg_coordinates.push({
        x: leg_coordinates[0],
        y: leg_coordinates[1],
        timestamp,
      })

      return { players }
    }),

  selectPlayer: (id) => set({ selectedPlayerId: id }),

  clearHistory: () =>
    set((state) => {
      const players = { ...state.players }
      Object.values(players).forEach((player) => {
        player.positions = []
      })
      return { players }
    }),
}))

export default usePlayerStore
