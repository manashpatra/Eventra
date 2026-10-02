import { createTheme, alpha } from '@mui/material/styles';
import {
  brand,
  primary,
  secondary,
  status,
  surface,
  text,
  border,
  overlay,
  gradient,
  shadow,
  scrollbar,
  tooltip,
} from './colorTokens';

// Re-export brand constants for backward compatibility
const PUJA_ORANGE = brand.orangeDark;
const PUJA_GOLD = brand.gold;
const PUJA_RED = brand.red;
const PUJA_DEEP_PURPLE = brand.deepPurple;

export const getAppTheme = (mode = 'dark') => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: primary.main(isDark),
        light: primary.light(isDark),
        dark: primary.dark(isDark),
        contrastText: primary.contrastText,
      },
      secondary: {
        main: secondary.main(isDark),
        light: secondary.light(isDark),
        dark: secondary.dark(isDark),
        contrastText: secondary.contrastText,
      },
      background: {
        default: surface.page(isDark),
        paper: surface.paper(isDark),
      },
      success: {
        main: status.success.main(isDark),
        light: status.success.light(isDark),
        dark: status.success.dark(isDark),
      },
      warning: {
        main: status.warning.main(isDark),
        light: status.warning.light(isDark),
        dark: status.warning.dark(isDark),
      },
      error: {
        main: status.error.main(isDark),
        light: status.error.light(isDark),
        dark: status.error.dark(isDark),
      },
      info: {
        main: status.info.main(isDark),
        light: status.info.light(isDark),
        dark: status.info.dark(isDark),
      },
      divider: border.divider(isDark),
      text: {
        primary: text.primary(isDark),
        secondary: text.secondary(isDark),
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 800,
        letterSpacing: '-0.02em',
      },
      h2: {
        fontWeight: 700,
        letterSpacing: '-0.01em',
      },
      h3: {
        fontWeight: 700,
      },
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
      subtitle1: {
        fontWeight: 500,
        color: text.secondary(isDark),
      },
      button: {
        fontWeight: 600,
        letterSpacing: '0.02em',
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: 'thin',
            scrollbarColor: isDark ? `${scrollbar.thumbDark} transparent` : `${scrollbar.thumbLight} transparent`,
            transition: 'background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), color 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&::-webkit-scrollbar': {
              width: 6,
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: scrollbar.thumb(isDark),
              borderRadius: 3,
            },
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: 10,
            textTransform: 'none',
            fontSize: '0.9rem',
            boxShadow: 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              boxShadow: 'none',
            },
          },
          contained: {
            background: gradient.brand,
            color: text.white,
            '&:hover': {
              background: gradient.brandHover,
            },
          },
          outlined: {
            borderColor: border.brandStrong(isDark),
            '&:hover': {
              borderColor: primary.main(isDark),
              backgroundColor: overlay.brandLight(isDark),
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: surface.paper(isDark),
            border: `1px solid ${border.subtle(isDark)}`,
            boxShadow: isDark ? shadow.paperDark : shadow.paperLight,
            transition: 'background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: surface.paper(isDark),
            border: `1px solid ${border.subtle(isDark)}`,
            borderRadius: 16,
            boxShadow: isDark ? 'none' : `0 2px 8px ${overlay.shadowCard}`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              borderColor: border.brandMedium(isDark),
              transform: 'translateY(-2px)',
              boxShadow: isDark
                ? `0 8px 32px ${overlay.brandGlowHero}`
                : `0 10px 25px ${overlay.shadowMild}, 0 0 12px ${overlay.brandGlowHero}`,
            },
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          size: 'small',
        },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 10,
              backgroundColor: isDark ? 'transparent' : surface.paperLight,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '& fieldset': {
                borderColor: border.input(isDark),
                transition: 'border-color 0.2s ease',
              },
              '&:hover fieldset': {
                borderColor: isDark ? border.brandStrong(isDark) : brand.orangeDark,
              },
              '&.Mui-focused fieldset': {
                borderColor: primary.main(isDark),
              },
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          notchedOutline: {
            '& legend': {
              fontSize: '0.75em',
            },
            '& legend > span': {
              paddingLeft: 6,
              paddingRight: 6,
            },
          },
        },
      },
      MuiInputLabel: {
        defaultProps: {
          size: 'small',
        },
        styleOverrides: {
          root: {
            '&.MuiInputLabel-shrink': {
              padding: '0 4px',
              backgroundColor: surface.paper(isDark),
              borderRadius: 4,
            },
          },
        },
      },
      MuiSelect: {
        defaultProps: {
          size: 'small',
        },
        styleOverrides: {
          root: {
            borderRadius: 10,
            backgroundColor: isDark ? 'transparent' : surface.paperLight,
          },
        },
      },
      MuiFormControl: {
        defaultProps: {
          size: 'small',
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 500,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: surface.drawer(isDark),
            borderRight: `1px solid ${border.subtle(isDark)}`,
            transition: 'background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? alpha(surface.pageDark, 0.85) : alpha(surface.paperLight, 0.88),
            color: text.primary(isDark),
            backdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${border.subtle(isDark)}`,
            boxShadow: isDark ? 'none' : `0 1px 3px ${overlay.shadowXXLight}`,
            transition: 'background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), color 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
            backgroundColor: surface.paper(isDark),
            border: `1px solid ${border.medium(isDark)}`,
            boxShadow: shadow.dialog(isDark),
            transition: 'background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '@media (max-width: 600px)': {
              margin: 12,
              width: 'calc(100% - 24px)',
              maxWidth: 'calc(100% - 24px)',
            },
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: surface.menu(isDark),
            color: text.primary(isDark),
            border: `1px solid ${border.medium(isDark)}`,
            boxShadow: shadow.menu(isDark),
            borderRadius: 12,
            backgroundImage: 'none',
          },
          list: {
            padding: '6px 0',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontSize: '0.875rem',
            color: text.primary(isDark),
            transition: 'background-color 0.15s ease',
            '&:hover': {
              backgroundColor: overlay.brandLight(isDark),
            },
            '&.Mui-selected': {
              backgroundColor: overlay.brandMedium(isDark),
              '&:hover': {
                backgroundColor: overlay.brandBold(isDark),
              },
            },
          },
        },
      },
      MuiPopover: {
        styleOverrides: {
          paper: {
            backgroundColor: surface.menu(isDark),
            color: text.primary(isDark),
            border: `1px solid ${border.medium(isDark)}`,
            boxShadow: shadow.menu(isDark),
            borderRadius: 12,
            backgroundImage: 'none',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${border.subtle(isDark)}`,
            transition: 'background-color 0.3s ease, border-color 0.3s ease',
          },
          head: {
            fontWeight: 600,
            backgroundColor: surface.tableHead(isDark),
            color: text.secondary(isDark),
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            letterSpacing: '0.05em',
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.2s ease',
            '&:hover': {
              backgroundColor: `${overlay.brandXLight(isDark)} !important`,
            },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.9rem',
          },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            background: gradient.brand,
            color: text.white,
            '&:hover': {
              background: gradient.brandHover,
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: tooltip.bg(isDark),
            color: tooltip.color,
            border: isDark ? `1px solid ${border.medium(isDark)}` : 'none',
            borderRadius: 8,
            fontSize: '0.8rem',
            boxShadow: shadow.tooltipShadow,
          },
        },
      },
      MuiDatePicker: {
        defaultProps: {
          slotProps: {
            textField: {
              size: 'small',
            },
          },
        },
      },
      MuiDesktopDatePicker: {
        defaultProps: {
          slotProps: {
            actionBar: {
              actions: ['clear', 'cancel', 'accept'],
            },
            textField: {
              size: 'small',
            },
          },
        },
      },
      MuiMobileDatePicker: {
        defaultProps: {
          slotProps: {
            textField: {
              size: 'small',
            },
          },
        },
      },
    },
  });
};

const defaultTheme = getAppTheme('dark');

export default defaultTheme;
export { PUJA_ORANGE, PUJA_GOLD, PUJA_RED, PUJA_DEEP_PURPLE };
