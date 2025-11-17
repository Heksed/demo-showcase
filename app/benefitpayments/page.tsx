"use client";

import DemoPage from "../../components/DemoPage";
import DemoNavigation from "../../components/DemoNavigation";
import PaymentHistory from "../../demos/benefitpayments/PaymentHistory";

export default function BenefitPaymentsPage() {
  return (
    <>
      <DemoNavigation currentSlug="benefitpayments" />
      <DemoPage>
        <PaymentHistory />
      </DemoPage>
    </>
  );
}

