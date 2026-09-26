import type { Metadata } from "next";
import { LegalChrome } from "@/components/LegalChrome";

export const metadata: Metadata = {
  title: "Privacy — PetThrone",
  description: "How PetThrone collects, uses, and keeps personal data.",
};

export default function PrivacyPage() {
  return (
    <LegalChrome title="Privacy Policy" updated="27 September 2026">
      <p>
        This policy explains what we collect on PetThrone and why. If you do
        not want this processing, do not create a listing or pay a bid.
      </p>

      <h2>1. Who we are</h2>
      <p>
        PetThrone operates this website. For privacy requests write to{" "}
        <a href="mailto:privacy@petthrone.com">privacy@petthrone.com</a>.
      </p>

      <h2>2. What we collect</h2>
      <ul>
        <li>
          <strong>Account.</strong> Email address. A session cookie so you stay
          signed in after checkout.
        </li>
        <li>
          <strong>Listing.</strong> Pet name, boast, 2–3 pet photos, owner
          name, country, and an optional owner photo.
        </li>
        <li>
          <strong>Payments.</strong> Bid amount and payment status. Card
          numbers are handled by Stripe when Stripe is on. We do not store
          full card numbers on this server.
        </li>
        <li>
          <strong>Use.</strong> Page views, a visitor count, a short-lived
          “online” signal, pet-page view counts, and basic device/browser
          data that the host may log (IP address, time, URL).
        </li>
      </ul>

      <h2>3. Why we use it</h2>
      <ul>
        <li>To run the board, show rank, and take payment.</li>
        <li>To keep the listing attached to the right owner.</li>
        <li>To enforce the Rules (fraud, abuse, illegal content).</li>
        <li>To measure traffic (“online”, “visitors today”).</li>
        <li>To meet tax, accounting, and legal duties.</li>
      </ul>
      <p>
        Legal bases where GDPR or similar law applies: contract (to provide
        the listing you paid for), legitimate interests (security, abuse
        prevention, basic analytics), and legal obligation.
      </p>

      <h2>4. What is public</h2>
      <p>
        Pet name, boast, pet photos, owner name, country, optional owner
        photo, rank, and bid total are shown to anyone on the site. Do not
        upload a photo or name you want to keep private.
      </p>

      <h2>5. Who else sees data</h2>
      <ul>
        <li>Payment processors (for example Stripe), if payments are live.</li>
        <li>Hosting and file storage needed to run the site.</li>
        <li>Authorities if the law requires it, or to stop serious abuse.</li>
      </ul>
      <p>We do not sell your personal data.</p>

      <h2>6. How long we keep it</h2>
      <p>
        Listings stay while the board is live or until we remove them under
        the Rules. Payment records may be kept longer for accounting and
        dispute handling. Visitor heartbeats used for “online” expire in
        minutes. Server logs follow the host’s normal retention.
      </p>

      <h2>7. Your choices</h2>
      <ul>
        <li>Do not bid if you do not want a public listing.</li>
        <li>Skip the owner photo. Name and country are required for a new
          listing.</li>
        <li>Ask us to correct or delete a listing by emailing{" "}
          <a href="mailto:privacy@petthrone.com">privacy@petthrone.com</a> from
          the same address you used to bid. We may keep payment records.</li>
        <li>Where the law gives you extra rights (access, portability,
          objection), email that same address. We may need to verify you.</li>
      </ul>

      <h2>8. Children</h2>
      <p>
        The Service is for adults 18 and over. We do not knowingly collect
        data from children. If you believe a minor created a listing, write
        to us and we will remove it.
      </p>

      <h2>9. Security and transfers</h2>
      <p>
        We use ordinary technical safeguards. No site is perfectly secure.
        Servers and processors may be in another country than you. If you
        bid, you accept that transfer.
      </p>

      <h2>10. Changes</h2>
      <p>
        We may update this policy. The date at the top is the current
        version. Continued use after a change means you accept the new
        policy.
      </p>
    </LegalChrome>
  );
}
