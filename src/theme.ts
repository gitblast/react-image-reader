import {
  extendTheme,
  ThemeConfig,
  withDefaultColorScheme,
} from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

const theme = extendTheme(
  { config },
  withDefaultColorScheme({ colorScheme: "cyan" })
);

export default theme;
