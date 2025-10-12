;; VoxCard Savings - Community Savings & Rotating Credit on Stacks
;; A decentralized platform for Ajo/Esusu-style savings groups with trust scoring
;; Built for the Stacks Builders Challenge - Embedded Wallet Integration with sBTC Support

;; =============================================================================
;; CONSTANTS & ERROR CODES
;; =============================================================================

;; Contract owner
(define-constant contract-owner tx-sender)

;; sBTC Token Contract (Testnet)
;; NOTE: Commented out until sBTC is available on testnet
;; (define-constant sbtc-token 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token)

;; Error codes with descriptive names
(define-constant err-owner-only (err u100))
(define-constant err-not-authorized (err u101))
(define-constant err-plan-not-found (err u102))
(define-constant err-already-participant (err u103))
(define-constant err-plan-full (err u104))
(define-constant err-insufficient-trust-score (err u105))
(define-constant err-invalid-contribution (err u106))
(define-constant err-already-contributed-this-cycle (err u107))
(define-constant err-not-participant (err u108))
(define-constant err-plan-inactive (err u109))
(define-constant err-invalid-plan-parameters (err u110))
(define-constant err-join-request-not-found (err u111))
(define-constant err-contribution-below-minimum (err u112))
(define-constant err-partial-payment-not-allowed (err u113))
(define-constant err-invalid-string-length (err u114))
(define-constant err-invalid-frequency (err u115))
(define-constant err-invalid-asset-type (err u116))

;; Plan status constants
(define-constant status-active u1)
(define-constant status-inactive u0)

;; Frequency options
(define-constant frequency-daily "Daily")
(define-constant frequency-weekly "Weekly")
(define-constant frequency-biweekly "Biweekly")
(define-constant frequency-monthly "Monthly")

;; Minimum contribution amount (100 microSTX = 0.0001 STX)
(define-constant min-contribution-amount u100)

;; Maximum participants per plan
(define-constant max-participants u100)

;; =============================================================================
;; DATA VARIABLES
;; =============================================================================

;; Global plan counter for unique IDs
(define-data-var plan-nonce uint u0)

;; Platform fee percentage (1% = 100 basis points)
(define-data-var platform-fee-bps uint u100)

;; =============================================================================
;; DATA MAPS
;; =============================================================================

;; Main plan storage
(define-map plans
    { plan-id: uint }
    {
        name: (string-utf8 100),
        description: (string-utf8 500),
        creator: principal,
        total-participants: uint,
        contribution-amount: uint,
        frequency: (string-ascii 20),
        duration-months: uint,
        trust-score-required: uint,
        allow-partial: bool,
        current-cycle: uint,
        is-active: bool,
        created-at: uint,
        asset-type: (string-ascii 10) ;; "STX" or "sBTC"
    }
)

;; Participant list per plan
(define-map plan-participants
    { plan-id: uint, participant: principal }
    {
        joined-at: uint,
        trust-score-at-join: uint,
        total-contributed: uint,
        cycles-completed: uint,
        has-received-payout: bool
    }
)

;; Join requests
(define-map join-requests
    { plan-id: uint, requester: principal }
    {
        requested-at: uint,
        trust-score: uint
    }
)

;; Cycle contributions tracking
(define-map cycle-contributions
    { plan-id: uint, participant: principal, cycle: uint }
    {
        amount-contributed: uint,
        contributed-at: uint,
        is-complete: bool
    }
)

;; User trust scores
(define-map trust-scores
    { user: principal }
    {
        score: uint,
        total-plans-joined: uint,
        total-plans-completed: uint,
        total-contributions: uint,
        last-updated: uint
    }
)

;; Index for plans by creator
(define-map creator-plans
    { creator: principal }
    {
        plan-count: uint,
        plans: (list 100 uint)
    }
)

;; Cycle recipient tracking
(define-map cycle-recipients
    { plan-id: uint, cycle: uint }
    {
        recipient: principal,
        total-pool-amount: uint,
        distributed-at: uint
    }
)

;; List of all participants for a plan (for easier querying)
(define-map plan-participant-list
    { plan-id: uint }
    {
        participants: (list 100 principal),
        participant-count: uint
    }
)

