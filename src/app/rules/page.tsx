import type { Metadata } from "next";
import { LegalChrome } from "@/components/LegalChrome";
import { MIN_BID_CENTS } from "@/lib/money";
import { MAX_BOAST, MAX_OWNER_NAME, MAX_PET_NAME, MIN_AGE } from "@/lib/policy";

export const metadata: Metadata = {
  title: "Rules — PetThrone",
  description: "Strict ranking, payment, and content rules for PetThrone.",
};

export default function RulesPage() {
  return (
    <LegalChrome title="Rules" updated="27 September 2026">
      <p>
        These Rules are mandatory. If you bid, post, or stay on the board, you
        accept them. PetThrone may remove a listing, freeze an account, or keep
        a payment without a refund when a rule is broken.
      </p>

      <h2>1. What this site is</h2>
      <p>
        PetThrone is a public vanity leaderboard. Rank is sold display space.
        It is not a contest, raffle, lottery, prize pool, investment, or game
        of chance. Nobody wins money. A completed payment buys a rank on the
        board and nothing else.
      </p>

      <h2>2. Who may use it</h2>
      <ul>
        <li>You must be {MIN_AGE} or older.</li>
        <li>You bid only for a pet you own or are authorized to represent.</li>
        <li>One account and one pet per person. Extra accounts to dodge a
          removal or chargeback are banned.</li>
        <li>If your country forbids this kind of paid placement, do not use
          the site.</li>
      </ul>

      <h2>3. How rank is decided</h2>
      <ul>
        <li>Rank is the sum of your completed bids. Nothing else counts: no
          votes, likes, or time on the throne.</li>
        <li>Bids are whole US dollars. Minimum bid is ${MIN_BID_CENTS / 100}.</li>
        <li>To take a seat you must beat that seat’s total by at least $1.</li>
        <li>To take #1 you must beat the current #1 total by at least $1.</li>
        <li>If two totals match, the older listing keeps the higher rank.</li>
        <li>Later bids on the same account add to your total. You are charged
          only the new amount.</li>
        <li>Ranks 1–10 are the board. Rank 11 and below are challengers.</li>
        <li>A rank is claimed only after payment completes. Unpaid drafts do
          not hold a seat.</li>
        <li>Anyone 18+ may pay to boost a listed pet. A boost adds to that
          pet’s total. It does not transfer the listing or give the payer a
          seat.</li>
      </ul>

      <h2>4. Payments</h2>
      <ul>
        <li>Every completed payment is final. No refunds, credits, or
          chargebacks for a change of mind, a dethrone, a removal, or a
          downtime.</li>
        <li>Opening a chargeback without a proven processing error is a ban.
          We may dispute it and keep the rank frozen.</li>
        <li>If a payment is reversed, the bid is stripped and ranks are
          recalculated.</li>
        <li>Shown prices are in USD. Your bank may add its own fees.</li>
      </ul>

      <h2>5. What you may post</h2>
      <ul>
        <li>A real pet. A name (max {MAX_PET_NAME} characters). A short boast
          (max {MAX_BOAST} characters). Your name (max {MAX_OWNER_NAME}
          characters). Your country. Two or three pet photos.</li>
        <li>Your own photo is optional. If you add one, it must be you, and
          you must be {MIN_AGE}+.</li>
        <li>You must own the photos or have written permission to use them.</li>
        <li>Photos must be of the named pet. No stock swaps, no other people’s
          pets, no celebrity animals you do not own.</li>
      </ul>

      <h2>6. What is banned</h2>
      <ul>
        <li>Hate, threats, slurs, or harassment in any name, boast, or photo.</li>
        <li>Sexual, nude, or pornographic images. No sexual content involving
          anyone under 18 — that is reported and removed at once.</li>
        <li>Violence, gore, or animal abuse.</li>
        <li>Stolen photos, logos, or trademarks.</li>
        <li>Impersonating another owner, pet, or brand.</li>
        <li>Spam, scams, malware, or links meant to phish.</li>
        <li>Anything illegal where you live or where we operate.</li>
      </ul>

      <h2>7. Enforcement</h2>
      <p>
        We may hide, edit, or delete a listing, demand new photos, or ban an
        email without notice if we believe a rule was broken. We do not have
        to explain every decision in public. Removed listings are not refunded.
        Repeat or serious breaches can be a permanent ban.
      </p>
      <p>
        If you see a listing that breaks these Rules, report it to the operator
        at the email on the Privacy page. We will review reports, but we are
        not required to take a specific action.
      </p>

      <h2>8. The board can change</h2>
      <p>
        We may change prices, minimums, seat count, or these Rules. New bids
        follow the Rules posted at the time of payment. If you disagree, do
        not bid again.
      </p>
    </LegalChrome>
  );
}
