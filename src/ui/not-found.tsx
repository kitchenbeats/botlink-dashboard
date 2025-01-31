"use client";

import { PROTECTED_URLS } from "@/configs/urls";
import { Button } from "./primitives/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./primitives/card";
import { HomeIcon, ArrowLeft, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Card className="border-border bg-bg-100/40 w-full max-w-md border backdrop-blur-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-light">404</CardTitle>
          <CardDescription className="mt-2 text-lg">
            Page Not Found
          </CardDescription>
        </CardHeader>
        <CardContent className="text-fg-500 text-center">
          <p>
            The page you are looking for might have been removed, had its name
            changed, or is temporarily unavailable.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pt-4">
          <div className="flex w-full justify-between gap-4">
            <Button variant="outline" asChild className="flex-1">
              <Link href="/" className="gap-2">
                <HomeIcon className="text-fg-500 h-4 w-4" />
                Home
              </Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link href={PROTECTED_URLS.DASHBOARD} className="gap-2">
                <LayoutDashboard className="text-fg-500 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full gap-2"
          >
            <ArrowLeft className="text-fg-500 h-4 w-4" />
            Go Back
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
