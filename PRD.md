# VoxCard - Product Requirements Document (PRD)

**Version:** 1.0  
**Last Updated:** October 7, 2025  
**Project Status:** Pre-Launch / Validation Phase

---

## Executive Summary

**VoxCard** is a decentralized community savings platform (also known as Ajo, Esusu, or ROSCA - Rotating Savings and Credit Association) built on the Stacks blockchain using Clarity smart contracts. The platform enables groups of people to pool funds together and receive payouts in a rotating manner, eliminating the need for traditional financial intermediaries while providing transparency, security, and flexibility through Bitcoin-backed blockchain technology.

### Vision Statement
To democratize access to community-based savings by providing a transparent, secure, and blockchain-powered alternative to traditional rotating savings circles, making financial cooperation accessible to everyone regardless of geographic location or banking infrastructure.

### Core Value Proposition
- **Transparency:** All transactions, contributions, and payouts are recorded on-chain and publicly verifiable
- **Security:** Smart contracts eliminate escrow risk and middleman fraud
- **Flexibility:** Support for partial payments, various contribution frequencies, and customizable group parameters
- **Trust:** On-chain reputation system (trust scores) incentivizes good behavior and reliable participation
- **Accessibility:** Gasless transaction support reduces barriers to entry

---

## Problem Statement

### Primary Problem
Traditional rotating savings and credit associations (ROSCAs/Ajo/Esusu) face several critical issues:

1. **Trust & Fraud Risk:** Participants must trust a central coordinator who collects and distributes funds, creating opportunities for embezzlement or mismanagement
2. **Lack of Transparency:** Manual record-keeping leads to disputes about contributions and payout schedules
3. **Geographic Limitations:** Traditional circles require physical proximity and face-to-face trust
4. **Inflexibility:** Fixed payment schedules don't accommodate varying financial situations
5. **No Accountability System:** Once someone defaults or disappears, there's no recourse or reputation tracking

### Target Market Pain Points

**For Individual Savers:**
- Difficulty accessing formal banking/credit systems
- High fees and minimum balance requirements at traditional banks
- Lack of saving discipline without community accountability
- Fear of fraud in traditional Ajo circles
- Need for flexible payment options

**For Community Organizers:**
- Time-consuming manual administration
- Risk of being blamed for fund mismanagement
- Difficulty tracking and enforcing contributions
- Challenges in vetting new members

---

## Target Users

### Primary User Personas

#### 1. **The Community Saver (Primary)**
- **Demographics:** Ages 25-55, emerging markets (Nigeria, Kenya, Philippines, Latin America), low-to-middle income
- **Characteristics:**
  - Participates in or familiar with traditional savings circles
  - Limited access to formal banking services
  - Has smartphone and basic crypto awareness
  - Values community and collective financial support
  - Needs flexible payment options
- **Goals:**
  - Save money with community accountability
  - Access lump sum payouts for major expenses
  - Build financial reputation
  - Avoid fraud/theft from traditional coordinators

#### 2. **The Group Organizer/Creator**
- **Demographics:** Ages 30-60, community leaders, small business owners
- **Characteristics:**
  - Currently organizes or has organized traditional savings circles
  - Trusted by community members
  - Wants to reduce administrative burden
  - Seeks tools to ensure fairness and transparency
- **Goals:**
  - Create and manage savings groups efficiently
  - Maintain transparency to avoid disputes
  - Automate payout distribution
  - Build reputation as reliable organizer

#### 3. **The Crypto-Native Saver**
- **Demographics:** Ages 20-40, tech-savvy, DeFi users
- **Characteristics:**
  - Already using crypto wallets and DeFi protocols
  - Looking for structured savings alternatives
  - Values on-chain transparency
  - Wants to combine community saving with DeFi
- **Goals:**
  - Disciplined saving with crypto assets
  - Participate in transparent, automated savings circles
  - Build on-chain reputation
  - Earn through structured savings without centralized platforms

---

## Solution Overview

### Core Product Description
VoxCard is a decentralized application (dApp) that enables users to create, join, and participate in blockchain-based savings circles. Smart contracts handle all financial logic, contribution tracking, payout distribution, and reputation management, eliminating the need for trusted intermediaries.

### Key Differentiators

