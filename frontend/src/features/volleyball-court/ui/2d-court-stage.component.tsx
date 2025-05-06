import { Stage, Layer, Image, Line, Rect } from 'react-konva'
import { Player, Position } from '../../../entities/player/model'
import { memo, useEffect, useRef, useState } from 'react'
import usePlayerStore from '../../../entities/player/model/use-player-store'
import { Paper } from '@mantine/core'

const COURT_WIDTH = 1200
const COURT_HEIGHT = 600
const PLAYER_RADIUS = 10

export const TwoDCourtStage = memo(() => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const imageRef = useRef<HTMLImageElement>(null)

  const players = usePlayerStore((state) => state.players)
  const selectedPlayerId = usePlayerStore((state) => state.selectedPlayerId)
  const selectPlayer = usePlayerStore((state) => state.selectPlayer)

  const renderPlayerTrail = (player: Player) => {
    if (player.positions.length < 2) return null

    return (
      <Line
        points={player.positions.flatMap((pos: Position) => [pos.x, pos.y])}
        stroke={player.color}
        strokeWidth={2}
        opacity={0.5}
      />
    )
  }

  useEffect(() => {
    const updateScales = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        const newScale = containerWidth / COURT_WIDTH
        setScale(newScale)
      }
    }

    updateScales()
    window.addEventListener('resize', updateScales)
    return () => window.removeEventListener('resize', updateScales)
  }, [])

  useEffect(() => {
    // Load volleyball court background image
    const img = new window.Image()
    img.src = '/volleyball-court.svg'
    img.onload = () => {
      imageRef.current = img
    }
  }, [])

  return (
    <Paper withBorder ref={containerRef} style={{ width: '100%' }}>
      <Stage
        width={COURT_WIDTH * scale}
        height={COURT_HEIGHT * scale}
        scale={{ x: scale, y: scale }}
      >
        <Layer>
          {/* Court background */}
          {imageRef.current && (
            <Image
              image={imageRef.current}
              width={COURT_WIDTH}
              height={COURT_HEIGHT}
            />
          )}

          {/* Player trails */}
          {Object.values(players).map((player) =>
            selectedPlayerId === null || player.id === selectedPlayerId
              ? renderPlayerTrail(player)
              : null
          )}

          {/* Current player positions */}
          {Object.values(players).map((player) => {
            const lastPosition = player.positions[player.positions.length - 1]
            if (!lastPosition) return null

            return (
              <Rect
                key={player.id}
                x={lastPosition.x}
                y={lastPosition.y}
                width={PLAYER_RADIUS}
                height={PLAYER_RADIUS}
                fill={player.color}
                onClick={() => selectPlayer(player.id)}
              />
            )
          })}
        </Layer>
      </Stage>
    </Paper>
  )
})
