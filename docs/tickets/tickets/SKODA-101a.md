# SKODA-101a, Author identity: Škoda IdP federation, DA permissions, Edge Delivery roles, preview protection

- **Epic:** E01, Foundation & Setup
- **Type:** setup / configuration (no product code)
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02). **Blocks SKODA-809, 812 and 811's group gate.** The long pole
  is the client's Admin Console and IdP work.
- **Estimate:** 3 SP team time · AI-assisted 1–2d / manual 2–3d, excluding client lead time *(planning estimate, not a
  quote)*
- **GitHub issue:** [#407](https://github.com/skoda-storyboard/demo/issues/407) (created 2026-10-21, sub-issue of #1)
- **Status (2026-10-21):** 🔵 TODO (M2), no owner.

## Why
The client requires author sign-in through the Škoda IdP (client requirements §3, as cited by SKODA-809), and the
architecture diagram shows it as "Škoda IDP (author SSO)". No ticket covers it. SKODA-809 and SKODA-812 both name
"SKODA-101 (site/IDP setup)" as upstream, but SKODA-101 only set up DA, the repo and Code Sync, and it is closed.

**There is no IdP hook in Edge Delivery or DA.** Authors sign in with Adobe Identity (IMS). A customer IdP is connected
to IMS through the Adobe Admin Console
([EW permissions](https://www.aem.live/docs/ew/administering/permissions)). The work is configuration on four
levels, and two of them use different identity types:

| Level | Where | Accepts |
|---|---|---|
| Sign-in | Adobe Admin Console (federation with the Škoda IdP) | – |
| Edit and view source in DA | DA org config, `permissions` sheet | IMS org, IMS group, email |
| Preview, publish, view origin | Edge Delivery config service (`access.admin.role.*`, `groups`) | email, email wildcard, Edge Delivery group. **No IMS groups.** |
| Site access (optional) | Edge Delivery `access/preview` or `access/site` | Sidekick-signed-in users with a role, or a site token |

**Today (checked 2026-10-21):**
- The DA `permissions` sheet lists 5 individual @adobe.com accounts and one test account on the embargo folder. There
  is no Škoda org or group.
- `main--demo--skoda-storyboard.aem.page` answers 200 without sign-in. SKODA-811 stages embargoed content on
  preview, so **anyone with the URL can read it** until preview is protected.

## Scope
**Client (blocking):**
- **I1:** name the IdP (SAML or OIDC, e.g. Entra ID). Say which IMS org owns the production DA org and AEM program
  `p220607`; it is the same org as App Builder ask C1 (SKODA-521).
- **I2:** in the Admin Console:
  - claim the Škoda domains;
  - set up a Federated ID directory with the IdP connector;
  - choose group sync (Azure sync, User Sync Tool) or groups maintained by hand.
- **I3:** decide how external authors sign in: local offices, importers, agencies (**Q-15**).
- **I4:** give the authors who insert images read access to the AEM Assets environment (`e2281243`). The DA Assets
  picker uses the author's own sign-in.

**Team:**
- **T1 Group model.** Map SKODA-809's 7 groups to IMS group names, then to DA `permissions` rows per path:
  - `CONFIG`;
  - `/ + **`;
  - each locale tree `/{loc}/**` (local offices write only their locale);
  - `/drafts/**`;
  - the embargo folders.
- **T2 Edge Delivery roles.** `access.admin.role.author`, `.publish` and `.admin` through the config service. IMS groups
  don't carry over, so pick one of two approaches and document it:
  - a wildcard (`*@<škoda domain>`) for preview plus an Edge Delivery `publishers` group;
  - Edge Delivery groups mirrored from the IMS groups by a small script.
  
  Set `requireAuth` deliberately.
- **T3 Preview protection** (decided together with SKODA-811):
  - **Access:** `access/preview` requires sign-in for `*.aem.page`, and `*.aem.live` stays public.
  - **Tooling:** a site token for our tooling (import push, block QA, link checks, PSI bot), stored as a secret and
    never committed.
  - **Checks:** verify that Sidekick sign-in opens protected preview pages.
- **T4 Handover.** Replace the Adobe demo accounts in both permission layers. Keep one documented break-glass admin.
- **T5 Leavers.** Check that disabling a user in the IdP blocks sign-in. Remove individual emails from the Edge Delivery
  roles in the same step.
- **T6 Author guide.** Add a sign-in and access section: whom to ask, what each group can do.

## Not in scope
- Visitor or journalist login: the cart uses a device ID (D2), and QR access is D17 / SKODA-906.
- Service identities: App Builder, API keys and S2S credentials are in SKODA-521.

## Acceptance criteria
- [ ] A Škoda employee signs in to `da.live` through the Škoda IdP, with no Adobe password, and lands in the right
      org.
- [ ] A test author in the CS group can edit `/cs/**` but not `/de/**`. A publisher can publish; an author can only
      preview.
- [ ] The DA Assets picker opens and inserts an image for an SSO author.
- [ ] Removing a user from an IdP group removes the matching DA right after the next sign-in. A disabled user can't
      sign in.
- [ ] If preview protection is chosen:
  - an anonymous request to `*.aem.page` is refused;
  - a signed-in user with a role can view the page;
  - `import:push` and the QA tooling work with the site token;
  - `*.aem.live` is unchanged.
- [ ] The group model, both permission layers and the leaver steps are documented. No credential is in the repo.

## Dependencies
Client Admin Console and IdP admins; **D15** (RACI, who owns which group); **Q-15** (external authors). Blocks
SKODA-809, SKODA-812 and SKODA-811 (group gate, preview protection). Needed before local authors start on
SKODA-1004b–e. Shares the IMS org with SKODA-521.
