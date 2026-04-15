import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import clsx from "clsx";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";

export const Navbar = () => {
  return (
    <HeroUINavbar
      maxWidth="xl"
      position="sticky"
      classNames={{
        base: "bg-background/70 backdrop-blur-xl backdrop-saturate-150 border-b border-divider/50",
        wrapper: "px-4 sm:px-6",
      }}
      height="4rem"
    >
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-2.5 group" href="/">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md shadow-primary/20 group-hover:shadow-lg group-hover:shadow-primary/30 transition-shadow">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-lg tracking-tight">AXENTYC</span>
          </NextLink>
        </NavbarBrand>
        <ul className="hidden lg:flex gap-1 justify-start ml-4">
          {siteConfig.navItems.map((item) => (
            <NavbarItem key={item.href}>
              <NextLink
                className="text-sm font-medium text-default-500 hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-default-100"
                href={item.href}
              >
                {item.label}
              </NextLink>
            </NavbarItem>
          ))}
        </ul>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full gap-2"
        justify="end"
      >
        <NavbarItem className="hidden sm:flex">
          <ThemeSwitch />
        </NavbarItem>
        <NavbarItem>
          <NextLink
            className="text-sm font-medium text-default-600 hover:text-foreground transition-colors px-3 py-2"
            href="/auth/login"
          >
            Iniciar Sesi&oacute;n
          </NextLink>
        </NavbarItem>
        <NavbarItem>
          <Button
            as={NextLink}
            color="primary"
            href="/auth/register"
            size="sm"
            radius="lg"
            className="font-semibold shadow-md shadow-primary/20"
          >
            Prueba Gratis
          </Button>
        </NavbarItem>
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <ThemeSwitch />
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu className="bg-background/95 backdrop-blur-xl pt-6">
        <div className="mx-4 flex flex-col gap-1">
          {siteConfig.navItems.map((item) => (
            <NavbarMenuItem key={item.href}>
              <NextLink
                className="block w-full text-base font-medium text-default-600 hover:text-foreground transition-colors py-3 px-3 rounded-lg hover:bg-default-100"
                href={item.href}
              >
                {item.label}
              </NextLink>
            </NavbarMenuItem>
          ))}
          <div className="border-t border-divider my-3" />
          <NavbarMenuItem>
            <NextLink
              className="block w-full text-base font-medium text-default-600 hover:text-foreground transition-colors py-3 px-3 rounded-lg hover:bg-default-100"
              href="/auth/login"
            >
              Iniciar Sesi&oacute;n
            </NextLink>
          </NavbarMenuItem>
          <NavbarMenuItem className="mt-2">
            <Button
              as={NextLink}
              color="primary"
              href="/auth/register"
              fullWidth
              radius="lg"
              className="font-semibold"
            >
              Prueba Gratis
            </Button>
          </NavbarMenuItem>
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
