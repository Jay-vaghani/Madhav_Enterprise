# PROJECT RULES — MADHAV ENTERPRISE TRANSPORT PORTAL

# The AI agent must read and follow ALL rules below before writing any code.

# These rules are non-negotiable and override any default preferences.

---

## TECH STACK — MANDATORY

- Framework: Vite + React 18 (TypeScript preferred, .jsx files)
- Routing: React Router DOM v6 — use BrowserRouter, Routes, Route,
  Outlet, useNavigate, useParams. Never use the old <Switch> API.
- Forms: React Hook Form v7 — useForm, Controller, FormProvider,
  useFormContext. Never use useState for form field values.
- UI Library: MUI v6 (Material UI) — import from @mui/material and @mui/lab only.
  Never write custom CSS unless MUI sx prop cannot handle it.
- Icons: @mui/icons-material only.
- State: React Context API + useReducer for global state.
  No Redux unless explicitly asked.

---

## MUI GRID RULES — MANDATORY

Always use the MUI Grid API (size prop), never the old xs/sm/md props directly
on Grid item. Every layout must use this exact pattern:

```jsx
import Grid from "@mui/material/Grid";

<Grid container spacing={2}>
  <Grid size={{ xs: 12, md: 8 }}>{/* content */}</Grid>
  <Grid size={{ xs: 12, md: 4 }}>{/* content */}</Grid>
</Grid>;
```

Never use: <Grid item xs={6}> — this is the OLD API and is forbidden.

---

## LAYOUT RULES — MANDATORY

Always prefer MUI Grid (from `@mui/material/Grid`) as the **primary** layout
system for any page-level or section-level structure (e.g. sidebar + content,
multi-column sections, card grids).

Only use Flexbox (`display: flex`) when:
- Aligning a small number of inline elements (e.g. icon + label, button row)
- MUI Grid cannot express the layout without overrides
- The layout is a single axis with no column/spanning requirements

Never replace a Grid layout with a `Box sx={{ display: 'flex' }}` container
just because it is simpler. Grid must come first.

Correct — sidebar + content via Grid:
```jsx
import Grid from "@mui/material/Grid";

<Grid container sx={{ flex: 1 }}>
  <Grid size={{ xs: "auto" }}>
    <Sidebar />
  </Grid>
  <Grid size={{ xs: true }}>
    <MainContent />
  </Grid>
</Grid>
```

Incorrect — using flex for a structural split:
```jsx
<Box sx={{ display: 'flex' }}>
  <Sidebar />
  <MainContent />
</Box>
```

---

## MUI TABS RULES — MANDATORY

Always use TabContext from @mui/lab, never standalone Tab + useState pattern.
Always follow this exact structure:

```jsx
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Tab, Box } from "@mui/material";

const [value, setValue] = React.useState("1");
const handleChange = (_: React.SyntheticEvent, newValue: string) => {
  setValue(newValue);
};

<TabContext value={value}>
  <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
    <TabList onChange={handleChange} aria-label="...">
      <Tab label="Tab One" value="1" />
      <Tab label="Tab Two" value="2" />
    </TabList>
  </Box>
  <TabPanel value="1">Content One</TabPanel>
  <TabPanel value="2">Content Two</TabPanel>
</TabContext>;
```

---

## MUI TYPOGRAPHY RULES — MANDATORY

Always use HTML tags never use Typography component. use html component like heading and p tag and other typography components from HTML, but not typography component from MUI.

---

## REACT HOOK FORM RULES — MANDATORY

Always register fields using Controller when used with MUI components.
Never use register() directly on MUI inputs — it won't work correctly.

```jsx
import { useForm, Controller } from "react-hook-form";
import { TextField } from "@mui/material";

const { control, handleSubmit } =
  useForm <
  FormData >
  {
    defaultValues: { firstName: "" },
  };

<Controller
  name="firstName"
  control={control}
  rules={{ required: "First name is required" }}
  render={({ field, fieldState }) => (
    <TextField
      {...field}
      label="First Name"
      error={!!fieldState.error}
      helperText={fieldState.error?.message}
      fullWidth
    />
  )}
/>;
```

For multi-step forms, use FormProvider + useFormContext to share
form state across step components without prop drilling.

---

## THEMING RULES — MANDATORY

Create a single theme file at src/theme/theme.js.
All color tokens must come from this theme — never hardcode hex values
in components. Use theme.palette and sx prop references.

```js
import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: { main: "#2563EB", dark: "#1D4ED8", light: "#EFF6FF" },
    success: { main: "#10B981" },
    error: { main: "#EF4444" },
    warning: { main: "#F59E0B" },
    background: { default: "#F1F5F9", paper: "#FFFFFF" },
    text: { primary: "#0F172A", secondary: "#64748B" },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600, height: 48 },
      },
    },
    MuiTextField: {
      defaultProps: { variant: "outlined", fullWidth: true },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 16 },
      },
    },
  },
});
```

---

## FILE STRUCTURE RULES
