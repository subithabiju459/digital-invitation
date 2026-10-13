import { InformationPage, Placeholder } from "@/app/_components/information-page";

export default function RefundCancellationPage() {
  return <InformationPage eyebrow="Refund & cancellation policy" title="Orders, changes & support" introduction="No refund or cancellation commitments are stated here until they have been confirmed by the Amora business owner." sections={[
    { title: "Before placing an order", body: <p>Customers should review their invitation details, selected design, and any applicable order information carefully before completing a purchase.</p> },
    { title: "Digital services", body: <Placeholder>Confirm when an order is considered started or delivered, what changes can be requested, whether preview or design work affects eligibility, and any applicable timelines.</Placeholder> },
    { title: "Cancellations", body: <Placeholder>Add owner-approved cancellation terms, the request process, applicable cut-off times, and the contact channel for support.</Placeholder> },
    { title: "Refunds", body: <Placeholder>Add owner-approved refund eligibility, exclusions, method, processing time, and any consumer-law considerations. Do not publish this page until these commitments are confirmed.</Placeholder> },
    { title: "Need help?", body: <Placeholder>Add the appropriate business contact information for order and policy questions.</Placeholder> },
  ]} />;
}
