import {
  Badge,
  Box,
  Group,
  MantineTheme,
  Paper,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core'
import { format } from 'date-fns'
import { useMemo } from 'react'
import { useWebSocket } from '../model/use-get-persons-ws'

interface Person {
  id: string
  color: [number, number, number]
  bbox: [number, number, number, number]
  conf: number
}

interface DataEntry {
  id: string
  ts: number
  persons: Person[]
}

export const PersonsTable = () => {
  const { data, status } = useWebSocket()

  const totalPersons = useMemo(() => {
    if (data.length === 0) return 0
    const personsSet = new Set<string>()
    data.forEach((entry: DataEntry) => {
      entry.persons?.forEach((p: Person) => personsSet.add(p.id))
    })
    return personsSet.size
  }, [data])

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
    <Stack gap="md" p="md">
      <Group justify="space-between">
        <Title order={2}>Real-Time Person Tracking</Title>
        <Badge color={getStatusColor(status)} size="lg">
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      </Group>

      <Paper withBorder p="sm">
        <Text fw={500}>Unique Persons Tracked: {totalPersons}</Text>
      </Paper>
      <Paper withBorder>
        <Table striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Frame ID</Table.Th>
              <Table.Th>Time</Table.Th>
              <Table.Th>Person ID</Table.Th>
              <Table.Th>Color</Table.Th>
              <Table.Th>Coordinates</Table.Th>
              <Table.Th>Confidence</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.flatMap((entry: DataEntry) =>
              (entry.persons || []).map((p: Person) => (
                <Table.Tr key={`${entry.ts}-${p.id}-${p.conf}`}>
                  <Table.Td>{entry.id}</Table.Td>
                  <Table.Td>{format(entry.ts * 1000, 'HH:mm:ss.SSS')}</Table.Td>
                  <Table.Td>{p.id}</Table.Td>
                  <Table.Td>
                    <Box
                      w={20}
                      h={20}
                      style={(theme: MantineTheme) => ({
                        backgroundColor: `rgb(${p.color.join(',')})`,
                        border: `1px solid ${theme.colors.gray[3]}`,
                      })}
                    />
                  </Table.Td>
                  <Table.Td>[{p.bbox.join(', ')}]</Table.Td>
                  <Table.Td>{p.conf.toFixed(2)}</Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  )
}
