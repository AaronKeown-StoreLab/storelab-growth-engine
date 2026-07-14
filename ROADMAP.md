# StoreLab OS Roadmap

## Phase 1 - Core LinkedIn Pursuit Loop
- [x] Create Next.js application
- [x] Add dark UI shell
- [x] Add approval-first LinkedIn pursuit capture
- [x] Add pursuit memory for person, business, stage, next action, and touchpoints
- [ ] Make capture reliable for copied LinkedIn profile text, screenshots, and extension captures
- [ ] Prevent duplicate people and move people between businesses when roles change
- [ ] Keep new prospects pending until they accept a LinkedIn connection request
- [ ] Make the morning assistant compact, dismissible, and useful

## Phase 2 - Relationship Intelligence
- [ ] Create target business and stakeholder profiles
- [ ] Add relationship stages and opportunity stages
- [ ] Add relationship health scoring
- [ ] Detect current role, previous roles, country, and business from LinkedIn profile text
- [ ] Track role moves and recommend when to reconnect
- [ ] Store personal background from articles, posts, emails, meetings, and notes

## Phase 3 - Source Capture
- [ ] Chrome extension captures the visible LinkedIn profile reliably
- [ ] Screenshot and JPEG upload reads profile/person/business details
- [ ] URL capture reads useful public pages and proposes updates
- [ ] Preview extracted info before saving
- [ ] Let Aaron edit proposed fields before approval
- [ ] Learn from repeated corrections such as business naming and country suffixes

## Phase 4 - Daily Assistant
- [ ] Next best action each morning
- [ ] Follow-up reminders based on LinkedIn, email, Teams, and calendar activity
- [ ] AI-generated message and email replies with regenerate options
- [ ] Ignore, complete, minimise, and close assistant tasks
- [ ] Prioritise accepted connections and active relationships over newly found prospects

## Phase 5 - Outlook, Calendar, and Microsoft 365 Signals
- [ ] Connect Outlook Mail through Microsoft Graph OAuth
- [ ] Connect Outlook Calendar through Microsoft Graph OAuth
- [ ] Detect LinkedIn notification emails announcing accepted/new connections
- [ ] Extract the new connection person, LinkedIn profile signal, likely business, role, and source email
- [ ] Propose adding or updating the customer and business, approval-first before writing anything
- [ ] If the person already exists, update their relationship status instead of duplicating them
- [ ] Create a recommended LinkedIn follow-up after a connection acceptance email
- [ ] Detect important customer emails that need a reply or follow-up
- [ ] Detect meeting/demo/quote activity from calendar and email threads
- [ ] Keep all email/calendar-derived actions reviewable before sending or saving

## Phase 6 - Data and Access
- [ ] Supabase or production database
- [ ] User login
- [ ] Secure token storage for integrations
- [ ] Audit trail for AI-proposed changes and approvals
