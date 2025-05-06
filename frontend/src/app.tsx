import { Container, createTheme, MantineProvider } from '@mantine/core'
import VolleyballCourt from './features/volleyball-court/ui/volleyball-court.component'

const theme = createTheme({})

function App() {
  return (
    <MantineProvider theme={theme}>
      <Container size='lg'>
        <VolleyballCourt />

        {/* <PersonsTable /> */}
      </Container>
    </MantineProvider>
  )
}

export default App
