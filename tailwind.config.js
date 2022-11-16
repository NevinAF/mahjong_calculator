const plugin = require('tailwindcss/plugin');
const flattenColorPalette = require('tailwindcss/lib/util/flattenColorPalette');

/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    plugin(({ matchUtilities, theme }) =>
      matchUtilities(
        {
          'text-shadow': (value) => ({
            "text-shadow": value,
          }),
        },
      )
    ),
    plugin(({ matchUtilities, theme }) =>
      matchUtilities(
        {
          'text-outline-sm': (value) => ({
            "text-shadow": `-1px -1px 0 ${value}, 1px -1px 0 ${value}, -1px 1px 0 ${value}, 1px 1px 0 ${value}`,
          }),
        },
        { values: flattenColorPalette } 
      )
    ),
    plugin(({ matchUtilities, theme }) =>
      matchUtilities(
        {
          'text-outline-md': (value) => ({
            "text-shadow": `-2px -2px 0 ${value}, 2px -2px 0 ${value}, -2px 2px 0 ${value}, 2px 2px 0 ${value}`,
          }),
        },
        { values: flattenColorPalette } 
      )
    ),
    plugin(({ matchUtilities, theme }) =>
      matchUtilities(
        {
          'text-outline-lg': (value) => ({
            "text-shadow": `-3px -3px 0 ${value}, 3px -3px 0 ${value}, -3px 3px 0 ${value}, 3px 3px 0 ${value}`,
          }),
        },
        { values: flattenColorPalette } 
      )
    ),
  ],
}
