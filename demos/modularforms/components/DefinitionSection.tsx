"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import type { FormDefinition } from "../types";

interface DefinitionSectionProps {
  definition: FormDefinition;
  onDefinitionChange: (definition: FormDefinition) => void;
}

export default function DefinitionSection({
  definition,
  onDefinitionChange,
}: DefinitionSectionProps) {
  const updateCheckbox = (key: keyof FormDefinition["checkboxes"], value: boolean) => {
    onDefinitionChange({
      ...definition,
      checkboxes: {
        ...definition.checkboxes,
        [key]: value,
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kirjevalinnat</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <Label>Kirjepohja</Label>
            <Select
              value={definition.letterTemplate}
              onValueChange={(value) =>
                onDefinitionChange({ ...definition, letterTemplate: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kuulemiskirje">
                  Kuulemiskirje (XXXXXX)
                </SelectItem>
                <SelectItem value="suostumus">Suostumus</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Kuulemisen määräaika</Label>
            <div className="relative">
              <Input
                type="date"
                value={definition.hearingDeadline}
                onChange={(e) =>
                  onDefinitionChange({
                    ...definition,
                    hearingDeadline: e.target.value,
                  })
                }
                className="pr-10"
                placeholder="PP.KK.VVVV"
              />
              <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Viestintä</Label>
            <Select
              value={definition.communication}
              onValueChange={(value) =>
                onDefinitionChange({ ...definition, communication: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="electronic">Sähköinen asiointi</SelectItem>
                <SelectItem value="mail">Posti</SelectItem>
                <SelectItem value="email">Sähköposti</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="additional-payment"
                checked={definition.checkboxes.considerAdditionalPayment}
                onCheckedChange={(checked) =>
                  updateCheckbox("considerAdditionalPayment", checked === true)
                }
              />
              <Label htmlFor="additional-payment" className="cursor-pointer">
                Lisämaksun huomioiminen
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="payment-proposal"
                checked={definition.checkboxes.paymentProposal}
                onCheckedChange={(checked) =>
                  updateCheckbox("paymentProposal", checked === true)
                }
              />
              <Label htmlFor="payment-proposal" className="cursor-pointer">
                Maksuehdotus
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="period-spec"
                checked={definition.checkboxes.periodSpecification}
                onCheckedChange={(checked) =>
                  updateCheckbox("periodSpecification", checked === true)
                }
              />
              <Label htmlFor="period-spec" className="cursor-pointer">
                Määräerittely jaksoittain
              </Label>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="decisions-correct"
                checked={definition.checkboxes.decisionsToCorrect}
                onCheckedChange={(checked) =>
                  updateCheckbox("decisionsToCorrect", checked === true)
                }
              />
              <Label htmlFor="decisions-correct" className="cursor-pointer">
                Korjattavat päätökset
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="misuse"
                checked={definition.checkboxes.misuseSuspicion}
                onCheckedChange={(checked) =>
                  updateCheckbox("misuseSuspicion", checked === true)
                }
              />
              <Label htmlFor="misuse" className="cursor-pointer">
                Väärinkäytösepäily
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="waiver"
                checked={definition.checkboxes.waiver}
                onCheckedChange={(checked) =>
                  updateCheckbox("waiver", checked === true)
                }
              />
              <Label htmlFor="waiver" className="cursor-pointer">
                Luopuminen
              </Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

