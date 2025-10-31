import Container from '@mui/material/Container';
import Box from '@mui/material/Box';


export default function AuthLayout({ children }) {
    return (
        <Container maxWidth="sm">
            <Box sx={{
                minHeight: 'calc(100vh - 64px)',
                display: 'grid',
                placeItems: 'center'
            }}>
                {children}
            </Box>
        </Container>
    );
}