**vs. Traditional Ajo/ROSCA:**
- ✅ Trustless (no central coordinator holds funds)
- ✅ Transparent (all transactions on-chain)
- ✅ Automated payouts (smart contract enforced)
- ✅ Geographic flexibility (global participation)
- ✅ Verifiable trust scores

**vs. Other DeFi Savings Protocols:**
- ✅ Community-oriented (not purely algorithmic)
- ✅ Rotating payout structure (like traditional ROSCAs)
- ✅ Flexible contribution schedules
- ✅ Approval-based membership (community vetting)
- ✅ Built for mainstream users (not just DeFi natives)

---

## Technical Architecture

### Blockchain & Smart Contracts

**Platform:** Stacks (Bitcoin Layer 2)
- **Rationale:** Stacks provides Bitcoin security, native wallet integration, and smart contract capabilities without modifying Bitcoin

**Smart Contract:** Clarity
- **Location:** `voxcard-stacks/contracts/`
- **Key Components:**
  - Core business logic (create plans, join, contribute, payouts)
  - Multi-asset support (STX and sBTC)
  - Data structures (Plan, Frequency, JoinRequest, Config)
  - Public and read-only functions
  - Comprehensive error handling

**Contract Version:** 1.1.0 (sBTC Integration)
**Language:** Clarity (Stacks native language)

### Frontend Application

**Stack:**
- **Framework:** React 18 + Vite
- **Language:** TypeScript
- **UI Components:** shadcn/ui + Radix UI
- **Styling:** Tailwind CSS v3.4.11
- **State Management:** React Context API + TanStack Query
- **Routing:** React Router v6
- **Animations:** Framer Motion

**Key Services:**
- `TurnkeyWalletProvider.tsx` - Embedded wallet management (Turnkey SDK)
- `StacksWalletProvider.tsx` - External wallet integration (@stacks/connect)
- `StacksContractProvider.tsx` - Smart contract interactions
- `SBTCService.ts` - sBTC token operations and bridge integration
- React context for blockchain state management

**Wallet Integration:**
- **Primary:** Turnkey Embedded Wallets (Passkey-based, self-custodial)
- **Secondary:** External wallets via @stacks/connect (Leather, Xverse)

**Asset Support:**
- **STX:** Native Stacks tokens for gas and contributions
- **sBTC:** Bitcoin-backed synthetic asset (1:1 with BTC) for Bitcoin-denominated savings

### Backend (Metadata & Indexing - Optional Layer)

**Note:** Current architecture is primarily frontend + smart contract. Backend is mentioned in README but not fully implemented in visible codebase.

**Planned Stack:**
- Node.js + Express
- PostgreSQL
- Purpose: Store plan metadata, user info, transaction history for fast queries

---

## Core Features & User Flows

### 1. Create Savings Plan/Group

**User Story:** As a group organizer, I want to create a new savings plan so that I can invite others to join.

**Key Parameters:**
- Plan name (3-50 characters)
- Description (10-500 characters)
- Total participants (2-100)
- Contribution amount (0.1-10,000 STX)
- Frequency (Daily, Weekly, Monthly)
- Duration in months (1-36)
- Trust score required (0-100)
- Allow partial payments (true/false)

**Smart Contract Logic:**
- Validates input parameters
- Increments plan counter
- Saves plan to blockchain storage
- Creator is automatically first participant
- Plan starts in "inactive" state until fully subscribed

**UI Flow:**
1. User navigates to "Create Group" page
2. Fills out form with plan parameters
3. Clicks "Create Plan" button
4. Wallet popup for transaction signature
5. Transaction confirmation
6. Redirect to plan detail page

**Contract Functions:**
- `ExecuteMsg::CreatePlan` - Creates new plan
- `QueryMsg::GetPlansByCreator` - Retrieves creator's plans

---

### 2. Browse & Join Plans

**User Story:** As a saver, I want to browse available savings plans and request to join one that fits my needs.

**Discovery Flow:**
1. User navigates to "Browse Groups" page
2. Views list of available plans (paginated)
3. Filters by:
   - Contribution amount
   - Frequency
   - Trust score requirement
   - Number of participants
4. Clicks on a plan to view details
5. Clicks "Request to Join"

**Approval Mechanism:**
- User submits join request to smart contract
- Existing participants vote to approve/deny
- Requires 50%+ approval votes to join
- Approved users are inserted at current payout index position
- Upon approval, trust score increases by +2

