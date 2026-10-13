import { InformationPage, Placeholder } from "@/app/_components/information-page";

export default function PrivacyPage() {
  return <InformationPage eyebrow="Privacy policy" title="Your privacy matters" introduction="This page is a working privacy-policy framework for Amora Invitations and must be completed and reviewed by the business owner before publication." sections={[
    { title: "Information used to create an invitation", body: <p>When a customer creates an invitation, Amora may process the details they choose to provide, such as names, event details, contact details, messages, and uploaded images.</p> },
    { title: "How information may be used", body: <p>Information may be used to create, host, display, support, and maintain a customer&apos;s invitation experience. This section must be expanded by the owner to reflect the business&apos;s actual practices.</p> },
    { title: "Storage and sharing", body: <Placeholder>Confirm which service providers process data, where invitation data and images are stored, how long information is retained, and who can access shared invitation links.</Placeholder> },
    { title: "Your choices", body: <><p>For privacy-related questions or requests, contact <a href="mailto:wedellewedding@gmail.com">wedellewedding@gmail.com</a>.</p><Placeholder>Confirm the process for requests to access, correct, delete, or otherwise manage personal information, including any applicable regional privacy rights.</Placeholder></> },
    { title: "Policy updates", body: <><p>For questions about this policy, contact <a href="mailto:wedellewedding@gmail.com">wedellewedding@gmail.com</a>.</p><Placeholder>Add an effective date and owner-approved review process.</Placeholder></> },
  ]} />;
}
