import { InformationPage, Placeholder } from "@/app/_components/information-page";

export default function ContactPage() {
  return <InformationPage eyebrow="We would love to hear from you" title="Contact us" introduction="Whether you are planning a celebration or have a question about Amora, our team is here to help." sections={[
    { title: "Get in touch", body: <><p>For questions about invitations, existing orders, or general assistance, email us at <a href="mailto:wedellewedding@gmail.com">wedellewedding@gmail.com</a>.</p><Placeholder>Add any additional owner-approved phone, WhatsApp, or support-hours details here.</Placeholder></> },
    { title: "Before you reach out", body: <p>Please include the name used for your invitation and, where available, your invitation link. This helps the Amora team understand your question more quickly.</p> },
    { title: "Business information", body: <Placeholder>Add the business name, registered address, and any required local contact details here after owner confirmation.</Placeholder> },
  ]} />;
}
