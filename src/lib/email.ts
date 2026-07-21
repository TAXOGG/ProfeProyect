import { Resend } from "resend";

let client: Resend | null = null;

function getClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error(
      "Falta configurar RESEND_API_KEY en las variables de entorno para poder enviar correos.",
    );
  }
  client ??= new Resend(process.env.RESEND_API_KEY);
  return client;
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer }[];
}) {
  const resend = getClient();
  const from = process.env.EMAIL_FROM || "ARCE <onboarding@resend.dev>";

  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    attachments: input.attachments,
  });

  if (error) throw new Error(error.message);
}