**Smart Contract Logic:**
- `RequestToJoinPlan` - Creates join request
- `ApproveJoinRequest` - Existing member approves
- `DenyJoinRequest` - Existing member denies
- Automatic acceptance when threshold reached
- Automatic rejection when denial threshold reached

**Security Checks:**
- User not already participant
- Plan not full
- User's trust score meets minimum requirement
- No duplicate join requests

---

### 3. Contribute to Plan

**User Story:** As a participant, I want to make my regular contribution so that I maintain good standing and receive my payout when it's my turn.

**Contribution Flow:**
1. User navigates to "Dashboard" or plan detail page
2. Views current cycle status:
   - Current personal cycle number
   - Required contribution amount
   - Amount contributed this cycle
   - Remaining amount due
   - Outstanding debt from previous cycles
3. Enters contribution amount (STX)
4. Clicks "Contribute"
5. Wallet popup with transaction details
6. Funds sent to contract with contribution transaction
7. Trust score updated based on payment behavior

**Payment Types:**
- **Full Payment:** Pay entire required amount → +10 trust score
- **Partial Payment:** Pay portion of required (if enabled) → +5 trust score
- **Late Payment:** Pay previous cycle debt → +4 trust score
- **Missed Payment:** No payment in cycle → -15 trust score

**Debt Tracking System:**
- Each participant has personal cycle timeline (starts when they join)
- Unpaid amounts from previous cycles roll into "debt"
- Debt must be cleared before contributions count toward current cycle
- Cannot overpay beyond current cycle requirement + debt

**Auto-Payout Mechanism:**
- After each contribution, contract checks if total balance ≥ one full round payout
- If yes, automatically triggers payout to next participant in rotation
- Payout amount = contribution_amount × total_participants
- Recipient determined by round-robin `payout_index`
- Payout index increments after each distribution
- Plan automatically deactivates after all planned cycles complete

**Smart Contract Functions:**
- `Contribute` - Submit contribution with STX funds
- `GetParticipantCycleStatus` - Query cycle status
- `try_auto_payout` - Internal function for automatic distributions

---

### 4. Trust Score System

**User Story:** As a participant, I want to build my on-chain reputation through reliable contributions so that I can access better groups and receive priority payouts.

**Trust Score Mechanics:**

**Starting Score:** 50 (default for new users)

**Score Increases:**
- Join approval: +2
- Full payment on time: +10
- Partial payment (when allowed): +5
- Late payment (covering previous debt): +4

**Score Decreases:**
- Missed cycle: -15

**Trust Score Benefits:**
- Required minimum score to join certain plans
- Higher score = better reputation
- Future enhancement: Priority payout ordering based on score
- Future enhancement: Access to exclusive high-value groups

**Storage:**
- Stored on-chain per user address
- Query: `GetTrustScore { user: address }`
- Global state: `TRUST_SCORE: Map<&Addr, u64>`

---

### 5. Dashboard & Account Management

**User Story:** As a user, I want to view all my active plans, contributions, and upcoming payouts in one place.

**Dashboard Sections:**

**Profile Card:**
- Account address (shortened)
- Current trust score with progress bar
- "Manage Account" button

**Activity Summary:**
- Number of active groups
- Total contributed (all time)
- Upcoming payout (if scheduled)

**Tabs:**
1. **Overview:** Active plans with contribution status
2. **Your Groups:** All plans user has created
3. **Contributions:** Recent contribution history

**Account Management Modal:**
- View full wallet address
- Copy address to clipboard
- View balance in STX
- Link to block explorer
- Logout

---

### 6. Plan Detail & Administration

**User Story:** As a plan participant, I want to view detailed information about my group, see who else is participating, and track payout schedule.

**Plan Detail Page Displays:**
- Plan name, description
- Current cycle / total cycles
- Contribution amount & frequency
- Total pool balance
- Participant list with trust scores
- Payout rotation order
- Join requests (if participant)
- Contribution history

**Creator-Only Actions:**
- View join requests
- Approve/deny join requests
- (Future) Cancel plan
- (Future) Emergency withdrawal

---

## Data Models

### Plan
```rust
pub struct Plan {
    pub id: u64,
    pub name: String,
    pub description: String,
    pub total_participants: u32,
    pub contribution_amount: Uint128,
    pub frequency: Frequency, // Daily, Weekly, Monthly
    pub duration_months: u32,
    pub trust_score_required: u32,
    pub allow_partial: bool,
    pub participants: Vec<String>, // Addresses
    pub current_cycle: u32,
    pub is_active: bool,
    pub payout_index: u32,
    pub balance: Uint128,
    pub created_by: Addr,
}
```