;; List of join requests for a plan
(define-map plan-join-request-list
    { plan-id: uint }
    {
        requests: (list 50 principal),
        request-count: uint
    }
)

;; =============================================================================
;; INPUT VALIDATION FUNCTIONS
;; =============================================================================

;; Validate string length for plan name
(define-private (validate-plan-name (name (string-utf8 100)))
    (if (and (> (len name) u0) (<= (len name) u100))
        true
        false
    )
)

;; Validate string length for plan description
(define-private (validate-plan-description (description (string-utf8 500)))
    (if (and (> (len description) u0) (<= (len description) u500))
        true
        false
    )
)

;; Validate frequency string
(define-private (validate-frequency (frequency (string-ascii 20)))
    (if (or
            (is-eq frequency "Daily")
            (is-eq frequency "Weekly") 
            (is-eq frequency "Biweekly")
            (is-eq frequency "Monthly")
        )
        true
        false
    )
)

;; Validate asset type
(define-private (validate-asset-type (asset-type (string-ascii 10)))
    (if (or
            (is-eq asset-type "STX")
            (is-eq asset-type "sBTC")
        )
        true
        false
    )
)

;; Validate plan parameters
(define-private (validate-plan-parameters 
    (name (string-utf8 100))
    (description (string-utf8 500))
    (total-participants uint)
    (contribution-amount uint)
    (frequency (string-ascii 20))
    (duration-months uint)
    (trust-score-required uint)
    (asset-type (string-ascii 10))
)
    (and
        (validate-plan-name name)
        (validate-plan-description description)
        (> total-participants u0)
        (<= total-participants max-participants)
        (>= contribution-amount min-contribution-amount)
        (validate-frequency frequency)
        (> duration-months u0)
        (<= duration-months u24) ;; Max 24 months
        (<= trust-score-required u100)
        (validate-asset-type asset-type)
    )
)

;; =============================================================================
;; PRIVATE FUNCTIONS
;; =============================================================================

;; Calculate trust score for a user
(define-private (calculate-trust-score (user principal))
    (let (
        (user-data (default-to 
            { score: u50, total-plans-joined: u0, total-plans-completed: u0, total-contributions: u0, last-updated: u0 }
            (map-get? trust-scores { user: user })
        ))
    )
        (get score user-data)
    )
)

;; Update user trust score after completing a cycle
(define-private (update-trust-score-on-contribution (user principal) (amount uint))
    (let (
        (current-data (default-to 
            { score: u50, total-plans-joined: u0, total-plans-completed: u0, total-contributions: u0, last-updated: burn-block-height }
            (map-get? trust-scores { user: user })
        ))
        (new-score (+ (get score current-data) u1))
        (new-total-contributions (+ (get total-contributions current-data) amount))
    )
        (map-set trust-scores
            { user: user }
            {
                score: (if (> new-score u100) u100 new-score),
                total-plans-joined: (get total-plans-joined current-data),
                total-plans-completed: (get total-plans-completed current-data),
                total-contributions: new-total-contributions,
                last-updated: burn-block-height
            }
        )
        true
    )
)

;; Decrease trust score for missing contributions
(define-private (decrease-trust-score (user principal) (penalty uint))
    (let (
        (current-data (default-to 
            { score: u50, total-plans-joined: u0, total-plans-completed: u0, total-contributions: u0, last-updated: burn-block-height }
            (map-get? trust-scores { user: user })
        ))
        (current-score (get score current-data))
        (new-score (if (> current-score penalty) (- current-score penalty) u0))
    )
        (map-set trust-scores
            { user: user }
            (merge current-data { score: new-score, last-updated: burn-block-height })
        )
        true
    )
)

;; Validate plan parameters
(define-private (validate-plan-params (total-participants uint) (contribution-amount uint) (duration-months uint))
    (and
        (> total-participants u1)
        (<= total-participants max-participants)
        (>= contribution-amount min-contribution-amount)
        (> duration-months u0)
        (<= duration-months u60)
    )
)

