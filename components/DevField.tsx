"use client";
import React, { useEffect, ReactNode } from "react";
import { useDevMode } from "./DevModeProvider";
import { useDevContext } from "./DevContextPanel";
import { DevFieldTooltip } from "./DevFieldTooltip";

type DevFieldProps = {
  fieldId: string;
  fieldLabel: string;
  userStory: string;
  business: string;
  formula?: string;
  code?: string;
  example?: string;
  children: ReactNode;
  className?: string;
};

export function DevField({
  fieldId,
  fieldLabel,
  userStory,
  business,
  formula,
  code,
  example,
  children,
  className = "",
}: DevFieldProps) {
  const { devMode } = useDevMode();
  const { setActiveField, registerField } = useDevContext();

  useEffect(() => {
    registerField(fieldId, {
      fieldLabel,
      userStory,
      business,
      formula,
      code,
      example,
    });
  }, [fieldId, fieldLabel, userStory, business, formula, code, example, registerField]);

  const handleFocus = () => {
    setActiveField({
      fieldId,
      fieldLabel,
      userStory,
      business,
      formula,
      code,
      example,
    });
  };

  const handleBlur = () => {
    // Optional: Clear active field on blur
    // setActiveField(null);
  };

  // Clone the children and add focus/blur handlers
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<any>, {
        onFocus: (e: FocusEvent) => {
          handleFocus();
          // Call original onFocus if it exists
          if ((child.props as any).onFocus) {
            (child.props as any).onFocus(e);
          }
        },
        onBlur: (e: FocusEvent) => {
          handleBlur();
          // Call original onBlur if it exists
          if ((child.props as any).onBlur) {
            (child.props as any).onBlur(e);
          }
        },
      });
    }
    return child;
  });

  return (
    <div className={`relative flex items-center gap-0 ${className}`}>
      <div className="flex-1 min-w-0">
        {enhancedChildren}
      </div>
      {devMode && (
        <div className="flex-shrink-0">
          <DevFieldTooltip
            fieldId={fieldId}
            userStory={userStory}
            business={business}
            formula={formula}
            code={code}
            onFocus={handleFocus}
          />
        </div>
      )}
    </div>
  );
}