### Frequency
```rust
pub enum Frequency {
    Daily,
    Weekly,
    Monthly,
}
```

### JoinRequest
```rust
pub struct JoinRequest {
    pub plan_id: u64,
    pub requester: Addr,
    pub approvals: Vec<Addr>,
    pub denials: Vec<Addr>,
}
```

### Storage Maps
- `PLANS: Map<u64, Plan>` - All plans by ID
- `PLANS_BY_CREATOR: Map<&Addr, Vec<u64>>` - Plans created by each address
- `JOIN_REQUESTS: Map<(u64, Addr), JoinRequest>` - Pending join requests
- `CONTRIBUTIONS: Map<(u64, Addr, u64), Uint128>` - Contributions by plan, user, cycle
- `USER_DEBT: Map<(u64, Addr), Uint128>` - Accumulated debt per user per plan
- `TRUST_SCORE: Map<&Addr, u64>` - Global trust scores
- `PARTICIPANT_START: Map<(u64, Addr), u64>` - When each participant joined (timestamp)
- `PLAN_COUNT: Item<u64>` - Global counter for plan IDs
- `CONFIG: Item<Config>` - Admin configuration

---

## Technical Specifications

### Smart Contract Validation Rules

**Plan Creation:**
- Name: 3-100 characters
- Description: 10-500 characters
- Total participants: 2-100
- Contribution amount: 0.1-10,000 STX
- Duration: 1-36 months
- Trust score required: 0-100

**Contributions:**
- Must be active participant
- Plan must be active
- Must send sufficient STX funds
- Cannot overpay beyond cycle requirement + debt
- Must pay exact amount if partial payments disabled

**Join Requests:**
- User not already participant
- Plan not full
- No existing join request
- User trust score ≥ plan requirement

### Cycle Calculation
- Each participant has **personal cycle timeline** based on join timestamp
- Cycle number = `(current_time - participant_start_time) / cycle_duration`
- Cycle duration:
  - Daily: 86,400 seconds
  - Weekly: 604,800 seconds (7 days)
  - Monthly: 2,592,000 seconds (30 days)

### Payout Logic
- Triggered automatically after each contribution
- Checks if `plan.balance >= contribution_amount * total_participants`
- If yes, sends payout to `participants[payout_index]`
- Increments `payout_index` (wraps to 0 after last participant)
- Increments global `current_cycle`
- Deactivates plan if `current_cycle >= duration_months * cycles_per_month`

---

## User Interface Design

### Design System

**Brand Colors:**
- Primary (vox-primary): Teal/Cyan (`#06b6d4` equivalent)
- Secondary (vox-secondary): Dark Blue/Navy
- Accent (vox-accent): Orange/Amber

**Typography:**
- Headings: Custom "font-heading" (likely Poppins or similar)
- Body: Custom "font-sans" (likely Inter or similar)
- Code/Addresses: `font-mono`

**UI Components:** 
Utilizing shadcn/ui + Radix primitives for:
- Buttons, Cards, Dialogs, Forms
- Progress bars, Tabs, Tooltips
- Toasts, Badges, Avatars

**Animations:**
- Page transitions via Framer Motion
- Smooth hover states
- Loading states and skeletons

### Key Pages

1. **Home (`/`)** - Hero, features, CTA
2. **Dashboard (`/dashboard`)** - User overview, plans, contributions
3. **Browse Groups (`/groups`)** - List all plans (paginated)
4. **Plan Detail (`/groups/:planId`)** - Individual plan view
5. **Create Plan (`/create-group`)** - Plan creation form
6. **About (`/about`)** - Project information
7. **404 (`*`)** - Not found page

---

## Success Metrics

### Phase 1: Validation (Current Phase)
- [ ] 10+ user interviews confirming problem exists
- [ ] 3+ potential users commit to trying beta
- [ ] Technical feasibility proven (smart contract deployed to testnet)
- [ ] Clear articulation of why blockchain adds value

### Phase 2: Beta Launch
- Target: 50 total users
- Target: 5 active savings groups
- Target: $10,000+ TVL (Total Value Locked)
- Target: 90%+ contribution completion rate
- Target: <5% default rate