;; =============================================================================
;; PUBLIC FUNCTIONS - PLAN MANAGEMENT
;; =============================================================================

;; Create a new savings plan
(define-public (create-plan
    (name (string-utf8 100))
    (description (string-utf8 500))
    (total-participants uint)
    (contribution-amount uint)
    (frequency (string-ascii 20))
    (duration-months uint)
    (trust-score-required uint)
    (allow-partial bool)
    (asset-type (string-ascii 10))
)
    (let (
        (plan-id (+ (var-get plan-nonce) u1))
        (creator tx-sender)
    )
        ;; Validate all parameters using comprehensive validation
        (asserts! (and
            (validate-plan-parameters name description total-participants contribution-amount frequency duration-months trust-score-required asset-type)
            (> total-participants u1)
        ) err-invalid-plan-parameters)
        
        ;; Create the plan
        (map-set plans
            { plan-id: plan-id }
            {
                name: name,
                description: description,
                creator: creator,
                total-participants: total-participants,
                contribution-amount: contribution-amount,
                frequency: frequency,
                duration-months: duration-months,
                trust-score-required: trust-score-required,
                allow-partial: allow-partial,
                current-cycle: u1,
                is-active: true,
                created-at: burn-block-height,
                asset-type: asset-type
            }
        )
        
        ;; Initialize participant list
        (map-set plan-participant-list
            { plan-id: plan-id }
            { participants: (list), participant-count: u0 }
        )
        
        ;; Initialize join request list
        (map-set plan-join-request-list
            { plan-id: plan-id }
            { requests: (list), request-count: u0 }
        )
        
        ;; Auto-add creator as first participant
        (map-set plan-participants
            { plan-id: plan-id, participant: creator }
            {
                joined-at: burn-block-height,
                trust-score-at-join: (calculate-trust-score creator),
                total-contributed: u0,
                cycles-completed: u0,
                has-received-payout: false
            }
        )
        
        ;; Update participant list
        (map-set plan-participant-list
            { plan-id: plan-id }
            { participants: (list creator), participant-count: u1 }
        )
        
        ;; Update creator's plan index - simple approach for now
        (map-set creator-plans
            { creator: creator }
            {
                plan-count: u1,
                plans: (list plan-id)
            }
        )
        
        ;; Update creator's trust score
        (let (
            (creator-data (default-to 
                { score: u50, total-plans-joined: u1, total-plans-completed: u0, total-contributions: u0, last-updated: burn-block-height }
                (map-get? trust-scores { user: creator })
            ))
        )
            (map-set trust-scores
                { user: creator }
                {
                    score: (get score creator-data),
                    total-plans-joined: (+ (get total-plans-joined creator-data) u1),
                    total-plans-completed: (get total-plans-completed creator-data),
                    total-contributions: (get total-contributions creator-data),
                    last-updated: burn-block-height
                }
            )
        )
        
        ;; Increment nonce ONLY after all operations complete successfully
        (var-set plan-nonce plan-id)
        
        (ok plan-id)
    )
)

;; Request to join a plan
(define-public (request-to-join-plan (plan-id uint))
    (let (
        (plan (unwrap! (map-get? plans { plan-id: plan-id }) err-plan-not-found))
        (requester tx-sender)
        (user-trust-score (calculate-trust-score requester))
        (participant-list (unwrap! (map-get? plan-participant-list { plan-id: plan-id }) err-plan-not-found))
        (request-list (unwrap! (map-get? plan-join-request-list { plan-id: plan-id }) err-plan-not-found))
    )
        ;; Validations
        (asserts! (get is-active plan) err-plan-inactive)
        (asserts! (< (get participant-count participant-list) (get total-participants plan)) err-plan-full)
        (asserts! (>= user-trust-score (get trust-score-required plan)) err-insufficient-trust-score)
        (asserts! (is-none (map-get? plan-participants { plan-id: plan-id, participant: requester })) err-already-participant)
        (asserts! (is-none (map-get? join-requests { plan-id: plan-id, requester: requester })) err-already-participant)
        
        ;; Add join request
        (map-set join-requests
            { plan-id: plan-id, requester: requester }
            {
                requested-at: burn-block-height,
                trust-score: user-trust-score
            }
        )
        
        ;; Update request list
        (map-set plan-join-request-list
            { plan-id: plan-id }
            {
                requests: (unwrap-panic (as-max-len? (append (get requests request-list) requester) u50)),
                request-count: (+ (get request-count request-list) u1)
            }
        )
        
        (ok true)
    )
)

