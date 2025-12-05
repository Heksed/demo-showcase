"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SpainWorkScenario from "./components/SpainWorkScenario";
import NordicReturnScenario from "./components/NordicReturnScenario";
// Tulevaisuudessa:
// import EUWorkScenario from "./components/EUWorkScenario";

type ForeignWorkScenario = "spain" | "nordic" | "eu";

// ============================================================================
// Foreign Work – Ulkomaantyön määrittelyt ja näkymät
// ============================================================================

export default function ForeignWork() {
  const [scenario, setScenario] = useState<ForeignWorkScenario>("spain");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skenaarion valinta */}
      <div className="p-6">
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Label className="font-medium text-gray-700 whitespace-nowrap">
                Valitse skenaario:
              </Label>
              <Select 
                value={scenario} 
                onValueChange={(v) => setScenario(v as ForeignWorkScenario)}
              >
                <SelectTrigger className="w-80 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spain">Työ Espanjassa</SelectItem>
                  <SelectItem value="nordic">Pohjoismainen paluumuuttaja</SelectItem>
                  <SelectItem value="eu">Työ EU-maassa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Renderöi valittu skenaario */}
      {scenario === "spain" && <SpainWorkScenario />}
      {scenario === "nordic" && <NordicReturnScenario />}
      {/* Tulevaisuudessa: */}
      {/* {scenario === "eu" && <EUWorkScenario />} */}
    </div>
  );
}

