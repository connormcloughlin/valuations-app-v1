import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1a237e', // Deep blue similar to Qantam's primary color
      light: '#534bae',
      dark: '#000051',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f57c00', // Orange accent color
      light: '#ffad42',
      dark: '#bb4d00',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
      color: '#1a237e',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
      color: '#1a237e',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
      color: '#1a237e',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
      color: '#1a237e',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      color: '#1a237e',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      color: '#1a237e',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1a237e',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e0e0e0',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(26, 35, 126, 0.08)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(26, 35, 126, 0.12)',
            '&:hover': {
              backgroundColor: 'rgba(26, 35, 126, 0.16)',
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          padding: '8px 16px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#f5f5f5',
          '& .MuiTableCell-head': {
            color: '#1a237e',
            fontWeight: 600,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #e0e0e0',
        },
      },
    },
  },
});

export default theme; 