;; Approve a join request (creator only)
(define-public (approve-join-request (plan-id uint) (requester principal))
    (let (
        (plan (unwrap! (map-get? plans { plan-id: plan-id }) err-plan-not-found))
        (join-request (unwrap! (map-get? join-requests { plan-id: plan-id, requester: requester }) err-join-request-not-found))
        (participant-list (unwrap! (map-get? plan-participant-list { plan-id: plan-id }) err-plan-not-found))
    )
        ;; Only creator can approve
        (asserts! (is-eq tx-sender (get creator plan)) err-not-authorized)
        (asserts! (< (get participant-count participant-list) (get total-participants plan)) err-plan-full)
        
        ;; Add participant
        (map-set plan-participants
            { plan-id: plan-id, participant: requester }
            {
                joined-at: burn-block-height,
                trust-score-at-join: (get trust-score join-request),
                total-contributed: u0,
                cycles-completed: u0,
                has-received-payout: false
            }
        )
        
        ;; Update participant list
        (map-set plan-participant-list
            { plan-id: plan-id }
            {
                participants: (unwrap-panic (as-max-len? (append (get participants participant-list) requester) u100)),
                participant-count: (+ (get participant-count participant-list) u1)
            }
        )
        
        ;; Remove join request
        (map-delete join-requests { plan-id: plan-id, requester: requester })
        
        ;; Update user's trust score stats
        (let (
            (user-data (default-to 
                { score: u50, total-plans-joined: u1, total-plans-completed: u0, total-contributions: u0, last-updated: burn-block-height }
                (map-get? trust-scores { user: requester })
            ))
        )
            (map-set trust-scores
                { user: requester }
                {
                    score: (get score user-data),
                    total-plans-joined: (+ (get total-plans-joined user-data) u1),
                    total-plans-completed: (get total-plans-completed user-data),
                    total-contributions: (get total-contributions user-data),
                    last-updated: burn-block-height
                }
            )
        )
        
        (ok true)
    )
)

;; Deny a join request (creator only)
(define-public (deny-join-request (plan-id uint) (requester principal))
    (let (
        (plan (unwrap! (map-get? plans { plan-id: plan-id }) err-plan-not-found))
    )
        ;; Only creator can deny
        (asserts! (is-eq tx-sender (get creator plan)) err-not-authorized)
        (asserts! (is-some (map-get? join-requests { plan-id: plan-id, requester: requester })) err-join-request-not-found)
        
        ;; Remove join request
        (map-delete join-requests { plan-id: plan-id, requester: requester })
        
        (ok true)
    )
)

;; =============================================================================
;; PUBLIC FUNCTIONS - CONTRIBUTIONS
;; =============================================================================

