"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export interface ResponsiveDialogProps {
  /** Determine whether the dialog is open */
  open?: boolean;
  /** Triggered when the dialog open state changes */
  onOpenChange?: (open: boolean) => void;
  /** The element that triggers the dialog/drawer (optional if controlled) */
  trigger?: React.ReactNode;
  /** The title of the dialog/drawer */
  title?: React.ReactNode;
  /** The description of the dialog/drawer */
  description?: React.ReactNode;
  /** The content to be rendered inside the dialog/drawer */
  children: React.ReactNode;
  /** Content wrapper CSS class */
  className?: string;
}

export function ResponsiveDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  className,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile();
  const [internalOpen, setInternalOpen] = React.useState(false);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen =
    isControlled && onOpenChange ? onOpenChange : setInternalOpen;

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        {trigger && <DrawerTrigger render={trigger as any} />}
        <DrawerContent className={cn("max-h-[92vh] flex flex-col", className)}>
          <div className="overflow-y-auto flex flex-col gap-5 px-6 pb-8 pt-4">
            {(title || description) && (
              <DrawerHeader className="text-center px-0 pt-2 pb-2">
                {title && <DrawerTitle>{title}</DrawerTitle>}
                {description && (
                  <DrawerDescription>{description}</DrawerDescription>
                )}
              </DrawerHeader>
            )}
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger render={trigger as any} />}
      <DialogContent
        className={cn(
          "sm:rounded-2xl max-h-[90vh] p-0 flex flex-col",
          className,
        )}
      >
        {/* Scrollable inner area */}
        <div className="overflow-y-auto flex flex-col gap-6 p-6 sm:p-8">
          {(title || description) && (
            <DialogHeader className="text-center sm:text-center pb-2">
              {title && <DialogTitle className="text-xl">{title}</DialogTitle>}
              {description && (
                <DialogDescription className="text-center">
                  {description}
                </DialogDescription>
              )}
            </DialogHeader>
          )}
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
