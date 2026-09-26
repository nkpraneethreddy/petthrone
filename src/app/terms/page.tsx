import type { Metadata } from "next";
import { LegalChrome } from "@/components/LegalChrome";
import { MIN_AGE } from "@/lib/policy";

export const metadata: Metadata = {
  title: "Terms — PetThrone",
  description: "Terms and conditions for using PetThrone.",
};

export default function TermsPage() {
  return (
    <LegalChrome title="Terms and Conditions" updated="27 September 2026">
      <p>
        These Terms govern your use of PetThrone (the “Service”). By opening
        the site, creating a listing, or paying a bid, you agree to these
        Terms, the Rules, and the Privacy Policy. If you do not agree, leave
        the site and do not pay.
      </p>

      <h2>1. The service</h2>
      <p>
        The Service is a paid public display board for pet listings. You buy
        rank, not ownership of the site, not a prize, and not a financial
        return. The Service is provided for entertainment and advertising
        display only.
      </p>

      <h2>2. Eligibility</h2>
      <p>
        You must be at least {MIN_AGE} years old and able to form a binding
        contract. You confirm that your use is legal in your country. We may
        refuse service to anyone.
      </p>

      <h2>3. Accounts</h2>
      <p>
        We identify you by the email you give at checkout. You are responsible
        for that email and for every bid placed with it. Tell us if you lose
        access. We may close accounts that look automated, abusive, or fake.
      </p>

      <h2>4. Bids and payments</h2>
      <ul>
        <li>A bid is an offer to buy display rank. It becomes final when
          payment is confirmed by us or by our payment processor.</li>
        <li>All sales are final. Payments are not refundable, including after
          a dethrone, a rank drop, a content removal, or a site outage.</li>
        <li>You authorize us and our processor (including Stripe, when
          enabled) to charge the amount you submit.</li>
        <li>Taxes, card fees, and currency conversion are yours.</li>
        <li>A chargeback or payment dispute filed in bad faith is a breach.
          We may ban the account and contest the dispute.</li>
      </ul>

      <h2>5. Your content</h2>
      <p>
        You keep whatever rights you already have in your photos and text. You
        grant PetThrone a worldwide, royalty-free license to host, show, crop,
        and share that content on the Service and in promotional clips of the
        board for as long as the listing exists and for a reasonable time
        after removal (caches and backups).
      </p>
      <p>You warrant that:</p>
      <ul>
        <li>you are {MIN_AGE}+ and the listing is about a pet you may represent;</li>
        <li>you own or have permission for every photo and line of text;</li>
        <li>the content does not break the Rules or any law;</li>
        <li>an optional owner photo is of you and is not sexual or illegal.</li>
      </ul>
      <p>
        We may refuse, hide, or delete content at our discretion. Deletion
        does not create a refund.
      </p>

      <h2>6. No winnings, no fiduciary duty</h2>
      <p>
        Rank is not a jackpot. We do not hold funds for you. We are not your
        agent, broker, or bank. Past rank does not predict future rank.
      </p>

      <h2>7. Acceptable use</h2>
      <p>
        You will not attack the Service, scrape it in a way that harms it,
        bypass payment, fake a session, or use it to break the law. You will
        not upload malware. Automated bidding that harms other users may be
        blocked.
      </p>

      <h2>8. Disclaimer</h2>
      <p>
        THE SERVICE IS PROVIDED “AS IS”. WE DO NOT WARRANT that the board will
        be up, accurate, or error-free. Listings may be delayed, reordered, or
        lost. To the fullest extent allowed by law, we disclaim implied
        warranties of merchantability, fitness for a purpose, and
        non-infringement.
      </p>

      <h2>9. Limit of liability</h2>
      <p>
        To the fullest extent allowed by law, PetThrone and its operators are
        not liable for lost profits, lost rank, lost data, or indirect or
        consequential damages. Our total liability for a claim about the
        Service is limited to the amount you paid us in the 30 days before
        the claim, or $50, whichever is greater. Some places do not allow
        these limits; there, they apply to the maximum allowed.
      </p>

      <h2>10. Indemnity</h2>
      <p>
        You will defend and indemnify PetThrone and its operators against
        claims, damages, and legal fees that arise from your content, your
        bids, your breach of these Terms, or your violation of someone else’s
        rights.
      </p>

      <h2>11. Changes and shutdown</h2>
      <p>
        We may change the Service or these Terms at any time. The date at the
        top is the effective date. We may pause or close the board. Closing
        the board does not require refunds of past display purchases.
      </p>

      <h2>12. Law and disputes</h2>
      <p>
        These Terms are governed by the laws of India, without regard to
        conflict-of-law rules. Courts in India have exclusive jurisdiction,
        except that we may seek an injunction anywhere to stop abuse of the
        Service or misuse of content. You waive class actions to the extent
        a court will allow it.
      </p>

      <h2>13. Contact</h2>
      <p>
        Questions about these Terms: use the contact email on the Privacy
        page. These Terms do not create rights for anyone except you and us.
      </p>
    </LegalChrome>
  );
}
