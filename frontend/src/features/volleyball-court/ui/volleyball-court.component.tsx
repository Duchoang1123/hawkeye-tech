import React, { memo, useEffect, useRef } from 'react'
import { Stage, Layer, Line, Image, Rect } from 'react-konva'
import usePlayerStore from '../../../store/use-player-store'
import { useWebSocket } from '../model/use-get-players-ws'
import { Badge, Group, Stack, Title } from '@mantine/core'
import { convertCoordinates } from '../../../utils/convert-coordinates'

const COURT_WIDTH = 1200
const COURT_HEIGHT = 600
const PLAYER_RADIUS = 10

interface Position {
  x: number
  y: number
  timestamp: number
}

interface Player {
  id: string
  color: string
  positions: Position[]
  transformed_leg_coordinates: [number, number]
  leg_coordinates: Position[]
}

const VolleyballCourt: React.FC = memo(() => {
  const { data, status } = useWebSocket()
  const { players, selectedPlayerId, updatePlayerPosition, selectPlayer } =
    usePlayerStore()
  const imageRef = useRef<HTMLImageElement>(null)
  const imageRef2 = useRef<HTMLImageElement>(null)

  useEffect(() => {
    // Load volleyball court background image
    const img = new window.Image()
    img.src = '/volleyball-court.svg'
    img.onload = () => {
      imageRef.current = img
    }
  }, [])

  useEffect(() => {
    const img = new window.Image()
    img.src = '/calibration-points.svg'
    img.onload = () => {
      imageRef2.current = img
    }
  }, [])

  useEffect(() => {
    if (data.length > 0) {
      const latestEntry = data[0]
      latestEntry?.persons?.forEach((person) => {
        // Convert bbox coordinates to court coordinates
        // const [x1, y1, x2, y2] = person.bbox
        // const x = (x1 + x2) / 2
        // const y = y2
        console.log(person)

        const [[x, y]] = person.transformed_leg_coordinates
        const { x: convertedX, y: convertedY } = convertCoordinates({ x, y })

        updatePlayerPosition(person.id.toString(), {
          x: convertedX,
          y: convertedY,
          leg_coordinates: person.leg_coordinates,
        })
      })
    }
  }, [data, updatePlayerPosition])

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
  const renderDebugPlayerTrail = (player: Player) => {
    if (player.leg_coordinates.length < 2) return null

    return (
      <Line
        points={player.leg_coordinates.flatMap((pos: Position) => [
          pos.x,
          pos.y,
        ])}
        stroke={player.color}
        strokeWidth={2}
        opacity={0.5}
      />
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'green'
      case 'error':
        return 'red'
      default:
        return 'yellow'
    }
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Volleyball Player Tracker</Title>
        <Badge color={getStatusColor(status)} size="lg">
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      </Group>

      <Stage width={COURT_WIDTH} height={COURT_HEIGHT}>
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

      <Stage width={1920} height={1080}>
        <Layer>
          {/* Court background */}
          {imageRef2.current && (
            <Image image={imageRef2.current} width={1920} height={1080} />
          )}

          {/* Player trails */}
          {Object.values(players).map((player) =>
            selectedPlayerId === null || player.id === selectedPlayerId
              ? renderDebugPlayerTrail(player)
              : null
          )}

          {/* Current player positions */}
          {Object.values(players).map((player) => {
            const lastPosition =
              player.leg_coordinates[player.leg_coordinates.length - 1]
            if (!lastPosition) return null

            console.log(player)
            console.log(lastPosition)

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
    </Stack>
  )
})

export default VolleyballCourt