### Phase 3: Growth
- Target: 500 total users
- Target: 50 active groups
- Target: $100,000+ TVL
- Target: NPS score >40
- Target: Average trust score increase of +20 per active user

### Key Performance Indicators (KPIs)
- **User Acquisition:** New users per week
- **Activation:** % users who create or join a plan within 7 days
- **Retention:** % users still active after 30/60/90 days
- **TVL Growth:** Month-over-month increase
- **Contribution Rate:** % of required contributions made on time
- **Trust Score Distribution:** Median and average trust scores
- **Transaction Success Rate:** % successful vs. failed transactions

---

## Risks & Mitigation

### Technical Risks

**Risk:** Smart contract bugs leading to loss of funds
- **Mitigation:** Comprehensive testing, Clarity's decidability prevents many bugs, gradual rollout with cap on TVL

**Risk:** Stacks chain downtime or network issues
- **Mitigation:** Monitor chain health, leverage Bitcoin finality, communicate clearly with users

**Risk:** Wallet integration issues (@stacks/connect SDK)
- **Mitigation:** Support multiple wallets (Leather, Xverse), clear error messaging, support documentation

### Product Risks

**Risk:** Users don't understand how to use crypto wallets
- **Mitigation:** Detailed onboarding, tutorial videos, in-app guidance, leverage embedded wallet features

**Risk:** Insufficient trust in blockchain-based solution
- **Mitigation:** Educational content, testimonials, start with existing communities

**Risk:** Network effects - not enough users to form viable groups
- **Mitigation:** Targeted community outreach, referral incentives, seed initial groups with team/partners

### Market Risks

**Risk:** Regulatory issues with savings pools in certain jurisdictions
- **Mitigation:** Legal review, geo-restrictions if necessary, clear disclaimers

**Risk:** Competition from other DeFi savings products
- **Mitigation:** Focus on unique ROSCA model, community features, emerging market positioning

**Risk:** Low crypto adoption in target markets
- **Mitigation:** Partner with local crypto educators, fiat on-ramps, mobile-first design

---

## Competitive Landscape

### Direct Competitors

**Traditional ROSCAs/Ajo:**
- **Strengths:** Established trust, no tech barrier, cultural familiarity
- **Weaknesses:** Fraud risk, geographic limitations, manual administration
- **VoxCard Advantage:** Trustless, transparent, automated

**Blockchain Savings Apps:**
- Various DeFi savings protocols (Compound, Aave, etc.)
- **Strengths:** Established platforms, high TVL, proven smart contracts
- **Weaknesses:** Not community-focused, no rotating payouts, algorithmic not social
- **VoxCard Advantage:** Community-based, ROSCA model, social accountability

**Fintech Savings Apps:**
- Cowrywise, PiggyVest (Nigeria), Chama platforms (Kenya)
- **Strengths:** User-friendly, trusted, local payment integrations
- **Weaknesses:** Centralized, trust required, limited transparency, geographic restrictions
- **VoxCard Advantage:** Decentralized, global access, blockchain transparency

### Market Positioning

**VoxCard Positioning:**
"The first blockchain-powered ROSCA platform that combines the community trust of traditional Ajo with the transparency and security of smart contracts, making savings circles accessible to anyone, anywhere."

---

## Roadmap

### Phase 0: Validation (Current - Weeks 1-2)
- [x] Build MVP (smart contract + frontend)
- [x] Migrate to Stacks blockchain
- [x] Integrate Turnkey Embedded Wallet SDK
- [x] Add sBTC transaction support
- [ ] Deploy to Stacks testnet with sBTC functionality
- [ ] Conduct user interviews (10+ people)
- [ ] Validate problem-solution fit
- [ ] Document findings and iterate

### Phase 1: Private Beta (Weeks 3-6)
- [ ] Smart contract audit (basic security review)
- [ ] Onboard 5 test groups (50 users)
- [ ] Gather feedback and iterate
- [ ] Add missing features based on feedback
- [ ] Establish support channels

### Phase 2: Public Beta (Weeks 7-12)
- [ ] Open registration
- [ ] Community building (Discord, Telegram)
- [ ] Content marketing (blog, tutorials)
- [ ] Referral program
- [ ] Track KPIs and optimize

