import { createTheme, MantineColorsTuple } from '@mantine/core';

// Kiyovu pitch green, expanded into a 10-step Mantine shade scale
// (#006400 sits at index 8 — the "true brand" step used for primary actions).
const kiyovuGreen: MantineColorsTuple = [
  '#e6f5e6', '#c2e6c2', '#9bd69b', '#72c672', '#4fb84f',
  '#38ad38', '#2ba32b', '#1a961a', '#006400', '#004d00',
];

export const theme = createTheme({
  primaryColor: 'kiyovuGreen',
  colors: { kiyovuGreen },
  fontFamily: 'Lato, sans-serif',
  headings: {
    fontFamily: 'Lato, sans-serif',
    fontWeight: '700',
  },
  defaultRadius: 'sm',
  primaryShade: 8,
  components: {
    Button: {
      defaultProps: { fw: 700 },
    },
    Table: {
      defaultProps: { striped: true, highlightOnHover: true, withTableBorder: true },
    },
    Anchor: {
      defaultProps: { c: 'kiyovuGreen.8', underline: 'hover' },
    },
  },
  other: {
    // Referenced by status Badge color mapping — kept in sync with lu_statuses.color_hex
    // so a status added in the DB (no code deploy) still renders sensibly by default.
    brandGreen: '#006400',
    brandWhite: '#ffffff',
    navbarBg: '#004d00',
    navbarText: '#f0f7f0',
  },
});
