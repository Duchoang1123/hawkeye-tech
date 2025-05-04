import { PersonsTable } from './features/persons-table/ui/persons-table.component'

import { createTheme, MantineProvider } from '@mantine/core'

const theme = createTheme({})

function App() {
  return (
    <MantineProvider theme={theme}>
      <PersonsTable />
    </MantineProvider>
  )
}

export default App
