import { InformationPage, Placeholder } from "@/app/_components/information-page";

export default function TermsPage() {
  return <InformationPage eyebrow="Terms & conditions" title="Using Amora" introduction="These draft terms outline areas the business owner should confirm with qualified legal advice before making them available to customers." sections={[
    { title: "The service", body: <p>Amora provides digital invitation design and hosting features. The final description of available services, delivery expectations, and any customer eligibility requirements must be confirmed by the owner.</p> },
    { title: "Customer content", body: <p>Customers should only submit content they are entitled to use and should ensure their invitation details are accurate before sharing them with guests.</p> },
    { title: "Acceptable use", body: <p>Invitation links and design tools should not be used for unlawful, harmful, deceptive, or rights-infringing purposes.</p> },
    { title: "Ownership and availability", body: <Placeholder>Confirm the ownership terms for templates and customer content, invitation availability period, prohibited uses, limitation language, governing law, and dispute process.</Placeholder> },
    { title: "Changes to these terms", body: <><p>For questions about these terms, contact <a href="mailto:wedellewedding@gmail.com">wedellewedding@gmail.com</a>.</p><Placeholder>Add an effective date and the owner-approved method for notifying customers about material updates.</Placeholder></> },
  ]} />;
}
