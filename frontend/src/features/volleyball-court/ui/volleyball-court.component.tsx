import React, { memo, useEffect } from 'react'

import { Badge, Group, Stack, Title } from '@mantine/core'
import usePlayerStore from '../../../entities/player/model/use-player-store'
import { convertCoordinates } from '../../../utils/convert-coordinates'
import { useWebSocket } from '../model/use-get-players-ws'
import { TwoDCourtStage } from './2d-court-stage.component'
import { DemoVideoCourt } from './demo-video-stage.component'

const VolleyballCourt: React.FC = memo(() => {
  const { data, status } = useWebSocket()
  const updatePlayerPosition = usePlayerStore(
    (state) => state.updatePlayerPosition
  )

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

      <Stack gap="md">
        <TwoDCourtStage />
        <DemoVideoCourt />
      </Stack>
    </Stack>
  )
})

export default VolleyballCourt
