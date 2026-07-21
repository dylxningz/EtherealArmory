import { forwardRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { addThemeToDestination } from "../lib/theme";

export const ThemeLink = forwardRef(function ThemeLink({ to, ...props }, ref) {
  const { search } = useLocation();
  return <Link ref={ref} to={addThemeToDestination(to, search)} {...props} />;
});

export const ThemeNavLink = forwardRef(function ThemeNavLink({ to, ...props }, ref) {
  const { search } = useLocation();
  return <NavLink ref={ref} to={addThemeToDestination(to, search)} {...props} />;
});