;; Make a contribution to a plan
(define-public (contribute (plan-id uint) (amount uint))
    (let (
        (plan (unwrap! (map-get? plans { plan-id: plan-id }) err-plan-not-found))
        (contributor tx-sender)
        (current-cycle (get current-cycle plan))
        (participant (unwrap! (map-get? plan-participants { plan-id: plan-id, participant: contributor }) err-not-participant))
        (cycle-contribution (map-get? cycle-contributions { plan-id: plan-id, participant: contributor, cycle: current-cycle }))
    )
        ;; Validations
        (asserts! (get is-active plan) err-plan-inactive)
        (asserts! (>= amount min-contribution-amount) err-contribution-below-minimum)
        
        ;; Check if partial payments are allowed
        (if (get allow-partial plan)
            ;; Partial payments allowed - can contribute any amount >= minimum
            (asserts! (>= amount min-contribution-amount) err-contribution-below-minimum)
            ;; Full payment required
            (asserts! (is-eq amount (get contribution-amount plan)) err-partial-payment-not-allowed)
        )
        
        ;; Calculate total contributed in this cycle
        (let (
            (existing-contribution (default-to { amount-contributed: u0, contributed-at: u0, is-complete: false } cycle-contribution))
            (previous-contribution (get amount-contributed existing-contribution))
            (new-total (+ previous-contribution amount))
            (is-complete (>= new-total (get contribution-amount plan)))
        )
            ;; Transfer STX to contract
            (try! (stx-transfer? amount contributor (as-contract tx-sender)))
            
            ;; Update cycle contribution
            (map-set cycle-contributions
                { plan-id: plan-id, participant: contributor, cycle: current-cycle }
                {
                    amount-contributed: new-total,
                    contributed-at: burn-block-height,
                    is-complete: is-complete
                }
            )
            
            ;; Update participant stats if cycle complete
            (if is-complete
                (begin
                    (map-set plan-participants
                        { plan-id: plan-id, participant: contributor }
                        (merge participant 
                            { 
                                total-contributed: (+ (get total-contributed participant) new-total),
                                cycles-completed: (+ (get cycles-completed participant) u1)
                            }
                        )
                    )
                    (update-trust-score-on-contribution contributor amount)
                )
                true
            )
            
            (ok { contributed: amount, total-this-cycle: new-total, is-complete: is-complete })
        )
    )
)

;; Make an sBTC contribution to a plan
;; NOTE: Temporarily commented out until sBTC is available on testnet
;; (define-public (contribute-sbtc (plan-id uint) (amount uint))
;;     (let (
;;         (plan (unwrap! (map-get? plans { plan-id: plan-id }) err-plan-not-found))
;;         (contributor tx-sender)
;;         (current-cycle (get current-cycle plan))
;;         (participant (unwrap! (map-get? plan-participants { plan-id: plan-id, participant: contributor }) err-not-participant))
;;         (cycle-contribution (map-get? cycle-contributions { plan-id: plan-id, participant: contributor, cycle: current-cycle }))
;;     )
;;         ;; Validations
;;         (asserts! (get is-active plan) err-plan-inactive)
;;         (asserts! (is-eq (get asset-type plan) "sBTC") err-invalid-contribution)
;;         (asserts! (>= amount min-contribution-amount) err-contribution-below-minimum)
;;         
;;         ;; Check if partial payments are allowed
;;         (if (get allow-partial plan)
;;             (asserts! (>= amount min-contribution-amount) err-contribution-below-minimum)
;;             (asserts! (is-eq amount (get contribution-amount plan)) err-partial-payment-not-allowed)
;;         )
;;         
;;         ;; Calculate total contributed in this cycle
;;         (let (
;;             (existing-contribution (default-to { amount-contributed: u0, contributed-at: u0, is-complete: false } cycle-contribution))
;;             (previous-contribution (get amount-contributed existing-contribution))
;;             (new-total (+ previous-contribution amount))
;;             (is-complete (>= new-total (get contribution-amount plan)))
;;         )
;;             ;; Transfer sBTC to contract using SIP-010 transfer
;;             (try! (contract-call? sbtc-token transfer amount contributor (as-contract tx-sender) none))
;;             
;;             ;; Update cycle contribution
;;             (map-set cycle-contributions
;;                 { plan-id: plan-id, participant: contributor, cycle: current-cycle }
;;                 {
;;                     amount-contributed: new-total,
;;                     contributed-at: burn-block-height,
;;                     is-complete: is-complete
;;                 }
;;             )
;;             
;;             ;; Update participant stats if cycle complete
;;             (if is-complete
;;                 (begin
;;                     (map-set plan-participants
;;                         { plan-id: plan-id, participant: contributor }
;;                         (merge participant 
;;                             { 
;;                                 total-contributed: (+ (get total-contributed participant) new-total),
;;                                 cycles-completed: (+ (get cycles-completed participant) u1)
;;                             }
;;                         )
;;                     )
;;                     (update-trust-score-on-contribution contributor amount)
;;                 )
;;                 true
;;             )
;;             
;;             (ok { contributed: amount, total-this-cycle: new-total, is-complete: is-complete })
;;         )
;;     )
;; )