### Phase 3: Mainnet Launch (Month 4+)
- [ ] Full smart contract audit (Clarity security review)
- [ ] Deploy to Stacks mainnet
- [ ] Marketing campaign
- [ ] Partnership announcements
- [ ] TVL and user growth targets

### Future Enhancements
- [x] Embedded wallet support (Turnkey integration)
- [x] Bitcoin-backed savings (sBTC support)
- Multi-currency support (USDC, other stablecoins)
- Advanced trust score mechanics (on-time bonus, priority payouts)
- Plan templates (savings goals, emergency funds, etc.)
- Social features (group chat, notifications)
- Emergency withdrawal mechanisms
- Secondary market for plan positions
- Integration with other DeFi protocols (yield on pooled funds)
- Enhanced sBTC bridge integration (embedded in-app)
- Mobile app (iOS/Android)
- Multi-chain expansion (Cosmos ecosystem, Layer 2s)

---

## Go-To-Market Strategy

### Target Markets (Geographic)

**Primary:**
- Nigeria
- Kenya
- Philippines
- Ghana
- India

**Rationale:** High ROSCA adoption, growing crypto awareness, mobile-first populations, banking underserved

### Distribution Channels

1. **Community Partnerships**
   - Partner with existing Ajo/Chama groups
   - Crypto communities in target regions
   - Microfinance organizations

2. **Content Marketing**
   - Educational blog posts (How ROSCAs work, Benefits of blockchain)
   - Video tutorials (YouTube, TikTok)
   - Case studies and testimonials

3. **Social Media**
   - Twitter/X (crypto community)
   - WhatsApp groups (target markets)
   - Telegram/Discord (community building)
   - Facebook groups (regional communities)

4. **Referral Program**
   - Incentivize users to invite friends
   - Bonus trust score for successful referrals
   - Group creation bonuses

5. **Events & Workshops**
   - Virtual workshops on blockchain savings
   - Partner with local crypto meetups
   - Hackathon participation for visibility

---

## Open Questions & Assumptions

### Assumptions to Validate

1. **Problem exists at scale:** Do enough people experience fraud/trust issues with traditional ROSCAs to seek blockchain alternative?

2. **Crypto adoption barrier:** Can target users adopt crypto wallets and understand basic blockchain concepts?

3. **Trust in smart contracts:** Will users trust code over human coordinators?

4. **Network effects:** Can we attract enough users to form viable groups?

5. **Payment frequency:** Is monthly the most popular frequency, or do users prefer weekly/daily?

6. **Payout preference:** Do users prefer round-robin payouts or priority based on need/trust score?

### Open Questions

1. **Monetization:** How will VoxCard generate revenue?
   - Transaction fees (0.5-1%)?
   - Premium features (private groups, analytics)?
   - DAO token launch?

2. **Governance:** Should plan rules be immutable or allow amendments with participant voting?

3. **Dispute resolution:** What happens when participants disagree on membership or payments?

4. **Insurance/Safety net:** Should there be a group insurance pool for defaults?

5. **KYC/AML:** Are there regulatory requirements for identity verification?

6. **Withdrawal mechanisms:** Should there be emergency withdrawal options before plan completion?

---

## Team & Resources

### Required Expertise
- Blockchain Developer (Clarity/Stacks)
- Frontend Developer (React/TypeScript)
- Product Manager
- Community Manager
- Marketing/Growth Lead
- Smart Contract Auditor (Clarity specialist)

### Tools & Infrastructure
- Stacks testnet/mainnet access
- GitHub for version control
- Vercel for frontend hosting
- Discord/Telegram for community
- Analytics tools (Mixpanel, Google Analytics)
- Block explorer integration (Hiro Explorer)

---

## Appendix

### Links & Resources

**Code Repository:** GitHub
- Frontend: `/voxcard/frontend`
- Smart Contract: `/voxcard/voxcard-stacks`

**Blockchain Explorer:** https://explorer.hiro.so/

**Stacks Documentation:** https://docs.stacks.co/

**@stacks/connect SDK:** https://github.com/hirosystems/connect

### Related Technologies
- Clarity: https://docs.stacks.co/clarity/
- Stacks.js: https://stacks.js.org/
- Bitcoin Layer 2: https://www.stacks.co/

---

## Document Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Oct 7, 2025 | AI Assistant | Initial PRD creation based on codebase analysis |

---

**END OF PRD**

