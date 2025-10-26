"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function ConfirmAllocationDialog({
  open,
  onOpenChange,
  onConfirm,
  incomeType,
  earningPeriod,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  incomeType: string;
  earningPeriod: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Kohdista tulolaji</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-700">
            Haluatko kohdistaa tulolajin <strong>{incomeType}</strong> ansainta-ajalle?
          </p>
          <p className="text-xs text-gray-500 mt-2">Ansainta-aika: {earningPeriod}</p>
        </div>
        
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Peruuta
          </Button>
          <Button className="bg-green-600 hover:bg-green-700" onClick={onConfirm}>
            Kyllä, kohdista
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