;; =============================================================================
;; READ-ONLY FUNCTIONS
;; =============================================================================

;; Get plan details
(define-read-only (get-plan (plan-id uint))
    (ok (map-get? plans { plan-id: plan-id }))
)

;; Get plan count
(define-read-only (get-plan-count)
    (ok (var-get plan-nonce))
)

;; Get plans by creator
(define-read-only (get-plans-by-creator (creator principal))
    ;; Use the creator-plans index to efficiently retrieve plans
    (let (
        (creator-data (default-to 
            { plan-count: u0, plans: (list) }
            (map-get? creator-plans { creator: creator })
        ))
        (plan-ids (get plans creator-data))
    )
        (ok plan-ids)
    )
)

;; Get participant cycle status
(define-read-only (get-participant-cycle-status (plan-id uint) (participant principal))
    (let (
        (plan (unwrap! (map-get? plans { plan-id: plan-id }) err-plan-not-found))
        (current-cycle (get current-cycle plan))
        (contribution (default-to 
            { amount-contributed: u0, contributed-at: u0, is-complete: false }
            (map-get? cycle-contributions { plan-id: plan-id, participant: participant, cycle: current-cycle })
        ))
        (required-amount (get contribution-amount plan))
    )
        (ok {
            contributed-this-cycle: (get amount-contributed contribution),
            remaining-this-cycle: (if (>= (get amount-contributed contribution) required-amount)
                u0
                (- required-amount (get amount-contributed contribution))
            ),
            is-complete: (get is-complete contribution)
        })
    )
)

;; Get user trust score
(define-read-only (get-trust-score (user principal))
    (ok (calculate-trust-score user))
)

;; Get trust score details
(define-read-only (get-trust-score-details (user principal))
    (ok (map-get? trust-scores { user: user }))
)

;; Get join requests for a plan
(define-read-only (get-join-requests (plan-id uint))
    (let (
        (request-list (map-get? plan-join-request-list { plan-id: plan-id }))
    )
        (ok (if (is-some request-list)
            (get requests (unwrap-panic request-list))
            (list)
        ))
    )
)

;; Get participants for a plan
(define-read-only (get-plan-participants (plan-id uint))
    (let (
        (participant-list (map-get? plan-participant-list { plan-id: plan-id }))
    )
        (ok (if (is-some participant-list)
            (get participants (unwrap-panic participant-list))
            (list)
        ))
    )
)

;; Check if user is participant
(define-read-only (is-participant (plan-id uint) (user principal))
    (ok (is-some (map-get? plan-participants { plan-id: plan-id, participant: user })))
)

;; Get participant details
(define-read-only (get-participant-details (plan-id uint) (participant principal))
    (ok (map-get? plan-participants { plan-id: plan-id, participant: participant }))
)

;; Get platform fee
(define-read-only (get-platform-fee-bps)
    (ok (var-get platform-fee-bps))
)

;; Note: For sBTC balances, query the sBTC token contract directly from frontend
;; Read-only functions cannot contain contract-call? as they may have side effects

;; =============================================================================
;; ADMIN FUNCTIONS
;; =============================================================================

;; Update platform fee (owner only)
(define-public (set-platform-fee-bps (new-fee-bps uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (<= new-fee-bps u1000) err-invalid-plan-parameters) ;; Max 10%
        (var-set platform-fee-bps new-fee-bps)
        (ok true)
    )
)

;; Emergency pause a plan (owner only)
(define-public (pause-plan (plan-id uint))
    (let (
        (plan (unwrap! (map-get? plans { plan-id: plan-id }) err-plan-not-found))
    )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (map-set plans
            { plan-id: plan-id }
            (merge plan { is-active: false })
        )
        (ok true)
    )
)

;; Reactivate a paused plan (owner only)
(define-public (reactivate-plan (plan-id uint))
    (let (
        (plan (unwrap! (map-get? plans { plan-id: plan-id }) err-plan-not-found))
    )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (map-set plans
            { plan-id: plan-id }
            (merge plan { is-active: true })
        )
        (ok true)
    )
)
