import { createTheme } from '@mui/material/styles';


const theme = createTheme({
    shape: { borderRadius: 16 },
    palette: {
        mode: 'light',
        primary: { main: '#3a7bd5' },
        secondary: { main: '#6a11cb' },
        background: { default: '#f7f9fc' },
    },
    typography: {
        fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    },
    components: {
        MuiCard: { styleOverrides: { root: { boxShadow: '0 10px 30px rgba(0,0,0,0.06)' } } },
        MuiButton: { defaultProps: { disableElevation: true } },
    },
});


export default theme;